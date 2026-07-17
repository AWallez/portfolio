import { useCallback, useEffect, useState } from "react";
import type { Contact, ContactList, Status } from "../api";
import { api, STATUSES, STATUS_LABELS, TYPE_LABELS } from "../api";
import { Detail } from "./Detail";
import { LeadForm } from "./LeadForm";

export function fmtDate(s: string): string {
  return new Date(s).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function Messages() {
  const [status, setStatus] = useState<Status | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ContactList | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showLead, setShowLead] = useState(false);
  const [toast, setToast] = useState<{ text: string; err?: boolean } | null>(
    null,
  );

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    params.set("page", String(page));
    setData(await api.get<ContactList>(`/api/contacts?${params}`));
  }, [status, q, page]);

  // rechargement (léger debounce pour la recherche au clavier)
  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => setToast({ text: "Erreur de chargement", err: true }));
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <div className="filters">
        <button
          className={`pill ${status === "" ? "active" : ""}`}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          Tous{" "}
          <span className="n">
            {data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : "…"}
          </span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`pill ${status === s ? "active" : ""}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            <span className="dot" style={{ background: `var(--st-${s})` }} />
            {STATUS_LABELS[s]} <span className="n">{data?.counts[s] ?? "…"}</span>
          </button>
        ))}
        <input
          className="search"
          placeholder="rechercher…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <button className="btn primary" onClick={() => setShowLead(true)}>
          + Lead
        </button>
      </div>

      <div className="card">
        {data && data.items.length === 0 ? (
          <div className="empty">aucun message</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>contact</th>
                <th>type</th>
                <th>message</th>
                <th>statut</th>
                <th>reçu le</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr
                  key={c.id}
                  className={`row ${c.status === "non_lu" ? "unread" : ""}`}
                  onClick={() => setSelected(c)}
                >
                  <td className="who">
                    <span className="name">
                      {c.firstname} {c.lastname}{" "}
                      {c.manual && <span className="manual-tag">· manuel</span>}
                    </span>
                    <span className="mail">{c.email ?? "—"}</span>
                  </td>
                  <td>
                    <span className="tag">{TYPE_LABELS[c.type] ?? c.type}</span>
                  </td>
                  <td>
                    <div className="snippet">{c.message ?? "—"}</div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ color: `var(--st-${c.status})` }}
                    >
                      <span className="dot" />
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="date">{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="pager">
          <button
            className="btn ghost"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ←
          </button>
          page {page} / {pages}
          <button
            className="btn ghost"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            →
          </button>
        </div>
      )}

      {selected && (
        <Detail
          contact={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => {
            if (updated) setSelected(updated);
            else setSelected(null); // supprimé
            load().catch(() => {});
          }}
          onToast={(text, err) => setToast({ text, err })}
        />
      )}
      {showLead && (
        <LeadForm
          onClose={() => setShowLead(false)}
          onCreated={() => {
            setShowLead(false);
            setToast({ text: "Lead ajouté ✓" });
            load().catch(() => {});
          }}
        />
      )}
      {toast && (
        <div className={`toast ${toast.err ? "err" : ""}`}>{toast.text}</div>
      )}
    </>
  );
}
