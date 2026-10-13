import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// configuration modifiable test par test (secret présent ou non)
const cfg = vi.hoisted(() => ({
  config: { turnstileSecret: "secret-test" as string | undefined },
}));
vi.mock("./config", () => cfg);

const { verifyTurnstile } = await import("./turnstile");

const reponse = (corps: unknown) =>
  Promise.resolve(new Response(JSON.stringify(corps)));

describe("verifyTurnstile", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    cfg.config.turnstileSecret = "secret-test";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("laisse passer sans secret configuré, sans appeler Cloudflare", async () => {
    cfg.config.turnstileSecret = undefined;
    expect(await verifyTurnstile(undefined)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse un envoi sans jeton", async () => {
    expect(await verifyTurnstile(undefined)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepte un jeton validé, en transmettant secret, jeton et IP", async () => {
    fetchMock.mockReturnValue(reponse({ success: true }));
    expect(await verifyTurnstile("jeton", "203.0.113.7")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("challenges.cloudflare.com/turnstile/v0/siteverify");
    const corps = new URLSearchParams(String(init.body));
    expect(corps.get("secret")).toBe("secret-test");
    expect(corps.get("response")).toBe("jeton");
    expect(corps.get("remoteip")).toBe("203.0.113.7");
  });

  it("refuse un jeton rejeté par Cloudflare", async () => {
    fetchMock.mockReturnValue(
      reponse({ success: false, "error-codes": ["invalid-input-response"] }),
    );
    expect(await verifyTurnstile("jeton")).toBe(false);
  });

  it("refuse si Cloudflare est injoignable (fail-closed)", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    expect(await verifyTurnstile("jeton")).toBe(false);
  });
});
