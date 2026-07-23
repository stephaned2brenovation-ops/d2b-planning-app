import { getMyProfil, getChantiers } from "@/lib/queries";
import { estBureau, STATUT_LABEL, STATUT_COLOR, type StatutChantier } from "@/lib/types";
import { addChantier, updateChantier, deleteChantier } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";
import { redirect } from "next/navigation";

const STATUTS: StatutChantier[] = ["a_planifier", "en_cours", "termine", "sav"];

export default async function ChantiersPage() {
  const moi = await getMyProfil();
  if (!estBureau(moi?.role)) redirect("/");
  const chantiers = await getChantiers();

  return (
    <div style={{ maxWidth: 820 }}>
      <h2 style={{ fontSize: 18 }}>Chantiers</h2>

      <div style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginTop: 0 }}>Nouveau chantier</h3>
        <form action={addChantier} style={grid}>
          <input name="client_nom" placeholder="Client" required style={inp} />
          <input name="designation" placeholder="Désignation (ex : 1F 2vtx)" style={inp} />
          <input name="ville" placeholder="Ville" style={inp} />
          <input name="adresse" placeholder="Adresse (pour l'itinéraire)" style={inp} />
          <input name="contact_tel" placeholder="Tél. contact" style={inp} />
          <select name="statut" defaultValue="a_planifier" style={inp}>
            {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
          </select>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" name="renfort" /> Renfort (RE)
          </label>
          <button style={btnAdd}>+ Créer</button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chantiers.map((c) => (
          <form key={c.id} action={updateChantier} style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 12 }}>
            <input type="hidden" name="id" value={c.id} />
            <div style={grid}>
              <input name="client_nom" defaultValue={c.client_nom} style={{ ...inp, fontWeight: 600 }} />
              <input name="designation" defaultValue={c.designation ?? ""} placeholder="Désignation" style={inp} />
              <input name="ville" defaultValue={c.ville ?? ""} placeholder="Ville" style={inp} />
              <input name="adresse" defaultValue={c.adresse ?? ""} placeholder="Adresse" style={inp} />
              <input name="contact_tel" defaultValue={c.contact_tel ?? ""} placeholder="Tél." style={inp} />
              <select name="statut" defaultValue={c.statut} style={{ ...inp, color: "#fff", background: STATUT_COLOR[c.statut], border: 0 }}>
                {STATUTS.map((s) => <option key={s} value={s} style={{ color: "#000", background: "#fff" }}>{STATUT_LABEL[s]}</option>)}
              </select>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" name="renfort" defaultChecked={c.renfort} /> RE
              </label>
              <button style={btnSave}>Enregistrer</button>
            </div>
            <ConfirmButton formAction={deleteChantier} message={`Supprimer le chantier ${c.client_nom} ?`} style={{ ...btnDel, marginTop: 8 }}>Supprimer</ConfirmButton>
          </form>
        ))}
        {chantiers.length === 0 && <p style={{ color: "#6b7686" }}>Aucun chantier. Créez-en un ci-dessus.</p>}
      </div>
    </div>
  );
}

const grid: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const inp: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e7e9ee", borderRadius: 8, fontSize: 13 };
const btnAdd: React.CSSProperties = { border: 0, background: "#1f9d55", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSave: React.CSSProperties = { border: 0, background: "#39424e", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, cursor: "pointer" };
const btnDel: React.CSSProperties = { border: 0, background: "#fdecee", color: "#d0212f", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" };
