import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { LangProvider } from "../i18n/LangContext";
import CvModal from "./CvModal";

function setup(onClose = vi.fn()) {
  render(
    <LangProvider>
      <CvModal onClose={onClose} />
    </LangProvider>,
  );
  return onClose;
}

describe("<CvModal />", () => {
  it("rend un dialog modal, focus sur le bouton fermer", () => {
    setup();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: /fermer|close/i })).toHaveFocus();
  });

  // Ctrl + molette zoome le CV, comme le pincement du pavé tactile que Chrome
  // et Firefox traduisent ainsi. Sans preventDefault, le navigateur zoomait
  // AUSSI toute la page derrière la fenêtre.
  it("Ctrl + molette sur le CV n'agrandit pas la page derrière", () => {
    setup();
    const cv = screen.getByAltText(/alexis wallez/i);
    expect(fireEvent.wheel(cv, { ctrlKey: true, deltaY: -100 })).toBe(false);
  });
});
