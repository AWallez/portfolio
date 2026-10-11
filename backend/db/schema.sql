-- Table des messages reçus via le formulaire de contact.
CREATE TABLE IF NOT EXISTS contacts (
  id          BIGSERIAL PRIMARY KEY,
  firstname   TEXT NOT NULL,
  lastname    TEXT NOT NULL,
  email       TEXT NOT NULL,
  type        TEXT NOT NULL,
  phone       TEXT,
  message     TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ajoute la colonne phone si la table existait déjà sans (idempotent)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;

-- index pour retrouver les messages récents rapidement
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts (created_at DESC);

-- Champs CRM (outil admin) — ajouts idempotents.
-- Statuts valides (validés côté application) : non_lu, en_attente, a_recontacter, valide.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'non_lu';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
-- leads ajoutés à la main (Malt/LinkedIn/téléphone) : email et message optionnels
ALTER TABLE contacts ALTER COLUMN email DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN message DROP NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts (status);

-- Origine du contact : formulaire du site, ou saisie manuelle dans le CRM.
-- ⚠️ L'admin DÉDUISAIT cette information de `ip IS NULL`, ce qui devient faux dès
-- que la purge RGPD anonymise un message reçu (backend/src/retention.ts) : au bout
-- d'un an, tous les vrais messages passeraient pour des saisies manuelles. D'où
-- une colonne explicite, que la purge ne touche pas.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS manual BOOLEAN;
-- Reprise des lignes existantes. Le `WHERE manual IS NULL` rend l'opération
-- auto-limitante : une ré-exécution après le premier passage de la purge ne
-- reclassera pas en « manuel » des lignes fraîchement anonymisées.
UPDATE contacts SET manual = (ip IS NULL) WHERE manual IS NULL;
ALTER TABLE contacts ALTER COLUMN manual SET DEFAULT false;
ALTER TABLE contacts ALTER COLUMN manual SET NOT NULL;

-- Purge RGPD (appelée chaque jour par l'API, backend/src/retention.ts).
-- En SQL et en SECURITY DEFINER pour que l'API n'ait besoin que d'INSERT sur la
-- table : sans lire les messages ni pouvoir en supprimer d'autres, elle déclenche
-- une purge dont les durées sont figées ici. Ces durées sont annoncées dans la
-- politique de confidentialité (frontend/src/i18n/legal.ts) : garder les deux
-- cohérentes.
--  - ip / user_agent : collectés pour la sécurité (anti-spam), finalité éteinte
--    au bout d'un an → effacés, le message est gardé (anonymiser suffit).
--  - le contact : 3 ans à compter de sa réception (référence CNIL pour la
--    prospection). Compté depuis `created_at`, jamais `updated_at` : modifier une
--    note du CRM ne doit pas relancer le délai d'un prospect qui n'a plus écrit.
CREATE OR REPLACE FUNCTION purge_contacts(OUT anonymized integer, OUT deleted integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE contacts SET ip = NULL, user_agent = NULL
   WHERE created_at < now() - interval '1 year'
     AND (ip IS NOT NULL OR user_agent IS NOT NULL);
  GET DIAGNOSTICS anonymized = ROW_COUNT;
  DELETE FROM contacts WHERE created_at < now() - interval '3 years';
  GET DIAGNOSTICS deleted = ROW_COUNT;
END $$;
REVOKE ALL ON FUNCTION purge_contacts() FROM PUBLIC;
