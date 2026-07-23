import { createClient } from "@/lib/supabase/server";
import { ddmm, parseISO, JOURS } from "@/lib/dates";

// Page publique ouverte depuis le lien du SMS (aucune connexion requise).
// S'appuie sur la fonction SQL SECURITY DEFINER `fiche_jour(token)`.
export default async function FicheJour({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fiche_jour", { p_token: params.token });

  const wrap: React.CSSProperties = { maxWidth: 460, margin: "40px auto", padding: 16 };

  if (error || !data) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Lien invalide ou expiré</h2>
          <p style={{ color: "#6b7686" }}>Impossible d’afficher cette fiche. Ouvrez l’application pour voir votre planning.</p>
        </div>
      </div>
    );
  }

  const f = data as {
    nom: string; date: string;
    affectations: { client_nom: string; ville: string | null; creneau: string; adresse: string | null }[];
    rdv: { titre: string; heure: string | null; lieu: string | null }[];
  };
  const d = parseISO(f.date);
  const jour = JOURS[(d.getDay() + 6) % 7];

  return (
    <div style={wrap}>
      <div style={{ background: "#39424e", color: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 800 }}><span style={{ background: "#d0212f", padding: "2px 8px", borderRadius: 5 }}>D2B</span> Planning</div>
        <div style={{ marginTop: 8, fontSize: 15 }}>{f.nom} — {jour} {ddmm(d)}</div>
      </div>

      {f.affectations?.map((a, i) => (
        <div key={i} style={card}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{a.client_nom}</div>
          <div style={{ color: "#6b7686", fontSize: 14, marginTop: 4 }}>📍 {a.ville ?? "—"} · {a.creneau.replace("_", "-")}</div>
          {a.adresse && <a href={`https://maps.google.com/?q=${encodeURIComponent(a.adresse)}`} style={{ color: "#2e77c9", fontSize: 14 }}>🧭 Itinéraire</a>}
        </div>
      ))}
      {f.rdv?.map((r, i) => (
        <div key={i} style={card}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{r.heure ? r.heure.slice(0, 5) + " · " : ""}{r.titre}</div>
          <div style={{ color: "#6b7686", fontSize: 14 }}>{r.lieu}</div>
        </div>
      ))}
      {(!f.affectations?.length && !f.rdv?.length) && (
        <div style={card}><p style={{ color: "#6b7686", margin: 0 }}>Rien de prévu ce jour.</p></div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 1px 4px rgba(20,30,50,.07)" };
