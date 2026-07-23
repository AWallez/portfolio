import { useEffect, useState } from "react";
import type { DbInfo, TableInfo, TableRows } from "../api";
import { api } from "../api";

function Cell({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="cell-null">null</span>;
  if (typeof value === "object")
    return <span title={JSON.stringify(value)}>{JSON.stringify(value)}</span>;
  const s = String(value);
  return <span title={s}>{s}</span>;
}

export function Explorer() {
  const [dbs, setDbs] = useState<DbInfo[]>([]);
  const [db, setDb] = useState<string>("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [table, setTable] = useState<string>("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [data, setData] = useState<TableRows | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<DbInfo[]>("/api/explorer/dbs")
      .then((list) => {
        setDbs(list);
        if (list.length > 0) setDb(list[0].name);
      })
      .catch(() => setError("Impossible de lister les bases."));
  }, []);

  useEffect(() => {
    if (!db) return;
    setTable("");
    setData(null);
    setQ("");
    api
      .get<TableInfo[]>(`/api/explorer/dbs/${db}/tables`)
      .then(setTables)
      .catch(() => setError("Impossible de lister les tables."));
  }, [db]);

  // léger debounce : évite une requête par frappe dans la recherche
  useEffect(() => {
    if (!db || !table) return;
    setError("");
    const t = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page) });
      if (q.trim()) params.set("q", q.trim());
      api
        .get<TableRows>(`/api/explorer/dbs/${db}/tables/${table}/rows?${params}`)
        .then(setData)
        .catch(() => setError("Impossible de lire la table."));
    }, 200);
    return () => clearTimeout(t);
  }, [db, table, page, q]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="explorer">
      <aside className="side">
        <div className="section">bases</div>
        {dbs.map((d) => (
          <button
            key={d.name}
            className={db === d.name ? "active" : ""}
            onClick={() => setDb(d.name)}
          >
            {d.label}
          </button>
        ))}
        <div className="section">tables</div>
        {tables.map((t) => (
          <button
            key={t.name}
            className={table === t.name ? "active" : ""}
            onClick={() => {
              setTable(t.name);
              setPage(1);
              setQ("");
            }}
          >
            {t.name} <span className="n">{t.approx_rows}</span>
          </button>
        ))}
      </aside>

      <div>
        {table && (
          <input
            className="explorer-search"
            placeholder={`rechercher dans ${table}…`}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        )}
        {error && <div className="empty">{error}</div>}
        {!error && !table && (
          <div className="card">
            <div className="empty">choisis une table — lecture seule</div>
          </div>
        )}
        {!error && table && data && (
          <>
            {data.rows.length === 0 ? (
              <div className="card">
                <div className="empty">
                  {q.trim() ? "aucun résultat pour cette recherche" : "table vide"}
                </div>
              </div>
            ) : (
              <div className="row-grid">
                {data.rows.map((row, i) => (
                  <article className="row-card" key={i}>
                    {data.columns.map((c) => (
                      <div className="rc-field" key={c.name}>
                        <span className="rc-label" title={c.type}>
                          {c.name}
                        </span>
                        <span className="rc-value">
                          <Cell value={row[c.name]} />
                        </span>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            )}
            <div className="pager">
              {data.total} ligne{data.total > 1 ? "s" : ""}
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
          </>
        )}
      </div>
    </div>
  );
}
