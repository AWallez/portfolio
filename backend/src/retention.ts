// Purge RGPD de la table `contacts`.
//
// Le RGPD impose une limitation de conservation (art. 5.1.e) : une donnée
// personnelle ne peut pas être gardée indéfiniment « au cas où ». Deux durées
// distinctes, parce que les champs n'ont pas la même finalité :
//
//  - ip / user_agent : collectés pour la sécurité (anti-spam, traçage d'abus).
//    Cette finalité est éteinte au bout de quelques mois → on les efface, mais
//    on GARDE le message : anonymiser suffit, supprimer serait excessif.
//  - le contact lui-même : conservé au titre de la prospection commerciale.
//    La CNIL retient 3 ans à compter du dernier contact comme durée de
//    référence — au-delà, la ligne part.
//
// Ces durées sont annoncées dans la politique de confidentialité du site
// (frontend/src/i18n/legal.ts) : les deux doivent rester cohérentes.

import { pool } from "./db";

export const ANONYMIZE_AFTER = "1 year";
export const DELETE_AFTER = "3 years";

export type PurgeResult = { anonymized: number; deleted: number };

/**
 * Applique les deux durées de conservation. Idempotent : les lignes déjà
 * traitées ne ressortent pas (d'où le filtre sur ip/user_agent non nuls).
 */
export async function purgeContacts(): Promise<PurgeResult> {
  const anonymized = await pool.query(
    `UPDATE contacts
        SET ip = NULL, user_agent = NULL
      WHERE created_at < now() - $1::interval
        AND (ip IS NOT NULL OR user_agent IS NOT NULL)`,
    [ANONYMIZE_AFTER],
  );

  // Le délai court depuis `created_at`, jamais depuis `updated_at` : la CNIL
  // compte à partir du dernier contact ÉMANANT DU PROSPECT, pas d'une action de
  // notre côté. Relancer le compteur en modifiant une note du CRM reviendrait à
  // conserver indéfiniment quelqu'un qui ne nous a plus jamais écrit.
  // Une nouvelle prise de contact crée une nouvelle ligne, avec son propre
  // délai : le compte est donc juste, message par message.
  const deleted = await pool.query(
    `DELETE FROM contacts WHERE created_at < now() - $1::interval`,
    [DELETE_AFTER],
  );

  return { anonymized: anonymized.rowCount ?? 0, deleted: deleted.rowCount ?? 0 };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Planifie la purge : une passe au démarrage (le conteneur peut avoir été
 * arrêté plusieurs jours), puis une fois par jour.
 *
 * Renvoie de quoi arrêter la planification — utile en test, et pour que le
 * timer ne retienne pas le process au moment de l'arrêt.
 */
export function schedulePurge(log: {
  info: (o: unknown, msg?: string) => void;
  error: (o: unknown, msg?: string) => void;
}): () => void {
  const run = () =>
    purgeContacts()
      .then((r) => {
        // silencieux quand il n'y a rien à faire : le cas normal
        if (r.anonymized || r.deleted) log.info(r, "purge RGPD appliquée");
      })
      // une purge qui échoue ne doit pas faire tomber l'API
      .catch((err) => log.error(err, "purge RGPD échouée"));

  run();
  const timer = setInterval(run, DAY_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
