"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [etape, setEtape] = useState<"tel" | "code">("tel");
  const [tel, setTel] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  // Met au format international français : 06… -> +336…
  function formatTel(v: string) {
    let t = v.replace(/[^\d+]/g, "");
    if (t.startsWith("0")) t = "+33" + t.slice(1);
    return t;
  }

  async function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    await supabase.auth.signInWithOtp({ phone: formatTel(tel) });
    setChargement(false);
    // On passe toujours à l'étape code (les numéros de test Supabase
    // fonctionnent au niveau verifyOtp même si signInWithOtp renvoie une erreur)
    setEtape("code");
  }

  async function verifierCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatTel(tel),
      token: code,
      type: "sms",
    });
    setChargement(false);
    if (error) setErreur(error.message);
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 30px rgba(20,30,50,.12)" }}>
        <div style={{ background: "#39424e", padding: "20px 24px", textAlign: "center" }}>
          <Image src="/logo-d2b.png" alt="D2B Rénovation" height={48} width={240} style={{ objectFit: "contain" }} priority />
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 6, letterSpacing: 1 }}>PLANNING</div>
        </div>
        <div style={{ padding: 24 }}>
          {etape === "tel" ? (
            <form onSubmit={envoyerCode}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>Connexion</h2>
              <p style={{ color: "#6b7686", fontSize: 13, margin: "0 0 16px" }}>
                Entrez votre numéro de téléphone. Vous recevrez un code par SMS.
              </p>
              <input
                type="tel"
                required
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="06 12 34 56 78"
                style={inputStyle}
              />
              <button type="submit" disabled={chargement} style={btnStyle}>
                {chargement ? "Envoi…" : "Recevoir le code par SMS"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifierCode}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>Code de vérification</h2>
              <p style={{ color: "#6b7686", fontSize: 13, margin: "0 0 16px" }}>
                Code envoyé au {tel}.
              </p>
              <input
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code à 6 chiffres"
                style={{ ...inputStyle, letterSpacing: 4, textAlign: "center", fontSize: 20 }}
              />
              <button type="submit" disabled={chargement} style={btnStyle}>
                {chargement ? "Vérification…" : "Valider"}
              </button>
              <button type="button" onClick={() => setEtape("tel")} style={{ ...btnStyle, background: "transparent", color: "#6b7686", marginTop: 6 }}>
                Changer de numéro
              </button>
            </form>
          )}
          {erreur && <p style={{ color: "var(--rouge)", fontSize: 13, marginTop: 12 }}>{erreur}</p>}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: 12, border: "1px solid #e7e9ee", borderRadius: 10,
  fontSize: 16, marginBottom: 12,
};
const btnStyle: React.CSSProperties = {
  width: "100%", padding: 13, border: 0, borderRadius: 12, cursor: "pointer",
  background: "var(--anthracite)", color: "#fff", fontSize: 14, fontWeight: 700,
};
