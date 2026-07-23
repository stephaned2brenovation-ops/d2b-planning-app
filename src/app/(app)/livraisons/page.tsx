import { getMyProfil, getChantiers, getLivraisons } from "@/lib/queries";
import { estBureau } from "@/lib/types";
import { addLivraison, toggleLivraison, deleteLivraison } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";
import { redirect } from "next/navigation";

export default async function LivraisonsPage() {
  const moi = await getMyProfil();
  if (!estBureau(moi?.role)) redirect("/");
  const [chantiers, livraisons] = await Promise.all([getChantiers(), getLivraisons()]);

  return (
    <div style={{ maxWidth: 780 }}>
      <h2 style={{ fontSize: 18 }}>Livraisons fournisseurs</h2>
      <p style={{ color: "#6b7686", fontSize: 13, marginTop: -6 }}>
        Suivi des livraisons et de la pose (chantier) concernée.
      </p>

      <div style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginTop: 0 }}>Nouvelle livraison</h3>
        <form action={addLivraison} style={row}>
          <input type="date" name="date" required style={inp} />
          <input name="fournisseur" placeholder="Fournisseur (ex : FENETREA)" required style={inp} />
          <input name="description" placeholder="Contenu (ex : QUINAT ALU + GONZALEZ VRE)" style={{ ...inp, flex: 1, minWidth: 200 }} />
          <select name="chantier_id" style={inp} defaultValue="">
            <option value="">Pose concernée…</option>
            {chantiers.map((c) => <option key={c.id} value={c.id}>{c.client_nom}</option>)}
          </select>
          <button style={btnAdd}>+ Ajouter</button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {livraisons.map((l) => (
          <div key={l.id} style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: "#6b7686", width: 90 }}>{l.date}</span>
            <b style={{ fontSize: 13 }}>{l.fournisseur}</b>
            <span style={{ fontSize: 12.5, color: "#39424e", flex: 1 }}>{l.description}</span>
            {l.chantiers?.client_nom && <span style={{ fontSize: 11.5, background: "#e6f2e8", color: "#256b31", borderRadius: 6, padding: "2px 8px" }}>→ {l.chantiers.client_nom}</span>}
            <form action={toggleLivraison}>
              <input type="hidden" name="id" value={l.id} />
              <input type="hidden" name="statut" value={l.statut} />
              <button style={{ ...pill, background: l.statut === "recue" ? "#1f9d55" : "#f4f5f7", color: l.statut === "recue" ? "#fff" : "#6b7686" }}>
                {l.statut === "recue" ? "✓ Reçue" : "Attendue"}
              </button>
            </form>
            <form action={deleteLivraison}>
              <input type="hidden" name="id" value={l.id} />
              <ConfirmButton message={`Supprimer la livraison ${l.fournisseur} ?`} style={btnDel} title="Supprimer">✕</ConfirmButton>
            </form>
          </div>
        ))}
        {livraisons.length === 0 && <p style={{ color: "#6b7686" }}>Aucune livraison enregistrée.</p>}
      </div>
    </div>
  );
}

const row: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const inp: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e7e9ee", borderRadius: 8, fontSize: 13 };
const btnAdd: React.CSSProperties = { border: 0, background: "#1f9d55", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const pill: React.CSSProperties = { border: 0, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnDel: React.CSSProperties = { width: 30, height: 30, border: 0, background: "#fdecee", color: "#d0212f", borderRadius: 8, cursor: "pointer" };
