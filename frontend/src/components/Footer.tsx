import { Mail, Phone, MapPin } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

// chemins SVG officiels des logos (source : simple-icons), collés en dur → zéro dépendance
const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z";

// petit composant pour afficher un logo SVG depuis son path
function BrandIcon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}

const LINKS = [
  { label: "GitHub", href: "https://github.com/AWallez", brand: GITHUB_PATH },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/alexis-wallez/",
    brand: LINKEDIN_PATH,
  },
  { label: "+33 6 49 28 06 73", href: "tel:+33649280673", Icon: Phone },
  {
    label: "wallezalexis@gmail.com",
    href: "mailto:wallezalexis@gmail.com",
    Icon: Mail,
  },
];

export default function Footer() {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line mt-10 bg-base/50 backdrop-blur">
      <div
        className="max-w-200 container-page py-12
                      grid gap-8 sm:grid-cols-2"
      >
        {/* colonne gauche : identité + signature DevOps */}
        <div className="flex flex-col items-center text-center">
          <p className="font-mono text-accent text-lg mb-1">// alexis.wallez</p>
          <p className="text-sm text-muted mb-3">
            {t("footer", "tagline", lang)}
          </p>
          <p className="flex items-center gap-2 text-xs text-muted mb-3">
            <MapPin size={14} className="text-accent" />
            Savigny-le-Temple (77), France
          </p>

          <p className="font-mono text-xs text-accent mb-1">
            <span className="text-muted">$</span> {t("footer", "built", lang)}
          </p>
          <p className="font-mono text-xs text-muted">
            {t("footer", "stack", lang)}
          </p>
        </div>

        {/* colonne droite : liens de contact, centrés */}
        <div className="flex flex-col items-center">
          <p className="font-mono text-xs text-accent mb-3">
            {t("footer", "connect", lang)}
          </p>
          <ul className="space-y-2 flex flex-col items-center">
            {LINKS.map(({ label, href, Icon, brand }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-muted
                             hover:text-accent transition group"
                >
                  <span className="text-accent group-hover:scale-110 transition">
                    {brand ? (
                      <BrandIcon path={brand} />
                    ) : (
                      Icon && <Icon size={16} />
                    )}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p
          className="max-w-300 container-page py-4
                      font-mono text-xs text-muted text-center"
        >
          © {year} Alexis Wallez — {t("footer", "rights", lang)}
        </p>
      </div>
    </footer>
  );
}
