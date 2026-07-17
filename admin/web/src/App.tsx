import { useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "./api";
import { Login } from "./components/Login";
import { Messages } from "./components/Messages";
import { Explorer } from "./components/Explorer";

type Session = "checking" | "in" | "out";
type Page = "messages" | "explorer";

export default function App() {
  const [session, setSession] = useState<Session>("checking");
  const [page, setPage] = useState<Page>("messages");

  useEffect(() => {
    // toute réponse 401 (session expirée) ramène à l'écran de connexion
    setUnauthorizedHandler(() => setSession("out"));
    api
      .get<{ ok: boolean }>("/api/me")
      .then((r) => setSession(r.ok ? "in" : "out"))
      .catch(() => setSession("out"));
  }, []);

  if (session === "checking") return null;
  if (session === "out") return <Login onLogin={() => setSession("in")} />;

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">
          <span className="chev">&gt;</span> crm — alexiswallez.fr
          <span className="cursor" />
        </span>
        <nav>
          <button
            className={`btn ${page === "messages" ? "active" : "ghost"}`}
            onClick={() => setPage("messages")}
          >
            Messages
          </button>
          <button
            className={`btn ${page === "explorer" ? "active" : "ghost"}`}
            onClick={() => setPage("explorer")}
          >
            Explorateur
          </button>
          <button
            className="btn ghost"
            onClick={async () => {
              await api.post("/api/logout");
              setSession("out");
            }}
          >
            Déconnexion
          </button>
        </nav>
      </header>
      {page === "messages" ? <Messages /> : <Explorer />}
    </div>
  );
}
