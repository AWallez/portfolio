import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

type Props = {
  /** id posé sur le champ (cible du <label for> et du focus de validation) */
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** id du <label> associé → nom accessible du champ */
  labelledBy: string;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** classes du champ (mêmes que les inputs du formulaire) */
  className?: string;
};

/**
 * Liste déroulante maison, rendue dans la page (contrairement à un <select>
 * natif dont le popup est dessiné par l'OS) → styles et curseur maîtrisés.
 *
 * Accessibilité : patron ARIA « combobox select-only » — le focus reste sur le
 * champ, l'option courante est désignée par `aria-activedescendant`.
 * Clavier : ↑/↓/Entrée/Espace ouvrent, ↑/↓ naviguent, Début/Fin vont aux
 * extrémités, Entrée/Espace valident, Échap ferme, Tab ferme et poursuit.
 */
export default function Select({
  id,
  value,
  onChange,
  options,
  labelledBy,
  placeholder = "—",
  required,
  invalid,
  describedBy,
  className = "",
}: Props) {
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  // reste monté le temps de l'animation de sortie (cf. `.dropdown-anim`)
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // montage immédiat à l'ouverture (setState de rendu gardé → pas de boucle) ;
  // l'ENTRÉE est animée en CSS (@starting-style), la SORTIE via `is-closing`.
  if (open && !mounted) setMounted(true);

  const selected = options.find((o) => o.value === value);

  /**
   * À l'ouverture, on surligne l'option SÉLECTIONNÉE (comme un select natif).
   * Si aucune ne l'est : rien à la souris (sinon la 1re option semble
   * définitivement survolée), mais la 1re au clavier — il faut un point de
   * départ visible à la navigation.
   */
  const openList = (fromKeyboard = false) => {
    const i = options.findIndex((o) => o.value === value);
    setActiveIndex(i >= 0 ? i : fromKeyboard ? 0 : -1);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  // démonte le menu une fois l'animation de sortie terminée
  useEffect(() => {
    if (open || !mounted) return;
    const id = window.setTimeout(() => setMounted(false), 150);
    return () => window.clearTimeout(id);
  }, [open, mounted]);

  // ferme au clic extérieur et au défilement de la page (le menu est ancré au champ)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // garde l'option courante visible pendant la navigation clavier
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const move = (delta: number) =>
    setActiveIndex((i) => {
      const next = i + delta;
      if (next < 0) return options.length - 1;
      if (next >= options.length) return 0;
      return next;
    });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList(true);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(); // laisse le focus poursuivre normalement
        break;
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) choose(options[activeIndex].value);
        break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-labelledby={labelledBy}
        aria-required={required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`${className} flex items-center justify-between gap-2 text-left`}
      >
        <span className={selected ? "" : "text-muted/50"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          // garde le focus sur le champ quand on clique une option
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg
                     border border-line bg-surface py-1 shadow-lg
                     dropdown-anim${open ? "" : " is-closing"}`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={o.value === value}
              onClick={() => choose(o.value)}
              // Le survol est géré en CSS et non en JS (plus de onMouseEnter) :
              // sur tactile, un tap émule un mouseenter → surlignage « collé »
              // après sélection. La variante `hover:` de Tailwind v4 ne s'applique
              // qu'aux appareils qui savent survoler → rien à désactiver à la main.
              // `activeIndex` ne sert plus qu'à la navigation clavier.
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm ${
                i === activeIndex
                  ? "bg-accent/10 text-accent"
                  : "text-ink hover:bg-accent/10 hover:text-accent"
              }`}
            >
              {o.label}
              {o.value === value && <Check size={14} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
