"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addChantier, updateChantier, deleteChantier } from "@/app/(app)/chantiers/actions";
import { STATUT_LABEL, type StatutChantier } from "@/lib/types";

type Profil = { id: string; nom: string; couleur: string | null; metier: string | null };
type ChantierEdit = {
  id: string; client_nom: string; designation: string | null; ville: string | null;
  adresse: string | null; contact_tel: string | null; statut: StatutChantier;
  renfort: boolean; notes: string | null; equipe_ids: string[];
};

const STATUTS: StatutChantier[] = ["a_planifier", "en_cours", "termine", "sav"];

export default function ChantierModal({
  equipe, chantier, onClose,
}: {
  equipe: Profil[];
  chantier?: ChantierEdit | null;   // null/undefined = création
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const edit = !!chantier;

  const [selEquipe, setSelEquipe] = useState<Set<string>>(new Set(chantier?.equipe_ids ?? []));

  function toggle(id: string) {
    setSelEquipe((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    selEquipe.forEach((id) => fd.append("equipe_ids", id));
    if (edit) fd.append("id", chantier!.id);
    start(async () => {
      if (edit) await updateChantier(fd);
      else      await addChantier(fd);
      router.refresh();
      onClose();
    });
  }

  function handleDelete() {
    if (!chantier) return;
    if (!window.confirm(`Supprimer définitivement le chantier "${chantier.client_nom}" et toutes ses affectations ?`)) return;
    const fd = new FormData();
    fd.append("id", chantier.id);
    start(async () => {
      await deleteChantier(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: "#1e293b", padding: "16px 22px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {edit ? "Modifier le chantier" : "Nouveau chantier"}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2 }}>
              {edit ? chantier!.client_nom : "🏗️ Créer un chantier"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: 0, color: "#94a3b8", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "18px 22px", opacity: pending ? 0.6 : 1, maxHeight: "75vh", overflowY: "auto" }}>

          {/* Infos */}
          <div style={grid}>
            <Field label="Client *" flex={2}>
              <input name="client_nom" required defaultValue={chantier?.client_nom ?? ""} placeholder="Nom du client" style={inp} />
            </Field>
            <Field label="Désignation" flex={2}>
              <input name="designation" defaultValue={chantier?.designation ?? ""} placeholder="1F 2vtx…" style={inp} />
            </Field>
            <Field label="Ville" flex={1}>
              <input name="ville" defaultValue={chantier?.ville ?? ""} placeholder="Toulon…" style={inp} />
            </Field>
            <Field label="Adresse" flex={2}>
              <input name="adresse" defaultValue={chantier?.adresse ?? ""} placeholder="Rue + n°" style={inp} />
            </Field>
            <Field label="Tél. contact" flex={1}>
              <input name="contact_tel" defaultValue={chantier?.contact_tel ?? ""} placeholder="06 …" style={inp} />
            </Field>
            <Field label="Statut" flex={1}>
              <select name="statut" defaultValue={chantier?.statut ?? "a_planifier"} style={inp}>
                {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
              </select>
            </Field>
          </div>

          {/* Équipe */}
          <div style={{ marginTop: 16 }}>
            <div style={secLbl}>👷 Équipe affectée</div>
            {equipe.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Aucun membre terrain.</p>
            ) : (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {equipe.map((p) => {
                  const sel = selEquipe.has(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggle(p.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                              border: sel ? `2px solid ${p.couleur ?? "#2563eb"}` : "2px solid #e2e8f0",
                              borderRadius: 20, background: sel ? (p.couleur ?? "#2563eb") + "18" : "#f8fafc",
                              cursor: "pointer", fontSize: 12.5, fontWeight: sel ? 700 : 400,
                              color: sel ? (p.couleur ?? "#1d4ed8") : "#475569",
                            }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.couleur ?? "#6b7686", flexShrink: 0 }} />
                      {p.nom}
                      {p.metier && <span style={{ fontSize: 10.5, opacity: 0.6 }}>· {p.metier}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Planification */}
          <div style={{ marginTop: 16 }}>
            <div style={secLbl}>
              📅 Planification
              {edit && <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}> · laissez vide pour ne pas modifier</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <Field label="Du"><input type="date" name="date_debut" style={inp} /></Field>
                <div style={{ paddingBottom: 8, fontSize: 18, color: "#94a3b8" }}>→</div>
                <Field label="Au (inclus)"><input type="date" name="date_fin" style={inp} /></Field>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, paddingBottom: 8, whiteSpace: "nowrap" }}>
                  <input type="checkbox" name="ouvrables" value="true" defaultChecked /> Jours ouvrables
                </label>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 8 }}>
                <Field label="Heure départ"><input type="time" name="heure_pose" style={inp} /></Field>
                <Field label="Créneau">
                  <select name="creneau_pose" defaultValue="journee" style={inp}>
                    <option value="journee">Journée</option>
                    <option value="matin">Matin</option>
                    <option value="apres_midi">Après-midi</option>
                  </select>
                </Field>
                <Field label="Lieu de pose" flex={2}><input name="lieu_pose" placeholder="Adresse…" style={inp} /></Field>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 16 }}>
            <Field label="Notes"><textarea name="notes" defaultValue={chantier?.notes ?? ""} rows={2} placeholder="Remarques…" style={{ ...inp, resize: "vertical" }} /></Field>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", marginTop: 18, gap: 8 }}>
            {edit && (
              <button type="button" onClick={handleDelete} style={{ padding: "9px 14px", border: "1px solid #fecaca", borderRadius: 10, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                🗑 Supprimer
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onClose} style={btnCancel}>Annuler</button>
            <button type="submit" disabled={pending} style={btnOk}>
              {pending ? "…" : edit ? "Enregistrer" : "+ Créer le chantier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: number }) {
  return (
    <div style={{ flex: flex ?? 1, minWidth: 120 }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6b7686", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const grid: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" };
const inp: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: "100%", boxSizing: "border-box", background: "#fff" };
const secLbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)", padding: 16 };
const card: React.CSSProperties = { background: "#fff", borderRadius: 16, width: 620, maxWidth: "97vw", boxShadow: "0 25px 60px rgba(0,0,0,.3)", overflow: "hidden" };
const btnCancel: React.CSSProperties = { padding: "9px 16px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b" };
const btnOk: React.CSSProperties = { padding: "9px 22px", border: 0, borderRadius: 10, background: "#1f9d55", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 };
