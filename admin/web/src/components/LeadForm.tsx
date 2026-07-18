import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Contact } from "../api";
import { api, typeLabel } from "../api";

type Props = {
  contact: Contact | null; // null = création
  onClose: () => void;
  onSaved: (isNew: boolean) => void;
};

const NEW = "__new__";

export function LeadForm({ contact, onClose, onSaved }: Props) {
  const isNew = contact === null;
  const [types, setTypes] = useState<string[]>([]);
  const [form, setForm] = useState({
    firstname: contact?.firstname ?? "",
    lastname: contact?.lastname ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    type: contact?.type ?? "",
    message: contact?.message ?? "",
    note: contact?.note ?? "",
  });
  // quand l'utilisateur choisit « Nouveau type… »
  const [newType, setNewType] = useState("");
  const [creatingType, setCreatingType] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // charge la liste des types depuis la base (SELECT DISTINCT)
  useEffect(() => {
    api
      .get<string[]>("/api/contacts/types")
      .then((list) => {
        setTypes(list);
        // valeur par défaut à la création : premier type existant, sinon création
        if (isNew && !form.type) {
          if (list.length > 0) setForm((f) => ({ ...f, type: list[0] }));
          else setCreatingType(true);
        }
      })
      .catch(() => setTypes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTypeSelect(value: string) {
    if (value === NEW) {
      setCreatingType(true);
      setNewType("");
    } else {
      setCreatingType(false);
      set("type", value);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const finalType = (creatingType ? newType : form.type).trim();
    if (!finalType) {
      setError("Choisis ou saisis un type.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        const body: Record<string, string> = {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          type: finalType,
        };
        if (form.email.trim()) body.email = form.email.trim();
        if (form.phone.trim()) body.phone = form.phone.trim();
        if (form.message.trim()) body.message = form.message.trim();
        if (form.note.trim()) body.note = form.note.trim();
        await api.post("/api/contacts", body);
      } else {
        await api.patch(`/api/contacts/${contact.id}`, {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          type: finalType,
          message: form.message,
          note: form.note,
        });
      }
      onSaved(isNew);
    } catch {
      setError("Échec de l'enregistrement — vérifie les champs (email valide ?).");
      setBusy(false);
    }
  }

  // dans la liste, la valeur courante peut être un type qui n'est pas (encore)
  // dans le SELECT DISTINCT si on édite : on l'ajoute pour ne pas le perdre.
  const options = types.includes(form.type) || !form.type
    ? types
    : [form.type, ...types];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <form className="modal" onSubmit={submit}>
        <h2>{isNew ? "Nouveau lead" : "Modifier le contact"}</h2>
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
          <span>type *</span>
          {!creatingType ? (
            <select
              value={form.type}
              onChange={(e) => onTypeSelect(e.target.value)}
            >
              {options.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
              <option value={NEW}>+ Nouveau type…</option>
            </select>
          ) : (
            <div className="inline-new">
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="nom du nouveau type"
                autoFocus
              />
              {types.length > 0 && (
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    setCreatingType(false);
                    set("type", types[0]);
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          )}
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
            className="tall"
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

        {error && (
          <p className="error" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        <div className="actions" style={{ display: "flex", gap: "0.6rem" }}>
          <button className="btn primary" disabled={busy}>
            {busy ? "…" : isNew ? "Ajouter" : "Enregistrer"}
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </>
  );
}
