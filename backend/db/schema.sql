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
