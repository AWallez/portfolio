import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY, sendContact, validate, type Fields } from "./contactForm";

const VALIDE: Fields = {
  firstname: "Marie",
  lastname: "Dupont",
  email: "marie.dupont@exemple.fr",
  type: "project",
  phone: "",
  message: "Bonjour",
};

describe("validate", () => {
  it("signale chaque champ requis vide, pas le téléphone (optionnel)", () => {
    expect(validate(EMPTY)).toEqual({
      firstname: "errRequired",
      lastname: "errRequired",
      email: "errRequired",
      type: "errType",
      message: "errRequired",
    });
  });

  it("ne compte pas des espaces comme une saisie", () => {
    expect(validate({ ...VALIDE, firstname: "   " }).firstname).toBe(
      "errRequired",
    );
  });

  it("refuse une adresse sans domaine", () => {
    expect(validate({ ...VALIDE, email: "marie@exemple" }).email).toBe(
      "errEmail",
    );
  });

  it("ne valide le téléphone que s'il est renseigné", () => {
    expect(validate({ ...VALIDE, phone: "+3312" }).phone).toBe("errPhone");
    expect(validate({ ...VALIDE, phone: "+33612345678" })).toEqual({});
  });

  it("accepte un formulaire complet", () => {
    expect(validate(VALIDE)).toEqual({});
  });
});

describe("sendContact", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const repond = (status: number, corps: unknown = {}) =>
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(corps), { status }),
    );

  it("envoie le formulaire et le jeton anti-robot à /api/contact", async () => {
    repond(201);
    expect(await sendContact(VALIDE, "jeton", false)).toBe("sent");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/contact$/);
    expect(JSON.parse(String(init.body))).toEqual({
      ...VALIDE,
      cfTurnstileToken: "jeton",
    });
  });

  it("donne une cause par échec", async () => {
    repond(429);
    expect(await sendContact(VALIDE, "", false)).toBe("errRate");
    repond(400, { error: "captcha" });
    expect(await sendContact(VALIDE, "", false)).toBe("errCaptcha");
    repond(500);
    expect(await sendContact(VALIDE, "", false)).toBe("errServer");
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await sendContact(VALIDE, "", false)).toBe("errNetwork");
  });

  it("explique un refus anti-robot par le blocage du script", async () => {
    repond(400, { error: "captcha" });
    expect(await sendContact(VALIDE, "", true)).toBe("errCaptchaBlocked");
  });
});
