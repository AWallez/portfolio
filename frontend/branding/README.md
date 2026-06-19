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

Sources éditables des visuels de la section Projets (chacune rendue en
`public/projects/*.png`, 1200×675) :

| Source (`branding/`)     | Sortie (`public/projects/`) | Carte                      |
| ------------------------ | --------------------------- | -------------------------- |
| `projects-web.svg`       | `web-clients.png`           | Projets web clients (Figma)|
| `projects-nas.svg`       | `homelab.png`               | Infrastructure NAS (schéma)|
| `projects-reseau.svg`    | `reseau.png`                | Réseau domestique (schéma) |
| `projects-portfolio.svg` | `portfolio.png`             | Ce portfolio (Figma)       |
| `projects-perso.svg`     | `perso.png`                 | Perso & lab (terminal)     |

Régénération : même principe que l'og-image (installer `@resvg/resvg-js`,
rendre le SVG voulu en PNG avec les polices Arial + Consolas, `fitTo` width 1200).

