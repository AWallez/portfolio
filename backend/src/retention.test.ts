import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Même approche que contact.test.ts : PostgreSQL simulé, on teste la logique.
const query = vi.fn();
vi.mock("./db", () => ({ pool: { query: (...a: unknown[]) => query(...a) } }));

const { purgeContacts, schedulePurge } = await import("./retention");

const log = { info: vi.fn(), error: vi.fn() };

beforeEach(() => {
  query.mockReset().mockResolvedValue({ rows: [{ anonymized: 0, deleted: 0 }] });
  log.info.mockReset();
  log.error.mockReset();
});

// Les requêtes de purge sont dans la fonction SQL purge_contacts() : on vérifie
// son texte, tel qu'il sera appliqué par la migration.
const schema = readFileSync(
  fileURLToPath(new URL("../db/schema.sql", import.meta.url)),
  "utf8",
);
const fn = schema.slice(
  schema.indexOf("CREATE OR REPLACE FUNCTION purge_contacts"),
  schema.indexOf("END $$;"),
);
const [anonymizeSql, deleteSql] = fn
  .split(";")
  .filter((s) => /UPDATE contacts|DELETE FROM contacts/.test(s));

describe("purge_contacts() (schema.sql)", () => {
  it("anonymise ip/user_agent au bout d'un an, sans supprimer la ligne", () => {
    expect(anonymizeSql).toMatch(/UPDATE contacts SET ip = NULL, user_agent = NULL/);
    expect(anonymizeSql).toMatch(/interval '1 year'/);
    expect(anonymizeSql).not.toMatch(/DELETE/);
  });

  it("ne repasse pas sur les lignes déjà anonymisées", () => {
    expect(anonymizeSql).toMatch(/ip IS NOT NULL OR user_agent IS NOT NULL/);
  });

  it("supprime les contacts au bout de 3 ans", () => {
    expect(deleteSql).toMatch(/DELETE FROM contacts/);
    expect(deleteSql).toMatch(/interval '3 years'/);
  });

  it("fait courir le délai de suppression depuis la réception, pas depuis le CRM", () => {
    // la CNIL compte depuis le dernier contact émanant du prospect : repartir
    // sur `updated_at` laisserait une note retouchée prolonger la conservation
    expect(deleteSql).toMatch(/created_at < now\(\)/);
    expect(deleteSql).not.toMatch(/updated_at/);
  });

  it("tourne avec les droits du propriétaire et un search_path fixé", () => {
    // sans search_path figé, une fonction SECURITY DEFINER peut être détournée
    expect(fn).toMatch(/SECURITY DEFINER SET search_path = public, pg_temp/);
  });
});

describe("purgeContacts", () => {
  it("appelle la fonction SQL et remonte le nombre de lignes traitées", async () => {
    query.mockResolvedValueOnce({ rows: [{ anonymized: 3, deleted: 2 }] });
    await expect(purgeContacts()).resolves.toEqual({ anonymized: 3, deleted: 2 });
    expect(query.mock.calls[0][0]).toMatch(/FROM purge_contacts\(\)/);
  });
});

describe("schedulePurge", () => {
  it("purge dès le démarrage", async () => {
    const stop = schedulePurge(log);
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    stop();
  });

  it("ne journalise rien quand il n'y a rien à purger", async () => {
    const stop = schedulePurge(log);
    await vi.waitFor(() => expect(query).toHaveBeenCalled());
    expect(log.info).not.toHaveBeenCalled();
    stop();
  });

  it("survit à une erreur SQL sans faire tomber l'API", async () => {
    query.mockRejectedValue(new Error("connexion perdue"));
    const stop = schedulePurge(log);
    await vi.waitFor(() => expect(log.error).toHaveBeenCalled());
    stop();
  });
});
