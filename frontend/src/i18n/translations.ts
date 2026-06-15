import type { Lang } from "./LangContext";

// Chaque clé a sa version FR et EN. On ajoutera les futures sections ici.
export const translations = {
  about: {
    title: { fr: "À propos", en: "About" },
    command: { fr: "cat about.md", en: "cat about.md" },
    body: {
      fr: "Développeur full-stack (~3 ans) au profil orienté systèmes, réseau et infrastructure. Praticien quotidien de Linux, Docker et de l'auto-hébergement, je formalise ma transition vers le DevOps / Cloud par l'alternance.",
      en: "Full-stack developer (~3 years) with a strong focus on systems, networking and infrastructure. A daily user of Linux, Docker and self-hosting, I'm formalizing my move toward DevOps / Cloud through a work-study program.",
    },
    extra: {
      fr: "Sapeur-pompier volontaire : rigueur, sang-froid et esprit d'équipe.",
      en: "Volunteer firefighter: rigor, composure and teamwork.",
    },
  },
  skills: {
    title: { fr: "Compétences", en: "Skills" },
    command: { fr: "ls -la skills/", en: "ls -la skills/" },
    systems: { fr: "Systèmes & conteneurs", en: "Systems & containers" },
    network: { fr: "Réseau & sécurité", en: "Network & security" },
    cloud: { fr: "Cloud / CI-CD / IaC", en: "Cloud / CI-CD / IaC" },
    dev: { fr: "Développement", en: "Development" },
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
    optProject: { fr: "Projet freelance", en: "Freelance project" },
    optHiring: { fr: "Recrutement", en: "Hiring" },
    optOther: { fr: "Autre", en: "Other" },
    message: { fr: "Message", en: "Message" },
    send: { fr: "Envoyer", en: "Send" },
    sending: { fr: "Envoi…", en: "Sending…" },
    success: {
      fr: "Message envoyé, merci ! Je reviens vers vous vite.",
      en: "Message sent, thank you! I’ll get back to you soon.",
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
