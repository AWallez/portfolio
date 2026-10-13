import { describe, expect, it } from "vitest";
import { runCommand } from "./commands";
import { TERM } from "../../i18n/hero";

describe("terminal du Hero : runCommand", () => {
  it("affiche l'aide (et ses alias)", () => {
    for (const c of ["help", "aide", "?", "  HELP  "])
      expect(runCommand(c, "fr").out).toEqual(TERM.fr.help);
  });

  it("répond aux commandes simples sans effet", () => {
    expect(runCommand("whoami", "fr")).toEqual({ out: [TERM.fr.whoami] });
    expect(runCommand("ls -la", "fr")).toEqual({ out: [TERM.fr.ls] });
    expect(runCommand("pwd", "en")).toEqual({ out: ["~/portfolio"] });
    expect(runCommand("echo Bonjour Alexis", "fr").out).toEqual(["Bonjour Alexis"]);
  });

  it("donne la date dans la langue courante", () => {
    const quand = new Date(2026, 9, 13, 8, 30);
    expect(runCommand("date", "fr", quand).out).toEqual([
      quand.toLocaleString("fr-FR"),
    ]);
  });

  it("navigue vers une section, en français comme en anglais", () => {
    for (const c of ["cd projets", "cd projects/", "cd ~/projets", "projets"])
      expect(runCommand(c, "fr")).toEqual({
        out: [TERM.fr.goto("projects")],
        effect: { type: "section", id: "projects" },
      });
    expect(runCommand("cd compétences", "fr").effect).toEqual({
      type: "section",
      id: "skills",
    });
  });

  it("remonte en haut pour toutes les variantes de « cd racine »", () => {
    for (const c of ["cd", "cd ~", "cd /", "cd ..", "cd ../..", "cd -", "cd.."])
      expect(runCommand(c, "fr").effect, c).toEqual({ type: "top" });
  });

  it("refuse un dossier inconnu, comme bash", () => {
    expect(runCommand("cd nulle-part", "fr")).toEqual({
      out: [TERM.fr.cdErr("nulle-part")],
    });
  });

  it("efface l'écran sans laisser d'entrée", () => {
    expect(runCommand("clear", "fr")).toEqual({
      out: null,
      effect: { type: "clear" },
    });
  });

  it("bascule le thème et ouvre le CV", () => {
    expect(runCommand("theme", "fr").effect).toEqual({ type: "theme" });
    expect(runCommand("cv", "en")).toEqual({
      out: [TERM.en.cv],
      effect: { type: "cv" },
    });
  });

  it("change de langue, sauf vers la langue déjà affichée", () => {
    expect(runCommand("lang fr", "fr")).toEqual({ out: [TERM.fr.langSame] });
    expect(runCommand("lang en", "fr")).toEqual({
      out: [],
      effect: { type: "lang" },
    });
    expect(runCommand("lang", "en").effect).toEqual({ type: "lang" });
  });

  it("garde ses easter eggs", () => {
    expect(runCommand("sudo rm -rf /", "fr").out).toEqual([TERM.fr.sudo]);
    expect(runCommand("rm -rf /", "fr").out).toEqual([TERM.fr.rmrf]);
    expect(runCommand("make coffee", "en").out).toEqual([TERM.en.coffee]);
    expect(runCommand("exit", "fr").out).toEqual([TERM.fr.exit]);
  });

  it("signale une commande inconnue en la citant", () => {
    expect(runCommand("vim", "en").out).toEqual([TERM.en.notFound("vim")]);
  });
});
