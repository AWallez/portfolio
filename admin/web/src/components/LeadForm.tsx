import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";

type Props = { onClose: () => void; onCreated: () => void };

// Provenances possibles d'un lead ajouté à la main.
const SOURCES = [
  ["malt", "Malt"],
  ["linkedin", "LinkedIn"],
  ["telephone", "Téléphone"],
  ["project", "Projet (autre canal)"],
  ["hiring", "Recrutement"],
  ["other", "Autre"],
] as const;

export function LeadForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    type: "malt",
    message: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // on n'envoie que les champs remplis (email vide ≠ email invalide)
      const body: Record<string, string> = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        type: form.type,
      };
      if (form.email.trim()) body.email = form.email.trim();
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.message.trim()) body.message = form.message.trim();
      if (form.note.trim()) body.note = form.note.trim();
      await api.post("/api/contacts", body);
      onCreated();
    } catch {
      setError("Échec de l'ajout — vérifie les champs (email valide ?).");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <form className="modal" onSubmit={submit}>
        <h2>
          <span style={{ color: "var(--accent)" }}>+</span> nouveau_lead
        </h2>
        <div className="grid-2">
          <label className="field">
            <span>prénom *</span>
            <input
              value={form.firstname}
              onChange={(e) => set("firstname", e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>nom *</span>
            <input
              value={form.lastname}
              onChange={(e) => set("lastname", e.target.value)}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>provenance *</span>
          <select value={form.type} onChange={(e) => set("type", e.target.value)}>
            {SOURCES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          <label className="field">
            <span>email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
          <label className="field">
            <span>téléphone</span>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>demande / contexte</span>
          <textarea
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="ce que cherche le prospect…"
          />
        </label>
        <label className="field">
          <span>note interne</span>
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            style={{ minHeight: 60 }}
          />
        </label>
        {error && <p className="error" style={{ color: "var(--danger)" }}>{error}</p>}
        <div className="actions" style={{ display: "flex", gap: "0.6rem" }}>
          <button className="btn primary" disabled={busy}>
            {busy ? "…" : "Ajouter"}
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </>
  );
}
