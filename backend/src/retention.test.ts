import { describe, it, expect, vi, beforeEach } from "vitest";

// Même approche que contact.test.ts : PostgreSQL simulé, on teste la logique.
const query = vi.fn();
vi.mock("./db", () => ({ pool: { query: (...a: unknown[]) => query(...a) } }));

const { purgeContacts, schedulePurge, ANONYMIZE_AFTER, DELETE_AFTER } =
  await import("./retention");

const log = { info: vi.fn(), error: vi.fn() };

beforeEach(() => {
  query.mockReset().mockResolvedValue({ rowCount: 0 });
  log.info.mockReset();
  log.error.mockReset();
});

describe("purgeContacts", () => {
  it("anonymise ip/user_agent au-delà du délai, sans supprimer la ligne", async () => {
    await purgeContacts();
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/UPDATE contacts/);
    expect(sql).toMatch(/ip = NULL, user_agent = NULL/);
    expect(sql).not.toMatch(/DELETE/);
    expect(params).toEqual([ANONYMIZE_AFTER]);
  });

  it("ne repasse pas sur les lignes déjà anonymisées", async () => {
    await purgeContacts();
    expect(query.mock.calls[0][0]).toMatch(
      /ip IS NOT NULL OR user_agent IS NOT NULL/,
    );
  });

  it("supprime les contacts au-delà du délai de prospection", async () => {
    await purgeContacts();
    const [sql, params] = query.mock.calls[1];
    expect(sql).toMatch(/DELETE FROM contacts/);
    expect(params).toEqual([DELETE_AFTER]);
  });

  it("fait courir le délai de suppression depuis la réception, pas depuis le CRM", async () => {
    // la CNIL compte depuis le dernier contact émanant du prospect : repartir
    // sur `updated_at` laisserait une note retouchée prolonger la conservation
    await purgeContacts();
    expect(query.mock.calls[1][0]).toMatch(/created_at < now\(\)/);
    expect(query.mock.calls[1][0]).not.toMatch(/updated_at/);
  });

  it("remonte le nombre de lignes traitées", async () => {
    query
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rowCount: 2 });
    await expect(purgeContacts()).resolves.toEqual({
      anonymized: 3,
      deleted: 2,
    });
  });
});

describe("schedulePurge", () => {
  it("purge dès le démarrage", async () => {
    const stop = schedulePurge(log);
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(2));
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
