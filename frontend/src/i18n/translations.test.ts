import { describe, it, expect } from "vitest";
import { translations, t } from "./translations";

describe("translations", () => {
  it("renvoie la bonne langue pour une clé donnée", () => {
    expect(t("nav", "about", "fr")).toBe("À propos");
    expect(t("nav", "about", "en")).toBe("About");
  });

  it("a une version FR et EN non vide pour chaque clé", () => {
    for (const [section, keys] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(keys)) {
        const v = value as { fr?: unknown; en?: unknown };
        expect(typeof v.fr, `${section}.${key}.fr`).toBe("string");
        expect(typeof v.en, `${section}.${key}.en`).toBe("string");
        expect((v.fr as string).length, `${section}.${key}.fr`).toBeGreaterThan(
          0,
        );
        expect((v.en as string).length, `${section}.${key}.en`).toBeGreaterThan(
          0,
        );
      }
    }
  });
});
