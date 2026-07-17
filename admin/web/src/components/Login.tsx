import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/api/login", { password });
      onLogin();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "bad_password"
          ? "Mot de passe incorrect."
          : "Connexion impossible (réessaie dans une minute).",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Connexion</h1>
        <p className="sub">CRM · alexiswallez.fr</p>
        <label className="field">
          <span>mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </label>
        <button className="btn primary" disabled={busy} style={{ width: "100%" }}>
          {busy ? "…" : "Entrer"}
        </button>
        <p className="error">{error}</p>
      </form>
    </div>
  );
}
