export const dynamic = "force-dynamic";
import { getMyProfil, getProfils } from "@/lib/queries";
import { estBureau, ACCES_OPTIONS, ROLE_LABEL, type Role } from "@/lib/types";
import MetierSelect from "@/components/MetierSelect";
import { addProfil, updateProfil, deleteProfil } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";
import { redirect } from "next/navigation";

export default async function PersonnelPage() {
  const moi = await getMyProfil();
  if (!estBureau(moi?.role)) redirect("/");

  const profils = await getProfils();

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 18 }}>Gérer le personnel</h2>
      <p style={{ color: "#6b7686", fontSize: 13, marginTop: -6 }}>
        Chaque personne a un <strong>métier</strong> (intitulé) et un <strong>niveau d'accès</strong> (ce qu'elle peut faire dans l'app).
      </p>

      {/* ── Ajouter ── */}
      <div style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 12 }}>Ajouter une personne</h3>
        <form action={addProfil}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>

            {/* Nom */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={lbl}>Nom <span style={lblReq}>*</span></label>
              <div style={hint}>Prénom et nom de famille</div>
              <input
                name="nom" required
                placeholder="Ex : Jean Dupont"
                title="Prénom et nom de la personne"
                style={inp}
              />
            </div>

            {/* Métier */}
            <div style={{ width: 180 }}>
              <label style={lbl}>Métier (poste)</label>
              <div style={hint}>Intitulé du poste dans l'entreprise</div>
              <MetierSelect defaultValue="Poseur" required />
            </div>

            {/* Accès / Rôle */}
            <div style={{ width: 170 }}>
              <label style={lbl}>Accès (rôle)</label>
              <div style={hint}>Ce que cette personne peut faire dans l'app</div>
              <select
                name="role" defaultValue="poseur"
                title="Niveau d'accès : Administration = tout gérer, Lecture = consulter seulement"
                style={{ ...inp, background: "#f8f9fd" }}
              >
                {ACCES_OPTIONS.map((a) => (
                  <option key={a.role} value={a.role}>{a.label} — {a.description}</option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div style={{ width: 180 }}>
              <label style={lbl}>Email</label>
              <div style={hint}>Pour la connexion à l'app (bureau uniquement)</div>
              <input
                name="email"
                type="email"
                placeholder="prenom@d2b.fr"
                title="Email de connexion — uniquement pour Direction, Secrétariat, Commercial, Comptabilité"
                style={inp}
              />
            </div>

            {/* Téléphone */}
            <div style={{ width: 145 }}>
              <label style={lbl}>Téléphone</label>
              <div style={hint}>Mobile pour SMS planning</div>
              <input
                name="telephone"
                placeholder="06 12 34 56 78"
                title="Numéro de téléphone mobile"
                style={inp}
              />
            </div>

            <button style={{ ...btnAdd, marginBottom: 1 }}>+ Ajouter</button>
          </div>
        </form>
      </div>

      {/* ── Liste ── */}
      <div style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, overflow: "hidden" }}>

        {/* En-tête */}
        <div style={{ display: "grid", gridTemplateColumns: "14px 1fr 140px 140px 170px 130px 80px 36px", gap: 8, padding: "8px 12px", background: "#f4f5f7", fontSize: 11, fontWeight: 700, color: "#6b7686", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span />
          <div>
            <div>Nom</div>
            <div style={{ fontWeight: 400, fontSize: 10, textTransform: "none", letterSpacing: 0, color: "#9aa3ad" }}>Prénom + nom</div>
          </div>
          <div>
            <div>Métier</div>
            <div style={{ fontWeight: 400, fontSize: 10, textTransform: "none", letterSpacing: 0, color: "#9aa3ad" }}>Poste</div>
          </div>
          <div>
            <div>Accès</div>
            <div style={{ fontWeight: 400, fontSize: 10, textTransform: "none", letterSpacing: 0, color: "#9aa3ad" }}>Ce qu'il/elle peut faire</div>
          </div>
          <div>
            <div>Email</div>
            <div style={{ fontWeight: 400, fontSize: 10, textTransform: "none", letterSpacing: 0, color: "#9aa3ad" }}>Connexion app</div>
          </div>
          <div>
            <div>Téléphone</div>
            <div style={{ fontWeight: 400, fontSize: 10, textTransform: "none", letterSpacing: 0, color: "#9aa3ad" }}>Mobile SMS</div>
          </div>
          <span />
          <span />
        </div>

        {profils.map((p) => {
          const estMoi = p.id === moi?.id;
          const estAdmin = p.role === "direction";
          const accesActuel = ACCES_OPTIONS.find(a => a.role === p.role);

          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "14px 1fr 140px 140px 170px 130px 80px 36px", gap: 8, alignItems: "center", padding: "8px 12px", borderTop: "1px solid #f4f5f7", background: estMoi ? "#f8f9fd" : undefined }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: p.couleur ?? "#6b7686", display: "block" }} />

              <form action={updateProfil} style={{ display: "contents" }}>
                <input type="hidden" name="id" value={p.id} />

                {/* Nom */}
                <input name="nom" defaultValue={p.nom} placeholder="Prénom Nom" title="Prénom et nom de la personne" style={inp} />

                {/* Métier */}
                <MetierSelect defaultValue={p.metier} />

                {/* Accès */}
                {estMoi ? (
                  <>
                    <input type="hidden" name="role" value={p.role} />
                    <span style={{ ...inp, background: "#f4f5f7", color: "#6b7686", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }} title="Vous ne pouvez pas modifier votre propre niveau d'accès">
                      {accesActuel?.label ?? ROLE_LABEL[p.role as Role]} 🔒
                    </span>
                  </>
                ) : (
                  <select name="role" defaultValue={p.role} title="Niveau d'accès : Administration = gestion totale, Modifier = planning + RDV, Créer = ses propres RDV, Lecture = consultation" style={{ ...inp, background: accesColor(p.role) }}>
                    {ACCES_OPTIONS.map((a) => (
                      <option key={a.role} value={a.role}>{a.label}</option>
                    ))}
                  </select>
                )}

                {/* Email */}
                {(p.role === "poseur" || p.role === "macon") ? (
                  <>
                    <input type="hidden" name="email" value="" />
                    <span style={{ ...inp, color: "#9aa3ad", fontSize: 12 }}>—</span>
                  </>
                ) : (
                  <input
                    name="email"
                    type="email"
                    defaultValue={p.email ?? ""}
                    placeholder="email@d2b.fr"
                    title="Email de connexion à l'application"
                    style={{ ...inp, ...(p.email ? {} : { borderColor: "#b9770e", background: "#fff8e6" }) }}
                  />
                )}

                {/* Téléphone */}
                <input
                  name="telephone"
                  defaultValue={p.telephone ?? ""}
                  placeholder="n° tél"
                  style={{ ...inp, ...(p.telephone ? {} : { borderColor: "#b9770e", background: "#fff8e6" }) }}
                />

                <button style={btnSave}>Enregistrer</button>
              </form>

              {/* Supprimer */}
              <form action={deleteProfil}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton
                  message={estMoi ? "Impossible de vous supprimer vous-même." : estAdmin ? `⚠️ ${p.nom} est administrateur. Retirer quand même ?` : `Retirer ${p.nom} du personnel ?`}
                  title="Retirer"
                  style={btnDel}
                  disabled={estMoi}
                >✕</ConfirmButton>
              </form>
            </div>
          );
        })}

        {profils.length === 0 && <p style={{ color: "#6b7686", padding: 16 }}>Aucune personne enregistrée.</p>}
      </div>

      {/* Légende accès */}
      <div style={{ marginTop: 16, padding: 12, background: "#f8f9fd", borderRadius: 10, border: "1px solid #e7e9ee" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7686", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Niveaux d'accès</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {ACCES_OPTIONS.map((a) => (
            <div key={a.role} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ background: accesColor(a.role), padding: "2px 8px", borderRadius: 6, fontWeight: 600, color: accesTextColor(a.role), fontSize: 11 }}>{a.label}</span>
              <span style={{ color: "#6b7686" }}>{a.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function accesColor(role: string) {
  switch (role) {
    case "direction":   return "#fde8e8";
    case "secretariat": return "#e8f4fd";
    case "commercial":  return "#e8fdf0";
    default:            return "#f4f5f7";
  }
}
function accesTextColor(role: string) {
  switch (role) {
    case "direction":   return "#991b1b";
    case "secretariat": return "#1e40af";
    case "commercial":  return "#166534";
    default:            return "#4b5563";
  }
}

const inp: React.CSSProperties = { padding: "7px 10px", border: "1px solid #e7e9ee", borderRadius: 8, fontSize: 13, width: "100%", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#39424e", marginBottom: 2 };
const hint: React.CSSProperties = { fontSize: 11, color: "#9aa3ad", marginBottom: 4 };
const lblReq: React.CSSProperties = { color: "#d0212f" };
const btnAdd: React.CSSProperties = { border: 0, background: "#1f9d55", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
const btnSave: React.CSSProperties = { border: 0, background: "#39424e", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" };
const btnDel: React.CSSProperties = { width: 30, height: 30, border: 0, background: "#fdecee", color: "#d0212f", borderRadius: 8, cursor: "pointer", fontSize: 14 };
