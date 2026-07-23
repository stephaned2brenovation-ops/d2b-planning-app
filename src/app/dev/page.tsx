"use client";

export const dynamic = "force-dynamic";

/**
 * Page de connexion DEV uniquement — ne pas déployer en production.
 * Utilise email + mot de passe (Supabase Auth) pour bypasser le SMS OTP.
 * Accès : http://localhost:3000/dev
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DevLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("direction@d2b.fr");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setChargement(false);
    if (error) setErreur(error.message);
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 320, boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ background: "#c85a11", color: "#fff", padding: "4px 10px", borderRadius: 6, fontWeight: 800 }}>D2B</span>
          <span style={{ fontWeight: 700, marginLeft: 8 }}>Planning</span>
          <div style={{ marginTop: 8, fontSize: 12, color: "#f59e0b", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 10px" }}>
            ⚠️ Accès développement local uniquement
          </div>
        </div>
        <form onSubmit={login}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: "100%", padding: 10, border: "1px solid #e7e9ee", borderRadius: 8, marginBottom: 10, fontSize: 14, boxSizing: "border-box" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            style={{ width: "100%", padding: 10, border: "1px solid #e7e9ee", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" }}
          />
          <button type="submit" disabled={chargement}
            style={{ width: "100%", padding: 12, background: "#39424e", color: "#fff", border: 0, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {chargement ? "Connexion…" : "Se connecter (dev)"}
          </button>
        </form>
        {erreur && <p style={{ color: "#c85a11", fontSize: 13, marginTop: 10 }}>{erreur}</p>}
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16, textAlign: "center" }}>
          Cette page n'existe pas en production.
        </p>
      </div>
    </div>
  );
}
