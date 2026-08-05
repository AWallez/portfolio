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

## Bannières LinkedIn

`linkedin-banner.mjs` génère la bannière (**1584×396**, le format LinkedIn) aux
couleurs du site : accroche + les 5 facettes d'Alexis (code, infrastructure,
sapeur-pompier, rugby, plongée), rendue en **thème sombre ET clair** — une seule
définition, deux palettes, comme le générateur de visuels projets.

```bash
node branding/linkedin-banner.mjs   # -> 2 SVG (cwd = frontend)
# puis PNG, avec resvg comme ci-dessus, en 2× (value: 3168) :
npm i -D @resvg/resvg-js
node -e "import('@resvg/resvg-js').then(({Resvg})=>{const fs=require('node:fs');for(const v of ['facettes','facettes-clair']){const r=new Resvg(fs.readFileSync('branding/linkedin-banner-'+v+'.svg','utf8'),{font:{fontFiles:['C:/Windows/Fonts/consola.ttf','C:/Windows/Fonts/consolab.ttf','C:/Windows/Fonts/arial.ttf','C:/Windows/Fonts/arialbd.ttf'],loadSystemFonts:false,defaultFontFamily:'Arial'},fitTo:{mode:'width',value:3168}});fs.writeFileSync('branding/linkedin-banner-'+v+'.png',r.render().asPng());}console.log('ok')})"
npm un @resvg/resvg-js
```

⚠️ **Contraintes de la bannière LinkedIn :**
- la **photo de profil recouvre le coin inférieur gauche** (~430 px) → ne rien y
  placer d'important (l'accroche est donc calée en HAUT à gauche) ;
- la bannière est souvent affichée à ~50 % de sa taille → **aucun texte sous 20 px** ;
- 1584×396 est la taille d'affichage **logique** : rastériser à cette taille donne
  un rendu flou sur les écrans haute densité, qui doivent alors agrandir l'image.
  D'où le **2×** (3168×792, ratio 4:1 conservé, ~170 Ko) — la densité exacte d'un
  écran retina. Au-delà, LinkedIn n'affiche pas plus de pixels.

Les icônes **sapeur-pompier / rugby / plongée** (`branding/icons/*.svg`) ont été
dessinées par Alexis : elles sont inlinées et recolorées à la volée par
`user-icons.mjs` (leurs aplats noirs deviennent l'accent, les contre-formes
blanches deviennent la couleur de fond).

## CV (6 fichiers)

Le visualiseur de CV (`CvModal.tsx`) affiche du **SVG vectoriel**, bi-langue ×
bi-thème, et le PDF sert au téléchargement — soit six fichiers dans `public/` :

```
cv-alexis-wallez{,-en}.pdf         téléchargement
cv-alexis-wallez{,-en}.svg         affichage, thème clair
cv-alexis-wallez{,-en}-dark.svg    affichage, thème sombre
```

**La source est le `.docx`** d'Alexis (hors dépôt). Chaîne de régénération :

1. `.docx` → PDF (export OnlyOffice), puis copier les deux PDF dans `public/`
   sous les noms ci-dessus ;
2. PDF → SVG avec **Poppler** (`pdftocairo`), en portable, rien à installer —
   [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows) :
   ```bash
   pdftocairo -svg public/cv-alexis-wallez.pdf    public/cv-alexis-wallez.svg
   pdftocairo -svg public/cv-alexis-wallez-en.pdf public/cv-alexis-wallez-en.svg
   ```
3. variantes sombres = **remap de 6 couleurs**, pas une re-génération :
   ```bash
   node branding/cv-dark.mjs public/cv-alexis-wallez.svg    public/cv-alexis-wallez-dark.svg
   node branding/cv-dark.mjs public/cv-alexis-wallez-en.svg public/cv-alexis-wallez-en-dark.svg
   ```

💡 **Vérifier une modification** : `pdftotext -layout` sur l'ancien et le nouveau
PDF, puis `diff`. Une correction ponctuelle doit se voir comme une seule ligne —
et le SVG régénéré ne doit différer de l'ancien que par les glyphes concernés.
C'est le contrôle qui prouve qu'on n'a pas propagé autre chose au passage.

## Visuel d'architecture

`linkedin-archi.mjs` génère le schéma d'architecture du site (**1200×675**,
le format d'image du fil LinkedIn) : le chemin d'une requête, du visiteur
jusqu'à PostgreSQL. C'est la version dessinée du diagramme Mermaid du
[README racine](../../README.md), aux couleurs du site et en deux thèmes.

```bash
node branding/linkedin-archi.mjs   # -> 2 SVG (cwd = frontend)
# puis PNG, avec resvg comme ci-dessus, en 2× (value: 2400) :
npm i -D @resvg/resvg-js
node -e "import('@resvg/resvg-js').then(({Resvg})=>{const fs=require('node:fs');for(const v of ['','-clair']){const r=new Resvg(fs.readFileSync('branding/linkedin-archi'+v+'.svg','utf8'),{font:{fontFiles:['C:/Windows/Fonts/consola.ttf','C:/Windows/Fonts/consolab.ttf','C:/Windows/Fonts/arial.ttf','C:/Windows/Fonts/arialbd.ttf'],loadSystemFonts:false,defaultFontFamily:'Arial'},fitTo:{mode:'width',value:2400}});fs.writeFileSync('branding/linkedin-archi'+v+'.png',r.render().asPng());}console.log('ok')})"
npm un @resvg/resvg-js
```

⚠️ LinkedIn affiche l'image du fil à **~50 % de sa largeur** → aucun texte sous
16 px, et les libellés de nœuds à 22 px. Les libellés de flèche sont posés sur
une pastille de fond : sans elle, celui du port tombe sur la bordure du panneau.

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

