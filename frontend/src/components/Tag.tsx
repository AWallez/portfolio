import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

// Badge de techno partagé (Skills, Projets) : info-bulle en portal — survol sur
// desktop, tap sur tactile — avec animation d'entrée/sortie, bornée à l'écran.
// `icon` : chemin SVG de logo de marque (simple-icons) OU pictogramme lucide.

// petit logo SVG monochrome (hérite de la couleur du texte du tag = accent)
function BrandIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="currentColor"
      className="shrink-0 opacity-90"
    >
      <path d={path} />
    </svg>
  );
}

const BASE =
  "badge-hover inline-flex items-center gap-1.5 font-mono " +
  "bg-accent/10 text-accent border border-accent/30";
const SIZES = {
  md: "px-3 py-1.5 rounded-md text-sm font-medium", // Skills
  sm: "px-2 py-0.5 rounded text-xs", // Projets
};

type IconSpec = string | LucideIcon;

export default function Tag({
  children,
  tip,
  icon,
  size = "md",
}: {
  children: string;
  tip?: string;
  /** un ou plusieurs logos (badge double, ex. « Nginx / Caddy ») */
  icon?: IconSpec | IconSpec[];
  size?: keyof typeof SIZES;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // reste monté le temps de l'anim de sortie
  const [style, setStyle] = useState<React.CSSProperties>();

  // montage immédiat à l'ouverture (setState de rendu guardé → pas de boucle) ;
  // l'ENTRÉE est animée en CSS (@starting-style), la SORTIE via la classe is-closing,
  // puis on démonte après l'anim (~150 ms). Zéro rAF → robuste.
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open || !mounted) return;
    const id = window.setTimeout(() => setMounted(false), 160);
    return () => window.clearTimeout(id);
  }, [open, mounted]);

  // positionne l'info-bulle en `fixed` : centrée sur le tag mais BORNÉE à l'écran
  // (jamais coupée par un bord) ; au-dessus si la place le permet, sinon en dessous.
  const place = useCallback(() => {
    const el = ref.current;
    const tipEl = tipRef.current;
    if (!el || !tipEl) return;
    const r = el.getBoundingClientRect();
    const w = tipEl.offsetWidth;
    const h = tipEl.offsetHeight;
    const m = 10; // marge mini avec le bord de l'écran
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(m, Math.min(left, window.innerWidth - w - m));
    const above = r.top > h + 16;
    setStyle({ top: above ? r.top - h - 8 : r.bottom + 8, left });
  }, []);

  // mesure/positionne dès que la bulle est montée ; ferme au scroll / clic extérieur
  useLayoutEffect(() => {
    if (!mounted) return;
    place();
    const close = () => setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", place);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [mounted, place]);

  // desktop = survol ; tactile = tap (les deux gérés sans double-déclenchement)
  const canHover = () =>
    typeof matchMedia !== "undefined" && matchMedia("(hover: hover)").matches;

  const cls = `${BASE} ${SIZES[size]}`;
  const icons = (Array.isArray(icon) ? icon : icon ? [icon] : []).filter(
    Boolean,
  );
  const renderIcon = (ic: IconSpec, key: number) => {
    if (typeof ic === "string") return <BrandIcon key={key} path={ic} />;
    const GenericIcon = ic;
    return (
      <GenericIcon
        key={key}
        size={13}
        aria-hidden
        className="shrink-0 opacity-90"
      />
    );
  };
  // badge double (« Nginx / Caddy ») : chaque logo se place devant SON nom,
  // séparés par « / » — sinon, logo unique devant le libellé entier.
  const parts = children.split(" / ");
  const content =
    icons.length > 1 && parts.length === icons.length ? (
      <>
        {parts.map((part, i) => (
          <span key={part} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {renderIcon(icons[i], i)}
            {part}
          </span>
        ))}
      </>
    ) : (
      <>
        {icons.map(renderIcon)}
        {children}
      </>
    );

  if (!tip) return <span className={cls}>{content}</span>;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`${children} : ${tip}`}
        // garde l'anim « survol » du badge tant que la bulle est ouverte (mobile)
        data-active={open}
        onMouseEnter={() => canHover() && setOpen(true)}
        onMouseLeave={() => canHover() && setOpen(false)}
        onClick={() => !canHover() && setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={cls + " cursor-help"}
      >
        {content}
      </button>
      {mounted &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={style}
            className={
              "fixed left-0 top-0 z-[100] w-max max-w-[min(17rem,calc(100vw-1.25rem))] " +
              "rounded-lg border border-line bg-surface px-2.5 py-1.5 " +
              "text-[11px] leading-snug text-muted text-center " +
              "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] pointer-events-none " +
              "tooltip-anim" +
              (open ? "" : " is-closing")
            }
          >
            {tip}
          </div>,
          document.body,
        )}
    </>
  );
}
