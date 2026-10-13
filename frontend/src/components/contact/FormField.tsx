import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Champ du formulaire de contact : libellé (petite icône lucide, raccord avec
// les badges du site, et astérisque si requis), le contrôle, puis son erreur.
export default function FormField({
  id,
  icon: Icon,
  label,
  required = false,
  error,
  labelId,
  children,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  required?: boolean;
  /** message d'erreur déjà traduit, lié au contrôle par `err-{id}` */
  error?: string;
  /** id du libellé, pour un contrôle qui s'y rattache par aria-labelledby */
  labelId?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="font-mono text-xs text-muted mb-1 flex items-center gap-1.5"
        htmlFor={id}
        id={labelId}
      >
        <Icon size={12} aria-hidden className="text-accent shrink-0" />
        {label}
        {required && (
          <span aria-hidden="true" className="text-accent">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {/* rouge foncé en thème clair (red-500 en 12 px ne faisait que 3,4:1) */}
      {error && (
        <p id={`err-${id}`} className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
