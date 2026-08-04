import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Contact } from "../api";
import { api, STATUSES, STATUS_LABELS, typeColor, typeLabel } from "../api";
import { fmtDate } from "./Messages";
import { deletion, ipErasure, relative } from "../retention";
import { IconPencil, IconTrash, IconNote } from "./icons";

type Props = {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onChanged: () => void;
  onToast: (text: string, err?: boolean) => void;
};

export function MessageCard({
  contact,
  onEdit,
  onDelete,
  onChanged,
  onToast,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(contact.note ?? "");
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  // position du menu, en coordonnées écran : il est rendu dans un portail, hors
  // de la carte (cf. openStatus)
  const [menuAt, setMenuAt] = useState<{ top: number; left: number } | null>(null);
  const statusOpen = menuAt !== null;
  const msgRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  function openStatus() {
    const r = triggerRef.current?.getBoundingClientRect();
    setMenuAt(r ? { top: r.bottom + 6, left: r.left } : null);
  }

  // « Afficher plus » n'a de sens que si le message déborde réellement des trois
  // lignes de l'aperçu. On ne re-mesure pas une fois déplié : le texte remplit
  // alors sa boîte, la mesure conclurait à tort qu'il n'y a plus rien à replier.
  useEffect(() => {
    const el = msgRef.current;
    if (el && !expanded) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [contact.message, expanded]);

  // Fermeture du menu : clic ailleurs, Échap, ou défilement — le menu étant
  // posé en coordonnées écran, il se décalerait de son bouton si la page bouge.
  useEffect(() => {
    if (!statusOpen) return;
    const close = () => setMenuAt(null);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t))
        close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [statusOpen]);

  async function patch(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      await api.patch<Contact>(`/api/contacts/${contact.id}`, body);
      onChanged();
      if (okMsg) onToast(okMsg);
    } catch {
      onToast("Échec de la mise à jour", true);
    } finally {
      setBusy(false);
    }
  }

  const tColor = typeColor(contact.type);
  const ipExp = ipErasure(contact.created_at);
  const delExp = deletion(contact.created_at);

  return (
    <article
      className={`msg-card${contact.status === "non_lu" ? " unread" : ""}`}
      style={{ ["--st" as string]: `var(--st-${contact.status})` }}
    >
      {/* Badge type en haut, couleur dérivée du type */}
      <div className="card-top">
        <span
          className="type-badge"
          style={{
            color: tColor,
            background: `color-mix(in srgb, ${tColor} 16%, transparent)`,
            borderColor: `color-mix(in srgb, ${tColor} 40%, transparent)`,
          }}
        >
          {typeLabel(contact.type)}
        </span>
        {contact.manual && <span className="manual-tag">manuel</span>}
        <span className="spacer" />
        <button
          className="icon-btn"
          title="Modifier"
          aria-label="Modifier"
          onClick={onEdit}
        >
          <IconPencil />
        </button>
        <button
          className="icon-btn danger"
          title="Supprimer"
          aria-label="Supprimer"
          onClick={onDelete}
        >
          <IconTrash />
        </button>
      </div>

      {/* Identité + message. Plus de clic vers un panneau : tout est éditable
          ici ou via « Modifier ». */}
      <div className="card-body">
        <span className="who">
          <span className="name">
            {contact.firstname} {contact.lastname}
          </span>
          {/* les deux, quand les deux existent : `email ?? phone` masquait le
              téléphone dès qu'il y avait un email */}
          <span className="mail">
            {[contact.email, contact.phone].filter(Boolean).join("  ·  ") || "—"}
          </span>
        </span>
        {contact.message && (
          <>
            <span
              ref={msgRef}
              className={`preview${expanded ? " open" : ""}`}
            >
              {contact.message}
            </span>
            {clamped && (
              <button
                className="more-toggle"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Réduire" : "Afficher plus"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Statut : seul le courant est affiché, les autres se déroulent au clic.
          Les cinq pastilles côte à côte sur chaque carte faisaient 5× plus de
          bruit coloré que d'information — quatre options non retenues sur cinq. */}
      <div className="status-menu">
        <button
          ref={triggerRef}
          className="spill on"
          disabled={busy}
          aria-haspopup="listbox"
          aria-expanded={statusOpen}
          onClick={() => (statusOpen ? setMenuAt(null) : openStatus())}
          style={{ ["--sc" as string]: `var(--st-${contact.status})` }}
        >
          <span className="dot" />
          {STATUS_LABELS[contact.status]}
          <span className="chev" aria-hidden>
            ▾
          </span>
        </button>
        {/* Rendu hors de la carte : celle-ci a un `backdrop-filter`, ce qui en
            fait une racine d'arrière-plan — un enfant ne peut alors flouter que
            ce qui est peint À L'INTÉRIEUR de la carte, donc rien. Sorti dans le
            body, le menu retrouve la page comme arrière-plan et le flou opère,
            comme sur la barre du haut. */}
        {menuAt &&
          createPortal(
            <ul
              ref={menuRef}
              className="status-list"
              role="listbox"
              style={{ top: menuAt.top, left: menuAt.left }}
            >
              {STATUSES.map((s) => (
                <li key={s}>
                  <button
                    role="option"
                    aria-selected={contact.status === s}
                    className={contact.status === s ? "on" : undefined}
                    disabled={busy}
                    onClick={() => {
                      setMenuAt(null);
                      if (s !== contact.status) patch({ status: s });
                    }}
                    style={{ ["--sc" as string]: `var(--st-${s})` }}
                  >
                    <span className="dot" />
                    {STATUS_LABELS[s]}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>

      {/* Note. Sans note, le libellé disparaît : il ne reste qu'une icône
          discrète, au lieu d'une ligne pleine répétée sur chaque carte. */}
      <div className={`note-block${contact.note ? " has-note" : ""}`}>
        <button
          className="note-toggle"
          title={contact.note ? undefined : "Ajouter une note"}
          aria-label={contact.note ? undefined : "Ajouter une note"}
          onClick={() => setNoteOpen((v) => !v)}
        >
          <IconNote />
          {contact.note
            ? noteOpen
              ? "Masquer la note"
              : "Note : " +
                contact.note.slice(0, 60) +
                (contact.note.length > 60 ? "…" : "")
            : noteOpen
              ? "Masquer"
              : null}
        </button>
        {noteOpen && (
          <div className="note-edit">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="relance prévue, contexte, montant du devis…"
            />
            <button
              className="btn primary sm"
              disabled={busy || note === (contact.note ?? "")}
              onClick={() => patch({ note }, "Note enregistrée ✓")}
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <footer>
        <div className="card-meta">
          <span className="date">{fmtDate(contact.created_at)}</span>
          {contact.ip && <span className="ip">{contact.ip}</span>}
        </div>
        {/* Échéances de la purge RGPD (backend/src/retention.ts) */}
        <div className="card-expiry">
          {!contact.manual && (
            <>
              {contact.ip ? (
                <span className={ipExp.soon ? "soon" : undefined}>
                  ip effacée {relative(ipExp.days)}
                </span>
              ) : (
                <span>ip déjà effacée</span>
              )}
              {" · "}
            </>
          )}
          <span className={delExp.soon ? "soon" : undefined}>
            fiche supprimée {relative(delExp.days)}
          </span>
        </div>
      </footer>
    </article>
  );
}
