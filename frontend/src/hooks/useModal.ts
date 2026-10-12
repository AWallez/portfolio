import { useEffect, type RefObject } from "react";

// Éléments qui peuvent VRAIMENT recevoir le focus : un bouton grisé (zoom au
// minimum, par exemple) n'en fait pas partie. Les compter faisait du premier
// bouton, grisé, la borne du piège : Maj+Tab sortait alors de la modale.
const FOCUSABLE =
  "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), " +
  'textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Affiché ? Un élément masqué (display: none sur lui ou un parent, comme les
// boutons de zoom sur téléphone) ne peut pas prendre le focus : compté, il
// servirait de borne au piège et Tab n'irait plus nulle part.
function affiche(el: HTMLElement, racine: HTMLElement) {
  for (let n: HTMLElement | null = el; n && n !== racine; n = n.parentElement)
    if (getComputedStyle(n).display === "none") return false;
  return true;
}

/**
 * Comportement commun des modales (Lightbox, CvModal) : focus initial, Échap,
 * piège du focus (WCAG 2.4.3), arrière-plan figé, et focus rendu à l'élément
 * d'origine à la fermeture.
 */
export function useModal(
  dialogRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    initialFocusRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => affiche(n, root),
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      // focus hors de la liste (bouton devenu grisé sous le focus, clic dans
      // une zone non focusable) : on le ramène dans la modale
      if (i === -1) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && i === 0) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && i === focusables.length - 1) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // bloque le scroll de l'arrière-plan en verrouillant documentElement
    // (l'élément qui défile). On compense la largeur de la scrollbar pour
    // éviter un saut horizontal au moment du verrouillage.
    const docEl = document.documentElement;
    const scrollbarW = window.innerWidth - docEl.clientWidth;
    const prevOverflow = docEl.style.overflow;
    const prevPad = docEl.style.paddingRight;
    docEl.style.overflow = "hidden";
    if (scrollbarW > 0) docEl.style.paddingRight = `${scrollbarW}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      docEl.style.overflow = prevOverflow;
      docEl.style.paddingRight = prevPad;
      prevFocus?.focus?.();
    };
  }, [dialogRef, initialFocusRef, onClose]);
}
