export const dynamic = "force-dynamic";
import { getMyProfil, getChantiers, getProfils } from "@/lib/queries";
import { estBureau, STATUT_LABEL, STATUT_COLOR, type StatutChantier } from "@/lib/types";
import { updateChantier, deleteChantier } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";
import ChantierCreateForm from "@/components/ChantierCreateForm";
import EquipeSelect from "@/components/EquipeSelect";
import { redirect } from "next/navigation";

const STATUTS: StatutChantier[] = ["a_planifier", "en_cours", "termine", "sav"];

export default async function ChantiersPage() {
  const moi = await getMyProfil();
  if (!estBureau(moi?.role)) redirect("/");

  const [chantiers, profils] = await Promise.all([getChantiers(), getProfils()]);
  const equipe = profils.filter((p) => p.role === "poseur" || p.role === "macon");

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={{ fontSize: 18 }}>Chantiers</h2>

      {/* ── Nouveau chantier ── */}
      <div style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 12 }}>Nouveau chantier</h3>
        <ChantierCreateForm equipe={equipe} />
      </div>

      {/* ── Liste des chantiers ── */}
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
            </div>

            {/* Équipe — membres sélectionnés + menu déroulant multi-choix */}
            {equipe.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7686", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Équipe
                </div>
                <EquipeSelect
                  equipe={equipe.map((p) => ({ id: p.id, nom: p.nom, couleur: p.couleur, metier: p.metier }))}
                  selected={c.equipe_ids ?? []}
                />
              </div>
            )}

            {/* Re-planification */}
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 12, color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
                📅 Ajouter / modifier des jours planifiés
              </summary>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", padding: "10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e7e9ee" }}>
                <label style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontWeight: 600, color: "#6b7686" }}>Du</span>
                  <input type="date" name="date_debut" style={inp} />
                </label>
                <label style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontWeight: 600, color: "#6b7686" }}>Au</span>
                  <input type="date" name="date_fin" style={inp} />
                </label>
                <label style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontWeight: 600, color: "#6b7686" }}>Créneau</span>
                  <select name="creneau_pose" defaultValue="journee" style={inp}>
                    <option value="journee">Journée</option>
                    <option value="matin">Matin</option>
                    <option value="apres_midi">Après-midi</option>
                  </select>
                </label>
                <label style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontWeight: 600, color: "#6b7686" }}>Heure</span>
                  <input type="time" name="heure_pose" style={inp} />
                </label>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, paddingBottom: 6 }}>
                  <input type="checkbox" name="ouvrables" value="true" defaultChecked /> Jours ouvrables
                </label>
              </div>
            </details>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={btnSave}>Enregistrer</button>
              <ConfirmButton formAction={deleteChantier} message={`Supprimer le chantier ${c.client_nom} ?`} style={btnDel}>Supprimer</ConfirmButton>
            </div>
          </form>
        ))}
        {chantiers.length === 0 && <p style={{ color: "#6b7686" }}>Aucun chantier. Créez-en un ci-dessus.</p>}
      </div>
    </div>
  );
}

const grid: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const inp: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e7e9ee", borderRadius: 8, fontSize: 13 };
const btnSave: React.CSSProperties = { border: 0, background: "#39424e", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, cursor: "pointer" };
const btnDel: React.CSSProperties = { border: 0, background: "#fdecee", color: "#d0212f", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" };
