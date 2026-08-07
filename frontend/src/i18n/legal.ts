// Contenu des pages légales, bilingue.
//
// Séparé de translations.ts : celui-ci porte des libellés d'interface, ceci de
// la prose juridique. Les mélanger rendrait les deux pénibles à relire.
//
// ⚠️ Deux points doivent rester synchronisés avec le reste du dépôt :
//  - les durées de conservation annoncées ici = celles appliquées par
//    backend/src/retention.ts ;
//  - la liste des données collectées = les colonnes de backend/db/schema.sql.

type Bi = { fr: string; en: string };
type Block = { p: Bi } | { ul: Bi[] };
type Section = { h: Bi; blocks: Block[] };

export type LegalDoc = {
  title: Bi;
  updated: string; // ISO, affiché localisé
  sections: Section[];
};

/* ------------------------------------------------------------------ */
/* IDENTITÉ — faits bruts uniquement                                   */
/* ------------------------------------------------------------------ */
// Mentions obligatoires (LCEN art. 6-III). Volontairement sans prose : les
// libellés sont traduits dans les sections, sinon « entrepreneur individuel »
// resterait en français dans la version anglaise.
export const IDENTITY = {
  name: "Alexis Wallez",
  address: "5 allée des Aravis, 77176 Savigny-le-Temple, France",
  siret: "952 663 938 00019",
  ape: "6201Z",
  email: "wallezalexis@gmail.com",
  phone: "+33 6 49 28 06 73",
};

const UPDATED = "2026-08-03";

/* ------------------------------------------------------------------ */
/* Mentions légales                                                     */
/* ------------------------------------------------------------------ */
export const MENTIONS: LegalDoc = {
  title: { fr: "Mentions légales", en: "Legal notice" },
  updated: UPDATED,
  sections: [
    {
      h: { fr: "Éditeur du site", en: "Site publisher" },
      blocks: [
        {
          ul: [
            {
              fr: `${IDENTITY.name}, entrepreneur individuel`,
              en: `${IDENTITY.name}, sole trader (entrepreneur individuel)`,
            },
            { fr: IDENTITY.address, en: IDENTITY.address },
            {
              fr: `SIRET : ${IDENTITY.siret} · code APE ${IDENTITY.ape} (programmation informatique)`,
              en: `Business ID (SIRET): ${IDENTITY.siret} · activity code ${IDENTITY.ape} (computer programming)`,
            },
            // Franchise en base : c'est la mention réglementaire qui est
            // attendue, pas le numéro intracommunautaire. Celui-ci existe et
            // sert en B2B intra-UE, mais l'afficher ici laisserait croire que
            // les tarifs annoncés sont hors taxes. À remplacer par le numéro
            // le jour où le seuil de franchise est dépassé.
            {
              fr: "TVA non applicable, article 293 B du CGI",
              en: "VAT not applicable, article 293 B of the French tax code",
            },
            {
              fr: `Email : ${IDENTITY.email}`,
              en: `Email: ${IDENTITY.email}`,
            },
            {
              fr: `Téléphone : ${IDENTITY.phone}`,
              en: `Phone: ${IDENTITY.phone}`,
            },
            {
              fr: `Directeur de la publication : ${IDENTITY.name}`,
              en: `Publication director: ${IDENTITY.name}`,
            },
          ],
        },
      ],
    },
    {
      h: { fr: "Hébergement", en: "Hosting" },
      blocks: [
        {
          p: {
            fr: `Ce site est auto-hébergé par son éditeur, sur une infrastructure personnelle située en France. L'hébergeur est donc ${IDENTITY.name}, joignable aux coordonnées ci-dessus.`,
            en: `This site is self-hosted by its publisher on personal infrastructure located in France. The host is therefore ${IDENTITY.name}, reachable at the contact details above.`,
          },
        },
      ],
    },
    {
      h: { fr: "Propriété intellectuelle", en: "Intellectual property" },
      blocks: [
        {
          p: {
            fr: `L'ensemble du contenu de ce site (textes, visuels, identité graphique et code) appartient à ${IDENTITY.name}, sauf mention contraire. Le code source est consultable publiquement sur GitHub à des fins de démonstration ; en l'absence de licence explicite, aucun droit d'exploitation, de reproduction ou de réutilisation n'est accordé.`,
            en: `All content on this site (text, visuals, brand identity and code) belongs to ${IDENTITY.name} unless stated otherwise. The source code is publicly viewable on GitHub for demonstration purposes; absent an explicit licence, no right to use, reproduce or reuse it is granted.`,
          },
        },
      ],
    },
    {
      h: { fr: "Liens externes", en: "External links" },
      blocks: [
        {
          p: {
            fr: "Ce site renvoie vers des ressources tierces (GitHub, LinkedIn, Malt, documentations techniques). Leur contenu n'engage que leurs éditeurs respectifs.",
            en: "This site links to third-party resources (GitHub, LinkedIn, Malt, technical documentation). Their content is the sole responsibility of their respective publishers.",
          },
        },
      ],
    },
    {
      h: { fr: "Signaler un contenu", en: "Reporting content" },
      blocks: [
        {
          p: {
            fr: `Toute demande relative à un contenu de ce site peut être adressée à ${IDENTITY.email}. Elle sera traitée dans les meilleurs délais.`,
            en: `Any request concerning content on this site can be sent to ${IDENTITY.email} and will be handled promptly.`,
          },
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Politique de confidentialité                                         */
/* ------------------------------------------------------------------ */
export const PRIVACY: LegalDoc = {
  title: {
    fr: "Politique de confidentialité",
    en: "Privacy policy",
  },
  updated: UPDATED,
  sections: [
    {
      h: { fr: "Responsable du traitement", en: "Data controller" },
      blocks: [
        {
          p: {
            fr: `${IDENTITY.name}, éditeur du site (coordonnées dans les mentions légales). Les données sont traitées par lui seul : elles ne sont ni vendues, ni louées, ni transmises à des fins commerciales.`,
            en: `${IDENTITY.name}, the site publisher (contact details in the legal notice). Data is processed by him alone: it is never sold, rented or shared for commercial purposes.`,
          },
        },
      ],
    },
    {
      h: { fr: "Données collectées", en: "Data collected" },
      blocks: [
        {
          p: {
            fr: "Le formulaire de contact est le seul point de collecte du site. Sont enregistrés :",
            en: "The contact form is the site's only collection point. The following is recorded:",
          },
        },
        {
          ul: [
            {
              fr: "les informations que vous saisissez : prénom, nom, adresse email, type de demande, message et, facultativement, numéro de téléphone ;",
              en: "what you enter: first name, last name, email address, request type, message and, optionally, phone number;",
            },
            {
              fr: "des données techniques liées à l'envoi : adresse IP, identifiant du navigateur (user-agent) et date de réception ;",
              en: "technical data tied to the submission: IP address, browser identifier (user-agent) and date received;",
            },
            {
              fr: "le suivi de votre demande : son statut de traitement et, le cas échéant, des notes de suivi rédigées lors de nos échanges.",
              en: "the handling of your request: its processing status and, where applicable, follow-up notes written during our exchanges.",
            },
          ],
        },
        {
          p: {
            fr: "Aucune autre donnée n'est collectée : ce site n'utilise ni mesure d'audience, ni traceur publicitaire, ni réseau social embarqué.",
            en: "No other data is collected: this site uses no analytics, no advertising trackers and no embedded social widgets.",
          },
        },
      ],
    },
    {
      h: { fr: "Pourquoi et sur quelle base", en: "Purpose and legal basis" },
      blocks: [
        {
          ul: [
            {
              fr: "Répondre à votre demande et, si elle aboutit, préparer une éventuelle collaboration. Base légale : mesures précontractuelles prises à votre demande.",
              en: "To answer your request and, if it goes forward, prepare a possible collaboration. Legal basis: pre-contractual steps taken at your request.",
            },
            {
              fr: "Protéger le formulaire des envois automatisés et des abus (l'adresse IP et le user-agent ne servent qu'à cela). Base légale : intérêt légitime.",
              en: "To protect the form from automated submissions and abuse (the IP address and user-agent serve only this purpose). Legal basis: legitimate interest.",
            },
            {
              fr: "Garder trace des échanges en cours pour assurer un suivi cohérent. Base légale : intérêt légitime.",
              en: "To keep track of ongoing exchanges for consistent follow-up. Legal basis: legitimate interest.",
            },
          ],
        },
      ],
    },
    {
      h: { fr: "Combien de temps", en: "Retention periods" },
      blocks: [
        {
          p: {
            fr: "Les durées ci-dessous ne sont pas déclaratives : elles sont appliquées automatiquement par une purge quotidienne, dont le code est public dans le dépôt du site.",
            en: "These periods are not merely declared: they are enforced automatically by a daily purge whose code is public in the site's repository.",
          },
        },
        {
          ul: [
            {
              fr: "Adresse IP et user-agent : effacés au bout d'un an, leur finalité de sécurité étant alors éteinte. Le message, lui, est conservé : il est simplement anonymisé de ces données techniques.",
              en: "IP address and user-agent: erased after one year, once their security purpose has lapsed. The message itself is kept: it is simply stripped of that technical data.",
            },
            {
              fr: "Message et coordonnées : supprimés trois ans après la réception de votre message, durée de référence retenue par la CNIL en matière de prospection. Si vous me réécrivez, seul le nouveau message repart pour trois ans.",
              en: "Message and contact details: deleted three years after your message is received, the reference period used by the French data protection authority (CNIL) for business prospecting. If you write again, only the new message starts a fresh three-year period.",
            },
          ],
        },
      ],
    },
    {
      h: { fr: "Qui y a accès", en: "Who has access" },
      blocks: [
        {
          ul: [
            {
              fr: `${IDENTITY.name}, seul destinataire des messages.`,
              en: `${IDENTITY.name}, the sole recipient of messages.`,
            },
            {
              fr: "Cloudflare, éditeur du dispositif anti-robot du formulaire (Turnstile) : votre adresse IP lui est transmise le temps de la vérification. Ce transfert hors Union européenne est encadré par les clauses contractuelles types de la Commission européenne.",
              en: "Cloudflare, provider of the form's anti-bot check (Turnstile): your IP address is sent to it for the duration of the verification. This transfer outside the European Union is governed by the European Commission's standard contractual clauses.",
            },
            {
              fr: "Aucun autre tiers. Les données sont stockées sur une infrastructure auto-hébergée en France, sur une base de données qui n'est pas exposée à Internet.",
              en: "No other third party. Data is stored on self-hosted infrastructure in France, in a database that is not exposed to the internet.",
            },
          ],
        },
      ],
    },
    {
      h: { fr: "Cookies et stockage local", en: "Cookies and local storage" },
      blocks: [
        {
          p: {
            fr: "Ce site ne dépose aucun cookie de mesure d'audience ni de publicité, c'est pourquoi aucune bannière ne vous est imposée. Le dispositif anti-robot Cloudflare Turnstile peut déposer un cookie strictement nécessaire à son fonctionnement, exempté de consentement.",
            en: "This site sets no analytics or advertising cookies, which is why you are not shown a banner. The Cloudflare Turnstile anti-bot check may set a cookie strictly necessary to its operation, which is exempt from consent.",
          },
        },
        {
          p: {
            fr: "Votre thème (clair/sombre) et votre langue sont mémorisés dans le stockage local de votre navigateur. Ces informations ne quittent jamais votre appareil et ne permettent aucun suivi ; vider les données du site les efface.",
            en: "Your theme (light/dark) and language are remembered in your browser's local storage. This information never leaves your device and enables no tracking; clearing the site's data removes it.",
          },
        },
      ],
    },
    {
      h: { fr: "Vos droits", en: "Your rights" },
      blocks: [
        {
          p: {
            fr: "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données, y compris sur les notes de suivi vous concernant.",
            en: "You have the right to access, rectify, erase, restrict, object to and port your data, including any follow-up notes concerning you.",
          },
        },
        {
          p: {
            fr: `Pour les exercer, écrivez à ${IDENTITY.email} : la demande est traitée dans un délai maximum d'un mois. Si la réponse ne vous convient pas, vous pouvez saisir la CNIL : 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, ou cnil.fr.`,
            en: `To exercise them, write to ${IDENTITY.email}: requests are handled within one month at most. If the response does not satisfy you, you may lodge a complaint with the CNIL: 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France, or cnil.fr.`,
          },
        },
      ],
    },
    {
      h: { fr: "Sécurité", en: "Security" },
      blocks: [
        {
          p: {
            fr: "Les échanges avec le site sont chiffrés (HTTPS). La base de données et l'API ne sont joignables que depuis le réseau interne de l'infrastructure, jamais depuis Internet. Les sauvegardes sont chiffrées et leur restauration est testée.",
            en: "Traffic to the site is encrypted (HTTPS). The database and API are reachable only from the infrastructure's internal network, never from the internet. Backups are encrypted and their restoration is tested.",
          },
        },
      ],
    },
  ],
};
