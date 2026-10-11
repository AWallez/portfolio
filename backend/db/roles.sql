-- Comptes applicatifs à moindre privilège, appliqués après schema.sql par
-- db/migrate.sh (compte propriétaire). Idempotent : REVOKE puis GRANT donne
-- toujours le même état, quel que soit l'historique de la base.
--
-- Les mots de passe ne sont PAS ici : ils viennent d'infra/.env
-- (API_DB_PASSWORD, ADMIN_DB_PASSWORD), seule source de vérité. Une base
-- reconstruite de zéro retrouve ainsi ses comptes sans étape à la main.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'api_app') THEN
    CREATE ROLE api_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin_app') THEN
    CREATE ROLE admin_app LOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO api_app, admin_app;

-- API publique (portfolio-api) : enregistrer un message, et déclencher la purge
-- RGPD. Rien d'autre : une faille de l'API ne permet ni de lire les messages
-- reçus ni d'en supprimer. Avant : superutilisateur PostgreSQL, donc tout, y
-- compris un shell dans le conteneur postgres.
REVOKE ALL ON contacts FROM api_app;
REVOKE ALL ON SEQUENCE contacts_id_seq FROM api_app;
GRANT INSERT ON contacts TO api_app;
GRANT USAGE ON SEQUENCE contacts_id_seq TO api_app;
GRANT EXECUTE ON FUNCTION purge_contacts() TO api_app;

-- Back-office (portfolio-admin, LAN/VPN) : le CRM lit et modifie les contacts.
REVOKE ALL ON contacts FROM admin_app;
REVOKE ALL ON SEQUENCE contacts_id_seq FROM admin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO admin_app;
GRANT USAGE, SELECT ON SEQUENCE contacts_id_seq TO admin_app;

-- Mots de passe, lus dans l'environnement du conteneur de migration (posé par
-- compose depuis infra/.env). Variable absente ou vide = mot de passe inchangé :
-- ne jamais remplacer un vrai mot de passe par une chaîne vide.
\set api_pw ''
\set admin_pw ''
\getenv api_pw API_DB_PASSWORD
\getenv admin_pw ADMIN_DB_PASSWORD
SELECT :'api_pw' <> '' AS has_api_pw, :'admin_pw' <> '' AS has_admin_pw \gset
\if :has_api_pw
ALTER ROLE api_app PASSWORD :'api_pw';
\endif
\if :has_admin_pw
ALTER ROLE admin_app PASSWORD :'admin_pw';
\endif
