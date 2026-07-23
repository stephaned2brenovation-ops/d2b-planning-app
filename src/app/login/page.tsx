"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setChargement(false);
    if (error) {
      setErreur("Email ou mot de passe incorrect.");
    } else {
      router.push("/");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f0f2f5" }}>
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 30px rgba(20,30,50,.12)" }}>
        <div style={{ background: "#39424e", padding: "20px 24px", textAlign: "center" }}>
          <Image src="/logo-d2b.png" alt="D2B Rénovation" height={48} width={240} style={{ objectFit: "contain" }} priority />
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 6, letterSpacing: 1 }}>PLANNING</div>
        </div>
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>Connexion</h2>
          <p style={{ color: "#6b7686", fontSize: 13, margin: "0 0 20px" }}>
            Entrez votre email et mot de passe.
          </p>
          <form onSubmit={login}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              style={inputStyle}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              style={inputStyle}
            />
            <button type="submit" disabled={chargement} style={btnStyle}>
              {chargement ? "Connexion…" : "Se connecter"}
            </button>
          </form>
          {erreur && <p style={{ color: "#d0212f", fontSize: 13, marginTop: 12 }}>{erreur}</p>}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: 12, border: "1px solid #e7e9ee", borderRadius: 10,
  fontSize: 15, marginBottom: 12, boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  width: "100%", padding: 13, border: 0, borderRadius: 12, cursor: "pointer",
  background: "#39424e", color: "#fff", fontSize: 14, fontWeight: 700,
};
