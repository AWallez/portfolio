import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* ---- Une page HTML par route, générée au build ----------------------------
 * Le site est une SPA : toutes les routes servaient le même index.html. Pour
 * Google, les pages légales avaient donc le titre, la description et l'adresse
 * canonique de l'accueil (canonical = « je suis un doublon de l'accueil »), et
 * nginx répondait 200 à n'importe quelle adresse, même /.env.
 * Ici, chaque route reçoit sa copie d'index.html avec SES métadonnées
 * (mentions-legales.html…), et 404.html sert aux adresses inconnues, avec un
 * vrai statut 404 (cf. nginx.conf). Le contenu reste rendu par React.
 * ⚠️ Les chemins doivent rester ceux de src/lib/routes.ts.
 */
type Page = {
  fichier: string
  chemin?: string // absent : pas d'adresse canonique (404)
  titre: string
  description?: string
  noindex?: boolean
}

const SITE = 'https://alexiswallez.fr'
const PAGES: Page[] = [
  {
    fichier: 'mentions-legales.html',
    chemin: '/mentions-legales',
    titre: 'Mentions légales · Alexis Wallez',
    description:
      "Mentions légales du site alexiswallez.fr : éditeur, hébergement, propriété intellectuelle et signalement de contenu.",
  },
  {
    fichier: 'confidentialite.html',
    chemin: '/confidentialite',
    titre: 'Politique de confidentialité · Alexis Wallez',
    description:
      "Données collectées par le formulaire de contact et la mesure d'audience, durées de conservation, destinataires et droits.",
  },
  { fichier: '404.html', titre: '404, page introuvable · Alexis Wallez', noindex: true },
]

const attr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Remplacement qui DOIT avoir lieu : si index.html change de forme, le build
// échoue au lieu de publier une page aux métadonnées de l'accueil.
function remplace(html: string, motif: RegExp, par: string, quoi: string) {
  if (!motif.test(html)) throw new Error(`pages-statiques : ${quoi} introuvable dans index.html`)
  return html.replace(motif, par)
}

function pagesStatiques(): Plugin {
  return {
    name: 'pages-statiques',
    // pas pour la compilation du pré-rendu (`vite build --ssr`), sans index.html
    apply: (_, { command, isSsrBuild }) => command === 'build' && !isSsrBuild,
    enforce: 'post', // index.html est alors déjà dans le bundle, transformé
    generateBundle(_, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') throw new Error('pages-statiques : index.html absent du bundle')
      const html = String(index.source)
      for (const p of PAGES) {
        let h = remplace(html, /<title>[\s\S]*?<\/title>/, `<title>${attr(p.titre)}</title>`, 'title')
        for (const [motif, quoi] of [
          [/(property="og:title"\s+content=")[^"]*/, 'og:title'],
          [/(name="twitter:title"\s+content=")[^"]*/, 'twitter:title'],
        ] as const) h = remplace(h, motif, `$1${attr(p.titre)}`, quoi)
        if (p.description) {
          for (const [motif, quoi] of [
            [/(name="description"\s+content=")[^"]*/, 'description'],
            [/(property="og:description"\s+content=")[^"]*/, 'og:description'],
            [/(name="twitter:description"\s+content=")[^"]*/, 'twitter:description'],
          ] as const) h = remplace(h, motif, `$1${attr(p.description)}`, quoi)
        }
        if (p.chemin) {
          h = remplace(h, /(rel="canonical"\s+href=")[^"]*/, `$1${SITE}${p.chemin}`, 'canonical')
          h = remplace(h, /(property="og:url"\s+content=")[^"]*/, `$1${SITE}${p.chemin}`, 'og:url')
        } else {
          h = remplace(h, /\s*<link rel="canonical"[^>]*>/, '', 'canonical')
        }
        if (p.noindex) {
          h = h.replace('</title>', '</title>\n    <meta name="robots" content="noindex" />')
        }
        this.emitFile({ type: 'asset', fileName: p.fichier, source: h })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pagesStatiques()],
})
