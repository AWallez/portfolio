import { useState } from "react";
import type { Contact, Status } from "../api";
import { api, STATUSES, STATUS_LABELS, typeLabel } from "../api";
import { fmtDate } from "./Messages";

type Props = {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
  onChanged: (updated: Contact | null) => void;
  onToast: (text: string, err?: boolean) => void;
};

export function Detail({ contact, onClose, onEdit, onChanged, onToast }: Props) {
  const [note, setNote] = useState(contact.note ?? "");
  const [busy, setBusy] = useState(false);

  async function setStatus(status: Status) {
    setBusy(true);
    try {
      const updated = await api.patch<Contact>(`/api/contacts/${contact.id}`, {
        status,
      });
      onChanged(updated);
    } catch {
      onToast("Échec de la mise à jour", true);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    setBusy(true);
    try {
      const updated = await api.patch<Contact>(`/api/contacts/${contact.id}`, {
        note,
      });
      onChanged(updated);
      onToast("Note enregistrée ✓");
    } catch {
      onToast("Échec de l'enregistrement", true);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement ce message ?")) return;
    setBusy(true);
    try {
      await api.del(`/api/contacts/${contact.id}`);
      onToast("Message supprimé");
      onChanged(null);
    } catch {
      onToast("Échec de la suppression", true);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="head">
          <h2>
            {contact.firstname} {contact.lastname}
          </h2>
          {contact.manual && <span className="manual-tag">ajouté à la main</span>}
          <button className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="status-row">
          {STATUSES.map((s) => (
            <button
              key={s}
              className="status-badge"
              disabled={busy}
              onClick={() => setStatus(s)}
              style={{
                color: `var(--st-${s})`,
                cursor: "pointer",
                opacity: contact.status === s ? 1 : 0.45,
                borderWidth: contact.status === s ? 2 : 1,
              }}
            >
              <span className="dot" />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <dl className="kv">
          <dt>type</dt>
          <dd>{typeLabel(contact.type)}</dd>
          <dt>email</dt>
          <dd>
            {contact.email ? (
              <a href={`mailto:${contact.email}`} style={{ color: "var(--accent)" }}>
                {contact.email}
              </a>
            ) : (
              "—"
            )}
          </dd>
          <dt>téléphone</dt>
          <dd>{contact.phone ?? "—"}</dd>
          <dt>reçu le</dt>
          <dd>{fmtDate(contact.created_at)}</dd>
          {contact.updated_at && (
            <>
              <dt>modifié le</dt>
              <dd>{fmtDate(contact.updated_at)}</dd>
            </>
          )}
          {contact.ip && (
            <>
              <dt>ip</dt>
              <dd style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>
                {contact.ip}
              </dd>
            </>
          )}
        </dl>

        {contact.message && <div className="message-box">{contact.message}</div>}

        <label className="field" style={{ marginTop: "1.2rem" }}>
          <span>note interne</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="relance prévue le…, contexte, montant du devis…"
          />
        </label>

        <div className="actions">
          <button
            className="btn primary"
            disabled={busy || note === (contact.note ?? "")}
            onClick={saveNote}
          >
            Enregistrer la note
          </button>
          <button className="btn" disabled={busy} onClick={onEdit}>
            ✎ Modifier
          </button>
          <button
            className="btn danger"
            disabled={busy}
            onClick={remove}
            style={{ marginLeft: "auto" }}
          >
            Supprimer
          </button>
        </div>
      </aside>
    </>
  );
}
