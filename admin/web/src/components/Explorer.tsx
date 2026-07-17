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
    api
      .get<TableInfo[]>(`/api/explorer/dbs/${db}/tables`)
      .then(setTables)
      .catch(() => setError("Impossible de lister les tables."));
  }, [db]);

  useEffect(() => {
    if (!db || !table) return;
    setError("");
    api
      .get<TableRows>(
        `/api/explorer/dbs/${db}/tables/${table}/rows?page=${page}`,
      )
      .then(setData)
      .catch(() => setError("Impossible de lire la table."));
  }, [db, table, page]);

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
            }}
          >
            {t.name} <span className="n">{t.approx_rows}</span>
          </button>
        ))}
      </aside>

      <div>
        {error && <div className="empty">{error}</div>}
        {!error && !table && (
          <div className="card">
            <div className="empty">choisis une table — lecture seule</div>
          </div>
        )}
        {!error && table && data && (
          <>
            <div className="card table-scroll">
              <table>
                <thead>
                  <tr>
                    {data.columns.map((c) => (
                      <th key={c.name} title={c.type}>
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i}>
                      {data.columns.map((c) => (
                        <td key={c.name} data-label={c.name}>
                          <Cell value={row[c.name]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              {data.total} lignes
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
