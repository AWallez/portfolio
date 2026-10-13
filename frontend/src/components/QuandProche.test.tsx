import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import QuandProche from "./QuandProche";

// IntersectionObserver factice : le test décide quand l'élément « approche »
let signaler: (visible: boolean) => void = () => {};
class FauxObservateur {
  constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
    signaler = (visible) => cb([{ isIntersecting: visible }]);
  }
  observe() {}
  disconnect() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});

const monter = () =>
  render(
    <QuandProche id="contact" reserve="h-10">
      <p>formulaire</p>
    </QuandProche>,
  );

describe("<QuandProche />", () => {
  it("garde l'ancre mais ne monte rien tant qu'on est loin", () => {
    vi.stubGlobal("IntersectionObserver", FauxObservateur);
    const { container } = monter();
    expect(container.querySelector("#contact")).toBeInTheDocument();
    expect(screen.queryByText("formulaire")).not.toBeInTheDocument();
  });

  it("monte le contenu quand il approche de l'écran", () => {
    vi.stubGlobal("IntersectionObserver", FauxObservateur);
    monter();
    act(() => signaler(true));
    expect(screen.getByText("formulaire")).toBeInTheDocument();
  });

  it("monte tout de suite si l'adresse vise son ancre", () => {
    vi.stubGlobal("IntersectionObserver", FauxObservateur);
    history.replaceState(null, "", "/#contact");
    monter();
    expect(screen.getByText("formulaire")).toBeInTheDocument();
  });
});
