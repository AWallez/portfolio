import { describe, it, expect } from "vitest";
import { dimensionsCv } from "./cvDimensions";

const A4 = 595.3 / 841.9; // proportions du SVG produit par pdftocairo

describe("dimensionsCv", () => {
  // Le défaut corrigé : le CV était réduit pour tenir entier en hauteur, soit
  // 440 px de large sur ce portable alors que la fenêtre en offrait 866.
  it("portable 1366 × 768 : toute la largeur, et la hauteur se fait défiler", () => {
    const d = dimensionsCv(A4, { w: 1366, h: 768 });
    expect(d.largeur).toBe(866);
    expect(d.hauteur).toBe(Math.round(866 / A4));
    expect(d.zone).toBe(768 - 64 - 87);
    expect(d.zone).toBeLessThan(d.hauteur);
  });

  it("téléphone en paysage : toute la largeur, et non une vignette", () => {
    const d = dimensionsCv(A4, { w: 844, h: 390 });
    expect(d.largeur).toBe(844 - 64 - 30);
    expect(d.zone).toBeLessThan(d.hauteur);
  });

  it("téléphone en portrait : la largeur de l'écran, le CV tient entier", () => {
    const d = dimensionsCv(A4, { w: 390, h: 844 });
    expect(d.largeur).toBe(390 - 24 - 30);
    expect(d.zone).toBe(d.hauteur);
  });

  it("grand écran : plafonné à la largeur de la fenêtre, rien à faire défiler", () => {
    const d = dimensionsCv(A4, { w: 3840, h: 2160 });
    expect(d.largeur).toBe(896 - 30);
    expect(d.zone).toBe(d.hauteur);
  });

  it("ne renvoie jamais de taille négative", () => {
    const d = dimensionsCv(A4, { w: 40, h: 60 });
    expect(d.largeur).toBe(0);
    expect(d.zone).toBe(0);
  });
});
