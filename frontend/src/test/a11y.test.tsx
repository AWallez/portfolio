import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { LangProvider } from "../i18n/LangContext";
import Footer from "../components/Footer";
import Contact from "../components/Contact";
import Lightbox from "../components/Lightbox";

// Smoke a11y : verrouille l'audit WCAG (axe ignore le contraste en jsdom — pas de
// layout — mais couvre labels, rôles, aria, noms accessibles…).
// Header et les sections plein écran sont exclus : sans CSS, jsdom rend les 2 navs
// responsives en même temps → faux positif "landmark-unique".
describe("a11y (axe)", () => {
  it("Footer : aucune violation", async () => {
    const { container } = render(
      <LangProvider>
        <Footer />
      </LangProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Contact : aucune violation", async () => {
    const { container } = render(
      <LangProvider>
        <Contact />
      </LangProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Lightbox : aucune violation", async () => {
    render(
      <LangProvider>
        <Lightbox
          light="<svg></svg>"
          dark="<svg></svg>"
          title="Projet"
          onClose={() => {}}
        />
      </LangProvider>,
    );
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  });
});
