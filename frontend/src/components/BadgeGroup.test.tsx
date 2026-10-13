import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BadgeGroup from "./BadgeGroup";

function monter() {
  render(
    <>
      <button>avant</button>
      <BadgeGroup label="Technologies : Homelab">
        <button>Docker</button>
        <span>sans info-bulle</span>
        <button>Caddy</button>
        <button>Linux</button>
      </BadgeGroup>
      <button>après</button>
    </>,
  );
  return (nom: string) => screen.getByRole("button", { name: nom });
}

describe("<BadgeGroup />", () => {
  it("est une barre d'outils nommée", () => {
    monter();
    expect(
      screen.getByRole("toolbar", { name: "Technologies : Homelab" }),
    ).toBeInTheDocument();
  });

  it("ne compte qu'une tabulation pour tout le groupe", async () => {
    const bouton = monter();
    const user = userEvent.setup();
    await user.tab();
    expect(bouton("avant")).toHaveFocus();
    await user.tab();
    expect(bouton("Docker")).toHaveFocus();
    await user.tab();
    expect(bouton("après")).toHaveFocus();
  });

  it("passe d'un badge à l'autre aux flèches, Début et Fin", async () => {
    const bouton = monter();
    const user = userEvent.setup();
    bouton("Docker").focus();
    await user.keyboard("{ArrowRight}");
    expect(bouton("Caddy")).toHaveFocus();
    await user.keyboard("{End}");
    expect(bouton("Linux")).toHaveFocus();
    await user.keyboard("{ArrowRight}"); // reboucle
    expect(bouton("Docker")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(bouton("Linux")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bouton("Docker")).toHaveFocus();
  });

  it("revient au dernier badge visité", async () => {
    const bouton = monter();
    const user = userEvent.setup();
    bouton("Docker").focus();
    await user.keyboard("{ArrowRight}");
    await user.tab(); // sort du groupe
    expect(bouton("après")).toHaveFocus();
    await user.tab({ shift: true });
    expect(bouton("Caddy")).toHaveFocus();
  });
});
