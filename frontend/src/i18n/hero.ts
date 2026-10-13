import type { Line } from "../hooks/useTypewriter";
import type { Lang } from "./LangContext";

// Textes du terminal du Hero. Ils vivent à part de translations.ts parce que ce
// ne sont pas des libellés : des lignes structurées (chemin, commande, sortie)
// et des réponses qui prennent un argument.

export const INTRO: Record<Lang, Line[]> = {
  fr: [
    {
      path: "~/portfolio",
      command: "whoami",
      output: "Alexis Wallez · Développeur Full-Stack & DevOps",
    },
    {
      path: "~/portfolio",
      command: "cat competences.txt",
      output: "Full-Stack · DevOps · Linux · Docker · Réseau & self-hosting",
    },
    {
      path: "~/portfolio",
      command: "cd services/ ; ls",
      output: "contact.sh   dev-web/   montage-pc/   conseil/",
    },
    {
      path: "~/portfolio/services",
      command: "./contact.sh",
      loading: true,
      output:
        "Disponible pour des projets en freelance et des opportunités pro | Cliquez ici▸",
      link: { label: "Contact", href: "#contact" },
    },
  ],
  en: [
    {
      path: "~/portfolio",
      command: "whoami",
      output: "Alexis Wallez · Full-Stack Developer & DevOps",
    },
    {
      path: "~/portfolio",
      command: "cat skills.txt",
      output: "Full-Stack · DevOps · Linux · Docker · Network & self-hosting",
    },
    {
      path: "~/portfolio",
      command: "cd services/ ; ls",
      output: "contact.sh   web-dev/   pc-assembly/   consulting/",
    },
    {
      path: "~/portfolio/services",
      command: "./contact.sh",
      loading: true,
      output:
        "Available for freelance projects & professional opportunities | Click here ▸",
      link: { label: "Contact", href: "#contact" },
    },
  ],
};

export const SPINNER: Record<Lang, string> = {
  fr: "En attente de votre prise de contact…",
  en: "We look forward to hearing from you…",
};

/* ---- Terminal interactif (après l'intro) -------------------------------- */
export const TERM = {
  fr: {
    hint: "tape help ↵",
    ariaInput: "Terminal interactif, tape une commande (ex. help)",
    help: [
      "Commandes : whoami · ls · cd <section> · cv · theme · lang · clear",
      "Sections : a-propos · competences · parcours · projets · services · contact",
      "Astuce : quelques easter eggs se cachent ici… 😉",
    ],
    whoami: "Alexis Wallez · Développeur Full-Stack & DevOps",
    ls: "a-propos/   competences/   parcours/   projets/   services/   contact.sh",
    cv: "Ouverture du CV…",
    goto: (s: string) => `cd /${s} · c'est parti ▸`,
    home: "~ · retour en haut ▸",
    cdErr: (p: string) =>
      `bash : cd : ${p} : Aucun fichier ou dossier de ce type`,
    theme: "Bascule du thème ✓",
    langSame: "Déjà en français 😉  (essaie « lang en »)",
    sudo: "[sudo] Mot de passe : ●●●●●●●● · accès refusé 😄",
    coffee:
      "☕ Café en préparation… prêt ! Je le prends volontiers en vrai aussi.",
    rmrf: "🚨 Bien tenté ! Heureusement, tout est versionné sur GitHub.",
    exit: "Pas de sortie ici, mais le formulaire de contact est juste en bas 😉",
    notFound: (c: string) =>
      `bash : ${c} : commande introuvable, tape « help »`,
  },
  en: {
    hint: "type help ↵",
    ariaInput: "Interactive terminal, type a command (e.g. help)",
    help: [
      "Commands: whoami · ls · cd <section> · cv · theme · lang · clear",
      "Sections: about · skills · career · projects · services · contact",
      "Hint: a few easter eggs are hiding here… 😉",
    ],
    whoami: "Alexis Wallez · Full-Stack Developer & DevOps",
    ls: "about/   skills/   career/   projects/   services/   contact.sh",
    cv: "Opening the CV…",
    goto: (s: string) => `cd /${s} · let's go ▸`,
    home: "~ · back to top ▸",
    cdErr: (p: string) => `bash: cd: ${p}: No such file or directory`,
    theme: "Theme switched ✓",
    langSame: "Already in English 😉  (try “lang fr”)",
    sudo: "[sudo] Password: ●●●●●●●● · permission denied 😄",
    coffee: "☕ Brewing coffee… done! Happy to grab a real one too.",
    rmrf: "🚨 Nice try! Luckily, everything is versioned on GitHub.",
    exit: "No exit here, but the contact form is right below 😉",
    notFound: (c: string) => `bash: ${c}: command not found, type “help”`,
  },
} satisfies Record<Lang, unknown>;
