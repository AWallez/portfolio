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
