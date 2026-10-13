import { beforeAll, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Select from "./Select";

const OPTIONS = [
  { value: "project", label: "Projet" },
  { value: "hiring", label: "Recrutement" },
  { value: "other", label: "Autre" },
];

function Champ({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <>
      <span id="type-label">Type de demande</span>
      <Select
        id="type"
        labelledBy="type-label"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
        options={OPTIONS}
      />
    </>
  );
}

function monter() {
  const onChange = vi.fn();
  render(<Champ onChange={onChange} />);
  const champ = screen.getByRole("combobox", { name: "Type de demande" });
  return { champ, onChange, user: userEvent.setup() };
}

// option désignée par aria-activedescendant
const optionActive = (champ: HTMLElement) =>
  document.getElementById(champ.getAttribute("aria-activedescendant") ?? "")
    ?.textContent;

describe("<Select /> au clavier", () => {
  // jsdom ne fait pas défiler : la liste garde l'option active visible
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("s'ouvre à la flèche bas sans rien choisir", async () => {
    const { champ, onChange, user } = monter();
    champ.focus();
    await user.keyboard("{ArrowDown}");
    expect(champ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("parcourt les options et choisit avec Entrée", async () => {
    const { champ, onChange, user } = monter();
    champ.focus();
    await user.keyboard("{ArrowDown}");
    const depart = OPTIONS.findIndex((o) => o.label === optionActive(champ));
    await user.keyboard("{ArrowDown}");
    const attendu = OPTIONS[(depart + 1) % OPTIONS.length];
    expect(optionActive(champ)).toBe(attendu.label);
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(attendu.value);
    expect(champ).toHaveAttribute("aria-expanded", "false");
    expect(champ).toHaveTextContent(attendu.label);
  });

  it("va au début et à la fin de la liste", async () => {
    const { champ, user } = monter();
    champ.focus();
    await user.keyboard("{ArrowDown}{End}");
    expect(optionActive(champ)).toBe("Autre");
    await user.keyboard("{Home}");
    expect(optionActive(champ)).toBe("Projet");
  });

  it("se ferme à Échap sans rien changer", async () => {
    const { champ, onChange, user } = monter();
    champ.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");
    expect(champ).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
  });
});
