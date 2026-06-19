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
