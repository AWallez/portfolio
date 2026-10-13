import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cfg = vi.hoisted(() => ({
  config: {
    ntfy: {
      url: "http://ntfy.local/",
      topic: "contact",
      token: "tk_test" as string | undefined,
    },
  },
}));
vi.mock("./config", () => cfg);

const { notifyContact } = await import("./notifier");

const CONTACT = {
  firstname: "Marie",
  lastname: "Dupont",
  email: "marie@example.com",
  type: "project",
  phone: "+33612345678",
  message: "Bonjour",
};

describe("notifyContact", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    cfg.config.ntfy.token = "tk_test";
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const envoi = () => {
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    return {
      url,
      entetes: init.headers as Record<string, string>,
      corps: JSON.parse(String(init.body)) as Record<string, unknown>,
    };
  };

  it("publie sur le topic, authentifié, sans la barre finale de l'URL", async () => {
    await notifyContact(CONTACT);
    const { url, entetes, corps } = envoi();
    expect(url).toBe("http://ntfy.local");
    expect(entetes.Authorization).toBe("Bearer tk_test");
    expect(corps.topic).toBe("contact");
    expect(corps.title).toBe("Marie Dupont");
    expect(String(corps.message)).toContain("marie@example.com · +33612345678");
    expect(String(corps.message)).toContain("Bonjour");
  });

  it("n'envoie pas d'en-tête d'auth sans jeton", async () => {
    cfg.config.ntfy.token = undefined;
    await notifyContact(CONTACT);
    expect(envoi().entetes.Authorization).toBeUndefined();
  });

  it("signale un message non enregistré dans le titre", async () => {
    await notifyContact({ ...CONTACT, unsaved: true });
    expect(envoi().corps.title).toBe("⚠️ Non enregistré · Marie Dupont");
  });

  it("échoue si ntfy refuse", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 403 }));
    await expect(notifyContact(CONTACT)).rejects.toThrow("ntfy a répondu 403");
  });
});
