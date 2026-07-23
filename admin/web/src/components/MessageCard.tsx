import { useState } from "react";
import type { Contact } from "../api";
import { api, STATUSES, STATUS_LABELS, typeColor, typeLabel } from "../api";
import { fmtDate } from "./Messages";
import { IconPencil, IconTrash, IconNote } from "./icons";

type Props = {
  contact: Contact;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChanged: (updated: Contact) => void;
  onToast: (text: string, err?: boolean) => void;
};

export function MessageCard({
  contact,
  onOpen,
  onEdit,
  onDelete,
  onChanged,
  onToast,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(contact.note ?? "");

  async function patch(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      const updated = await api.patch<Contact>(
        `/api/contacts/${contact.id}`,
        body,
      );
      onChanged(updated);
      if (okMsg) onToast(okMsg);
    } catch {
      onToast("Échec de la mise à jour", true);
    } finally {
      setBusy(false);
    }
  }

  const tColor = typeColor(contact.type);

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

      {/* Zone cliquable → panneau de lecture */}
      <button className="card-body" onClick={onOpen}>
        <span className="who">
          <span className="name">
            {contact.firstname} {contact.lastname}
          </span>
          <span className="mail">{contact.email ?? contact.phone ?? "—"}</span>
        </span>
        {contact.message && <span className="preview">{contact.message}</span>}
      </button>

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
        <span className="date">{fmtDate(contact.created_at)}</span>
      </footer>
    </article>
  );
}
