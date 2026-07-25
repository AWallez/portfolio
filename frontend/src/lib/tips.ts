// Info-bulle = DÉFINITION de la techno (ce que c'est), pas mon usage. Une par
// compétence, FR + EN. Bonus (survol desktop / tap mobile) ; le tag reste l'info.
export const TIPS: Record<string, { fr: string; en: string }> = {
  // Systèmes & conteneurs
  Linux: {
    fr: "Système d'exploitation libre, socle des serveurs et du DevOps.",
    en: "Free operating system, the backbone of servers and DevOps.",
  },
  Debian: {
    fr: "Distribution Linux réputée pour sa stabilité, très utilisée sur serveurs.",
    en: "Linux distribution known for its stability, widely used on servers.",
  },
  Ubuntu: {
    fr: "Distribution Linux dérivée de Debian, populaire poste et serveur.",
    en: "Debian-based Linux distribution, popular on desktop and server.",
  },
  Arch: {
    fr: "Distribution Linux minimaliste, mise à jour en continu (rolling release).",
    en: "Minimalist, rolling-release Linux distribution.",
  },
  Kali: {
    fr: "Distribution Linux dédiée à la sécurité et aux tests d'intrusion.",
    en: "Linux distribution focused on security and penetration testing.",
  },
  Docker: {
    fr: "Conteneurise une application et ses dépendances pour la faire tourner partout à l'identique.",
    en: "Containerizes an app and its dependencies to run identically anywhere.",
  },
  "docker-compose": {
    fr: "Décrit et lance plusieurs conteneurs Docker via un seul fichier YAML.",
    en: "Describes and runs multiple Docker containers from a single YAML file.",
  },
  ESXi: {
    fr: "Hyperviseur bare-metal de VMware pour virtualiser des serveurs.",
    en: "VMware's bare-metal hypervisor for virtualizing servers.",
  },
  VMware: {
    fr: "Solution professionnelle de virtualisation (machines virtuelles).",
    en: "Professional virtualization solution (virtual machines).",
  },
  VirtualBox: {
    fr: "Logiciel libre pour créer des machines virtuelles sur son poste.",
    en: "Free software to run virtual machines on your own machine.",
  },
  Bash: {
    fr: "Shell et langage de script Unix pour automatiser des tâches.",
    en: "Unix shell and scripting language to automate tasks.",
  },
  systemd: {
    fr: "Gestionnaire de services et de tâches planifiées de Linux.",
    en: "Linux's service manager and task scheduler.",
  },
  // Réseau & sécurité
  WireGuard: {
    fr: "VPN moderne, simple et rapide, basé sur un chiffrement récent.",
    en: "Modern, simple and fast VPN built on state-of-the-art cryptography.",
  },
  DNS: {
    fr: "Annuaire d'Internet : traduit les noms de domaine en adresses IP.",
    en: "The Internet's directory: translates domain names into IP addresses.",
  },
  VLAN: {
    fr: "Réseau local virtuel : cloisonne un réseau physique en segments isolés.",
    en: "Virtual LAN: splits a physical network into isolated segments.",
  },
  "IPv4/IPv6": {
    fr: "Protocoles d'adressage qui identifient les machines sur un réseau.",
    en: "Addressing protocols that identify machines on a network.",
  },
  iptables: {
    fr: "Pare-feu du noyau Linux : filtre le trafic réseau.",
    en: "The Linux kernel firewall: filters network traffic.",
  },
  SSH: {
    fr: "Protocole d'accès distant sécurisé (terminal chiffré).",
    en: "Secure remote-access protocol (encrypted terminal).",
  },
  iSCSI: {
    fr: "Protocole d'accès à du stockage disque à travers le réseau.",
    en: "Protocol to access block storage over the network.",
  },
  "Nginx / Caddy": {
    fr: "Serveurs web et reverse proxies (Caddy gère le HTTPS automatiquement).",
    en: "Web servers and reverse proxies (Caddy handles HTTPS automatically).",
  },
  // Front-end
  "HTML / CSS": {
    fr: "Langages de structure et de mise en forme des pages web.",
    en: "The languages for structuring and styling web pages.",
  },
  "Tailwind CSS": {
    fr: "Framework CSS « utility-first » : on style directement dans le HTML.",
    en: "Utility-first CSS framework: style right in the markup.",
  },
  JavaScript: {
    fr: "Langage de programmation du web, exécuté dans le navigateur.",
    en: "The web's programming language, running in the browser.",
  },
  TypeScript: {
    fr: "JavaScript typé : détecte les erreurs avant l'exécution.",
    en: "Typed JavaScript: catches errors before runtime.",
  },
  React: {
    fr: "Bibliothèque JavaScript pour bâtir des interfaces à base de composants.",
    en: "JavaScript library for building component-based interfaces.",
  },
  "Vue.js": {
    fr: "Framework JavaScript progressif pour créer des interfaces web.",
    en: "Progressive JavaScript framework for building web interfaces.",
  },
  Angular: {
    fr: "Framework front-end complet de Google, en TypeScript.",
    en: "Google's full-featured front-end framework, in TypeScript.",
  },
  "Next.js": {
    fr: "Framework React avec rendu serveur et routing intégrés.",
    en: "React framework with built-in server rendering and routing.",
  },
  Vite: {
    fr: "Outil de build moderne et ultra-rapide pour le développement front.",
    en: "Modern, ultra-fast build tool for front-end development.",
  },
  Vitest: {
    fr: "Framework de tests rapide, pensé pour les projets Vite / TypeScript.",
    en: "Fast testing framework built for Vite / TypeScript projects.",
  },
  "Responsive design": {
    fr: "Adapter l'affichage à toutes les tailles d'écran (mobile → desktop).",
    en: "Adapting layouts to every screen size (mobile → desktop).",
  },
  SEO: {
    fr: "Optimisation du référencement dans les moteurs de recherche.",
    en: "Optimizing a site's ranking in search engines.",
  },
  // Back-end & API
  "Node.js": {
    fr: "Environnement qui exécute du JavaScript côté serveur.",
    en: "Runtime that executes JavaScript on the server.",
  },
  Fastify: {
    fr: "Framework web Node.js rapide, orienté création d'API.",
    en: "Fast Node.js web framework, geared toward building APIs.",
  },
  Express: {
    fr: "Framework web Node.js minimaliste, très répandu.",
    en: "Minimalist, widely-used Node.js web framework.",
  },
  "API REST": {
    fr: "Style d'API basé sur HTTP : des ressources et des verbes (GET, POST…).",
    en: "HTTP-based API style: resources and verbs (GET, POST…).",
  },
  Python: {
    fr: "Langage polyvalent : scripts, back-end, données, automatisation.",
    en: "Versatile language: scripting, back-end, data, automation.",
  },
  PHP: {
    fr: "Langage back-end historique du web dynamique.",
    en: "Long-standing back-end language for the dynamic web.",
  },
  Postman: {
    fr: "Outil pour tester, explorer et documenter des API.",
    en: "Tool to test, explore and document APIs.",
  },
  // Cloud / CI-CD / IaC
  AWS: {
    fr: "Plateforme cloud d'Amazon : serveurs, stockage et services à la demande.",
    en: "Amazon's cloud platform: on-demand servers, storage and services.",
  },
  Git: {
    fr: "Système de gestion de versions du code (historique, branches).",
    en: "Version-control system for code (history, branches).",
  },
  GitLab: {
    fr: "Plateforme d'hébergement de dépôts Git avec CI/CD intégrée.",
    en: "Git repository hosting platform with built-in CI/CD.",
  },
  "GitHub Actions": {
    fr: "CI/CD intégrée à GitHub : automatise tests, build et déploiement.",
    en: "GitHub's built-in CI/CD: automates tests, build and deployment.",
  },
  "CI/CD": {
    fr: "Automatisation des tests et du déploiement à chaque changement de code.",
    en: "Automating tests and deployment on every code change.",
  },
  Kubernetes: {
    fr: "Orchestrateur qui déploie et gère des conteneurs à grande échelle.",
    en: "Orchestrator that deploys and manages containers at scale.",
  },
  Terraform: {
    fr: "Infrastructure-as-code : provisionne l'infrastructure à partir de code.",
    en: "Infrastructure-as-code: provisions infrastructure from code.",
  },
  Ansible: {
    fr: "Automatise la configuration des serveurs via des playbooks.",
    en: "Automates server configuration through playbooks.",
  },
  // Bases de données
  PostgreSQL: {
    fr: "Base de données relationnelle open-source, robuste et avancée.",
    en: "Robust, advanced open-source relational database.",
  },
  MySQL: {
    fr: "Base de données relationnelle open-source très répandue.",
    en: "Widely-used open-source relational database.",
  },
  "SQL Server": {
    fr: "Base de données relationnelle de Microsoft.",
    en: "Microsoft's relational database.",
  },
  MongoDB: {
    fr: "Base de données NoSQL orientée documents (format JSON).",
    en: "Document-oriented NoSQL database (JSON-like).",
  },
  // ---- Badges de la section Projets (tags absents de la liste Skills) ----
  Responsive: {
    fr: "Adapter l'affichage à toutes les tailles d'écran (mobile → desktop).",
    en: "Adapting layouts to every screen size (mobile → desktop).",
  },
  Réseau: {
    fr: "Conception et administration de réseaux : adressage, routage, pare-feu.",
    en: "Network design and administration: addressing, routing, firewalling.",
  },
  AdGuard: {
    fr: "Filtre DNS auto-hébergé : bloque pubs et traqueurs pour tout le réseau.",
    en: "Self-hosted DNS filter: blocks ads and trackers network-wide.",
  },
  "10 GbE": {
    fr: "Liaison Ethernet à 10 Gbit/s entre les machines clés du réseau.",
    en: "10-gigabit Ethernet link between the network's key machines.",
  },
  Caddy: {
    fr: "Serveur web / reverse proxy avec HTTPS automatique (Let's Encrypt).",
    en: "Web server / reverse proxy with automatic HTTPS (Let's Encrypt).",
  },
  Vaultwarden: {
    fr: "Gestionnaire de mots de passe auto-hébergé, compatible Bitwarden.",
    en: "Self-hosted password manager, compatible with Bitwarden.",
  },
  "self-hosting": {
    fr: "Héberger soi-même ses services, sur son propre matériel.",
    en: "Running your own services on your own hardware.",
  },
  "Uptime Kuma": {
    fr: "Outil de supervision auto-hébergé : surveille services et conteneurs.",
    en: "Self-hosted monitoring tool: watches services and containers.",
  },
  Beszel: {
    fr: "Supervision légère des métriques système (CPU, RAM, disque, température).",
    en: "Lightweight system-metrics monitoring (CPU, RAM, disk, temperature).",
  },
  ntfy: {
    fr: "Service de notifications push auto-hébergé (publication par simple HTTP).",
    en: "Self-hosted push-notification service (publish over plain HTTP).",
  },
  UptimeRobot: {
    fr: "Service externe qui vérifie la disponibilité d'un site depuis Internet.",
    en: "External service that checks a site's availability from the Internet.",
  },
  Alerting: {
    fr: "Déclenchement d'alertes automatiques en cas de panne ou d'anomalie.",
    en: "Automatic alerts on failure or anomaly.",
  },
  restic: {
    fr: "Outil de sauvegarde chiffrée et dédupliquée, par instantanés.",
    en: "Encrypted, deduplicated snapshot backup tool.",
  },
  Chiffrement: {
    fr: "Protéger des données en les rendant illisibles sans la clé.",
    en: "Protecting data by making it unreadable without the key.",
  },
  RAID1: {
    fr: "Miroir disque : les données sont écrites à l'identique sur deux disques.",
    en: "Disk mirroring: data written identically to two disks.",
  },
  Automatisation: {
    fr: "Confier les tâches répétitives à des scripts et des outils.",
    en: "Letting scripts and tools handle repetitive tasks.",
  },
  PRA: {
    fr: "Plan de reprise d'activité : restaurer l'infrastructure après un sinistre.",
    en: "Disaster recovery plan: restoring the infrastructure after a failure.",
  },
};
