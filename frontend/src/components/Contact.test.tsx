import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LangProvider } from "../i18n/LangContext";
import Contact from "./Contact";

function renderContact() {
  return render(
    <LangProvider>
      <Contact />
    </LangProvider>,
  );
}

describe("<Contact />", () => {
  it("affiche des erreurs de validation quand on envoie le formulaire vide", async () => {
    const user = userEvent.setup();
    renderContact();

    await user.click(screen.getByRole("button", { name: /envoyer|send/i }));

    // au moins une erreur "champ requis" doit apparaître
    const errors = await screen.findAllByText(/requis|required/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejette une adresse email invalide", async () => {
    const user = userEvent.setup();
    renderContact();

    await user.type(screen.getByLabelText(/prénom|first name/i), "Jean");
    await user.type(screen.getByLabelText(/nom|last name/i), "Dupont");
    await user.type(screen.getByLabelText(/email/i), "pas-un-email");
    await user.click(screen.getByRole("button", { name: /envoyer|send/i }));

    expect(await screen.findByText(/invalide|invalid/i)).toBeInTheDocument();
  });

  it("expose une zone d'annonce aria-live pour les lecteurs d'écran", () => {
    const { container } = renderContact();
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    within(container).getByRole("status");
  });
});
