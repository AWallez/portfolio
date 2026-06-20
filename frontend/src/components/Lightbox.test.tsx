import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LangProvider } from "../i18n/LangContext";
import Lightbox from "./Lightbox";

const LIGHT = "<svg><title>clair</title></svg>";
const DARK = "<svg><title>sombre</title></svg>";

function setup(onClose = vi.fn()) {
  render(
    <LangProvider>
      <Lightbox light={LIGHT} dark={DARK} title="Mon projet" onClose={onClose} />
    </LangProvider>,
  );
  return onClose;
}

describe("<Lightbox />", () => {
  it("rend un dialog modal nommé par le titre", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "Mon projet" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("place le focus sur le bouton fermer à l'ouverture", () => {
    setup();
    expect(screen.getByRole("button", { name: /fermer|close/i })).toHaveFocus();
  });

  it("ferme sur Escape", () => {
    const onClose = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ferme via le bouton fermer", async () => {
    const user = userEvent.setup();
    const onClose = setup();
    await user.click(screen.getByRole("button", { name: /fermer|close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("ferme au clic sur le fond", async () => {
    const user = userEvent.setup();
    const onClose = setup();
    await user.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ne ferme PAS au clic sur le contenu", async () => {
    const user = userEvent.setup();
    const onClose = setup();
    const inner = screen.getByRole("dialog").firstElementChild as HTMLElement;
    await user.click(inner);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("piège le focus : Tab reste sur le bouton fermer", () => {
    setup();
    const close = screen.getByRole("button", { name: /fermer|close/i });
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
  });

  it("verrouille puis restaure le scroll de l'arrière-plan", () => {
    const { unmount } = render(
      <LangProvider>
        <Lightbox light={LIGHT} dark={DARK} title="X" onClose={() => {}} />
      </LangProvider>,
    );
    expect(document.documentElement.style.overflow).toBe("hidden");
    unmount();
    expect(document.documentElement.style.overflow).toBe("");
  });
});
