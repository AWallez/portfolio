import type { Lang } from "./LangContext";

// Chaque clé a sa version FR et EN. On ajoutera les futures sections ici.
export const translations = {
  about: {
    title: { fr: "À propos", en: "About" },
    command: { fr: "cat about.md", en: "cat about.md" },
    body: {
      fr: "Développeur web full-stack indépendant depuis 2023, je conçois des applications de bout en bout : du front-end à la mise en ligne.  Ma particularité, c'est de ne pas m'arrêter au code : Linux, Docker, le réseau et l'auto-hébergement font partie de mon quotidien. Le DevOps s'impose alors comme une évolution naturelle — il réunit mes deux centres d'intérêt, le développement et les systèmes & réseau.",
      en: "I’ve been a freelance full-stack web developer since 2023, and I build applications from start to finish: from the front end to deployment. What sets me apart is that I don’t stop at just coding: Linux, Docker, networking, and self-hosting are all part of my daily routine. DevOps has therefore emerged as a natural progression — it brings together my two main areas of interest: development and systems & networking.",
    },
    extra: {
      fr: "Autodidacte avant tout, j'apprends vite, je m'adapte et je trouve des solutions — par passion. Sapeur-pompier volontaire, j'y cultive rigueur, sang-froid et esprit d'équipe. Ouvert à toute opportunité professionnelle comme aux missions freelance.",
      en: "Self-taught at heart, I learn fast, adapt and find solutions — driven by passion. As a volunteer firefighter, I've built rigor, composure and teamwork. Open to any professional opportunity as well as freelance projects.",
    },
    factExp: { fr: "~4 ans d'expérience", en: "~4 years of experience" },
    factStatus: {
      fr: "Opportunité pro & freelance",
      en: "Open to work & freelance",
    },
    factLang: { fr: "Français / Anglais", en: "French / English" },
  },
  skills: {
    title: { fr: "Compétences", en: "Skills" },
    command: { fr: "ls -la skills/", en: "ls -la skills/" },
    systems: { fr: "Systèmes & conteneurs", en: "Systems & containers" },
    network: { fr: "Réseau & sécurité", en: "Network & security" },
    cloud: { fr: "Cloud / CI-CD / IaC", en: "Cloud / CI-CD / IaC" },
    frontend: { fr: "Front-end", en: "Front-end" },
    backend: { fr: "Back-end & API", en: "Back-end & API" },
    data: { fr: "Bases de données", en: "Databases" },
    learning: { fr: "En cours d'apprentissage", en: "Currently learning" },
  },
  career: {
    title: { fr: "Parcours", en: "Career" },
    command: { fr: "git log --oneline", en: "git log --oneline" },
    exp: { fr: "Expérience", en: "Experience" },
    edu: { fr: "Formation", en: "Education" },
  },
  projects: {
    title: { fr: "Projets & Homelab", en: "Projects & Homelab" },
    command: { fr: "ls -la ~/projects", en: "ls -la ~/projects" },
    code: { fr: "Code", en: "Code" },
    live: { fr: "Voir", en: "Live" },
  },
  services: {
    title: { fr: "Services", en: "Services" },
    command: { fr: "cat services/README.md", en: "cat services/README.md" },
    cta: { fr: "Demander un devis", en: "Request a quote" },
  },
  contact: {
    title: { fr: "Contact", en: "Contact" },
    command: { fr: "./contact.sh --send", en: "./contact.sh --send" },
    firstname: { fr: "Prénom", en: "First name" },
    lastname: { fr: "Nom", en: "Last name" },
    email: { fr: "Email", en: "Email" },
    reqType: { fr: "Type de demande", en: "Request type" },
    phone: { fr: "Téléphone (optionnel)", en: "Phone (optional)" },
    optProject: { fr: "Projet / Devis", en: "Project / Quote" },
    optHiring: { fr: "Recrutement", en: "Hiring" },
    optOther: { fr: "Autre", en: "Other" },
    message: { fr: "Message", en: "Message" },
    send: { fr: "Envoyer", en: "Send" },
    sending: { fr: "Envoi…", en: "Sending…" },
    success: {
      fr: "Message envoyé, merci ! Je reviens vers vous vite.",
      en: "Message sent, thank you! I’ll get back to you soon.",
    },
    error: {
      fr: "Oups, l’envoi a échoué. Réessayez ou écrivez-moi directement par email.",
      en: "Oops, sending failed. Please try again or email me directly.",
    },
    retry: { fr: "Réessayer", en: "Try again" },
    errRequired: { fr: "Ce champ est requis.", en: "This field is required." },
    errEmail: {
      fr: "Adresse email invalide.",
      en: "Invalid email address.",
    },
    errType: {
      fr: "Sélectionnez un type de demande.",
      en: "Please select a request type.",
    },
    errPhone: {
      fr: "Numéro de téléphone invalide.",
      en: "Invalid phone number.",
    },
    sendingStatus: { fr: "Envoi du message en cours…", en: "Sending message…" },
  },
  a11y: {
    skip: { fr: "Aller au contenu", en: "Skip to content" },
    backToTop: { fr: "Retour en haut", en: "Back to top" },
    openMenu: { fr: "Ouvrir le menu", en: "Open menu" },
    closeMenu: { fr: "Fermer le menu", en: "Close menu" },
    toLight: { fr: "Activer le thème clair", en: "Switch to light theme" },
    toDark: { fr: "Activer le thème sombre", en: "Switch to dark theme" },
    switchLang: { fr: "Switch to English", en: "Passer en français" },
    primaryNav: { fr: "Navigation principale", en: "Main navigation" },
    downloadCV: {
      fr: "Télécharger le CV (PDF)",
      en: "Download résumé (PDF)",
    },
    available: { fr: "Disponible", en: "Available" },
    availableLong: {
      fr: "Disponible pour mission freelance & alternance",
      en: "Available for freelance & work-study",
    },
  },
  footer: {
    tagline: {
      fr: "Développeur Full-Stack & DevOps",
      en: "Full-Stack Developer & DevOps",
    },
    built: {
      fr: "Conçu & auto-hébergé sur mon NAS via Docker",
      en: "Built & self-hosted on my NAS with Docker",
    },
    stack: {
      fr: "React · TypeScript · Node · PostgreSQL",
      en: "React · TypeScript · Node · PostgreSQL",
    },
    connect: { fr: "Me contacter", en: "Get in touch" },
    rights: { fr: "Tous droits réservés.", en: "All rights reserved." },
  },
  nav: {
    about: { fr: "À propos", en: "About" },
    skills: { fr: "Compétences", en: "Skills" },
    career: { fr: "Parcours", en: "Career" },
    projects: { fr: "Projets", en: "Projects" },
    services: { fr: "Services", en: "Services" },
    contact: { fr: "Contact", en: "Contact" },
  },
} as const;

type Translations = typeof translations;
type Section = keyof Translations;

export function t<S extends Section>(
  section: S,
  key: keyof Translations[S],
  lang: Lang,
): string {
  const sec = translations[section] as Record<string, Record<Lang, string>>;
  return sec[key as string][lang];
}
