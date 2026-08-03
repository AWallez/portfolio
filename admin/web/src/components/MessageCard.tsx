import { useEffect, useRef, useState } from "react";
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
  const msgRef = useRef<HTMLSpanElement>(null);

  // « Afficher plus » n'a de sens que si le message déborde réellement des trois
  // lignes de l'aperçu. On ne re-mesure pas une fois déplié : le texte remplit
  // alors sa boîte, la mesure conclurait à tort qu'il n'y a plus rien à replier.
  useEffect(() => {
    const el = msgRef.current;
    if (el && !expanded) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [contact.message, expanded]);

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
      className={`msg-card ${contact.status === "non_lu" ? "unread" : ""}`}
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
          <span className="mail">{contact.email ?? contact.phone ?? "—"}</span>
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

      {/* Statut modifiable directement */}
      <div className="status-pills">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`spill ${contact.status === s ? "on" : ""}`}
            disabled={busy}
            onClick={() => patch({ status: s })}
            style={{ ["--sc" as string]: `var(--st-${s})` }}
          >
            <span className="dot" />
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Note dépliable */}
      <div className="note-block">
        <button
          className="note-toggle"
          onClick={() => setNoteOpen((v) => !v)}
        >
          <IconNote />
          {contact.note
            ? noteOpen
              ? "Masquer la note"
              : "Note : " + contact.note.slice(0, 60) + (contact.note.length > 60 ? "…" : "")
            : noteOpen
              ? "Masquer"
              : "Ajouter une note"}
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
