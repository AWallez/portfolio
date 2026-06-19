# Branding

Sources des visuels du site.

## og-image

`og-image.svg` est la **source éditable** de l'image de partage social
(`public/og-image.png`, 1200×630), affichée sur LinkedIn, X, Discord, etc.

Pour régénérer le PNG après modification du SVG :

```bash
# option simple : ouvrir og-image.svg dans un navigateur et exporter en PNG 1200×630
# option scriptée :
npm i -D @resvg/resvg-js
node -e "import('@resvg/resvg-js').then(({Resvg})=>{const fs=require('node:fs');const r=new Resvg(fs.readFileSync('branding/og-image.svg','utf8'),{font:{fontFiles:['C:/Windows/Fonts/consola.ttf','C:/Windows/Fonts/arial.ttf','C:/Windows/Fonts/arialbd.ttf'],loadSystemFonts:false,defaultFontFamily:'Arial'},fitTo:{mode:'width',value:1200}});fs.writeFileSync('public/og-image.png',r.render().asPng());console.log('ok')})"
npm un @resvg/resvg-js
```

## Images des projets

Les 5 visuels de la section Projets (1200×675) sont **générés par script** à partir des
tokens de couleur du site (`--base`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`,
cf. `:root` et `.dark` dans `src/index.css`). Chaque carte est dessinée **une seule fois**
puis rendue avec la palette claire **et** la palette sombre : les images partagent donc
exactement les couleurs du site (« comme si elles en faisaient partie »).

Sortie en **SVG vectoriel** (≈10× plus léger que du PNG, net à n'importe quel zoom).
Les SVG sont **inlinés** dans `Projects.tsx` (importés en `?raw`, injectés dans le DOM —
pas de `<img>`), `*-light.svg` en thème clair et `*-dark.svg` en sombre via la variante
`dark:`. Étant inlinés, ils **héritent des webfonts du site** (`JetBrains Mono` / `Inter`)
→ rendu identique pour tous les visiteurs et cohérent avec le reste du site. Les ids
internes (`dots`/`sh`/`thumb`/`arrow`) sont préfixés par fichier pour éviter les collisions
entre SVG inlinés.

| Carte                          | Builder (`generate-projects.mjs`) | Sorties (`src/assets/projects/`)      |
| ------------------------------ | --------------------------------- | ------------------------------------- |
| Projets web clients (vitrine)  | `clients`                         | `web-clients-light.svg` / `-dark.svg` |
| Ce portfolio (le site lui-même)| `portfolio`                       | `portfolio-light.svg` / `-dark.svg`   |
| Réseau domestique (topologie)  | `reseau`                          | `reseau-light.svg` / `-dark.svg`      |
| Infrastructure NAS (services)  | `homelab`                         | `homelab-light.svg` / `-dark.svg`     |
| Perso & lab (terminal DevOps)  | `lab`                             | `perso-light.svg` / `-dark.svg`       |

### Régénérer

```bash
node branding/generate-projects.mjs   # écrit les 10 SVG dans src/assets/projects/
```

Aucune dépendance (pas de rastérisation). Pour modifier un visuel ou la palette : éditer le
builder correspondant (ou les objets `LIGHT` / `DARK`) dans `generate-projects.mjs`, puis
relancer. Comme les visuels reprennent les polices du site, les colonnes mono (terminal
*perso*, tableaux *kubectl*/StockApp) sont calées sur les métriques de JetBrains Mono.

