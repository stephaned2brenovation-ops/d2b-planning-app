"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addChantier } from "@/app/(app)/chantiers/actions";
import type { StatutChantier } from "@/lib/types";
import { STATUT_LABEL } from "@/lib/types";

type Profil = { id: string; nom: string; couleur: string | null };
type Creneau = "journee" | "matin" | "apres_midi";

const STATUTS: StatutChantier[] = ["a_planifier", "en_cours", "termine", "sav"];

export default function ChantierCreateForm({ equipe }: { equipe: Profil[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();
  const [pending, start] = useTransition();

  // Modal calendrier
  const [modal, setModal] = useState(false);
  const [datePose,    setDatePose]    = useState("");
  const [heurePose,   setHeurePose]   = useState("");
  const [lieuPose,    setLieuPose]    = useState("");
  const [creneauPose, setCreneauPose] = useState<Creneau>("journee");
  const [poseOk,      setPoseOk]      = useState(false);

  function ouvrirModal() {
    if (!datePose) {
      const today = new Date();
      setDatePose(today.toISOString().slice(0, 10));
    }
    setModal(true);
  }

  function validerModal(e: React.FormEvent) {
    e.preventDefault();
    if (!datePose) return;
    setPoseOk(true);
    setModal(false);
  }

  function annulerModal() {
    setModal(false);
  }

  function effacerPose() {
    setDatePose(""); setHeurePose(""); setLieuPose(""); setCreneauPose("journee"); setPoseOk(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => {
      await addChantier(formData);
      formRef.current?.reset();
      effacerPose();
      router.refresh();
    });
  }

  return (
    <>
      {/* ── Modal calendrier ── */}
      {modal && (
        <div style={overlay} onClick={annulerModal}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={modalHdr}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Planifier la première pose</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>📅 Date & heure d&apos;intervention</div>
            </div>
            <form onSubmit={validerModal} style={{ padding: "18px 20px 16px" }}>
              <label style={lbl}>Date <span style={{ color: "#d0212f" }}>*</span></label>
              <input type="date" required value={datePose} onChange={(e) => setDatePose(e.target.value)}
                     style={{ ...inp, marginBottom: 12 }} />

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure de départ</label>
                  <input type="time" value={heurePose} onChange={(e) => setHeurePose(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Créneau</label>
                  <select value={creneauPose} onChange={(e) => setCreneauPose(e.target.value as Creneau)} style={inp}>
                    <option value="journee">Journée entière</option>
                    <option value="matin">Matin</option>
                    <option value="apres_midi">Après-midi</option>
                  </select>
                </div>
              </div>

              <label style={lbl}>Lieu / Adresse</label>
              <input value={lieuPose} onChange={(e) => setLieuPose(e.target.value)}
                     placeholder="Adresse du chantier…" style={{ ...inp, marginBottom: 14 }} />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={annulerModal} style={btnCancel}>Annuler</button>
                <button type="submit" style={btnOk}>Confirmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Formulaire chantier ── */}
      <form ref={formRef} onSubmit={handleSubmit} style={{ opacity: pending ? 0.6 : 1 }}>
        {/* Champs cachés pose */}
        <input type="hidden" name="date_pose"    value={datePose} />
        <input type="hidden" name="heure_pose"   value={heurePose} />
        <input type="hidden" name="lieu_pose"    value={lieuPose} />
        <input type="hidden" name="creneau_pose" value={creneauPose} />

        <div style={grid}>
          <input name="client_nom" placeholder="Client *" required style={inp2} />
          <input name="designation" placeholder="Désignation (ex : 1F 2vtx)" style={inp2} />
          <input name="ville" placeholder="Ville" style={inp2} />
          <input name="adresse" placeholder="Adresse (itinéraire)" style={inp2} />
          <input name="contact_tel" placeholder="Tél. contact" style={inp2} />
          <select name="statut" defaultValue="a_planifier" style={inp2}>
            {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
          </select>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" name="renfort" /> Renfort (RE)
          </label>
        </div>

        {/* Équipe */}
        {equipe.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7686", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Équipe (poseurs / maçons)
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {equipe.map((p) => (
                <label key={p.id} style={checkLbl}>
                  <input type="checkbox" name="equipe_ids" value={p.id} />
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5, background: p.couleur ?? "#6b7686", marginRight: 4 }} />
                  {p.nom}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Planifier la pose */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          {poseOk ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eef4ff", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
              <span>📅</span>
              <span style={{ fontWeight: 600, color: "#2e77c9" }}>
                {new Date(datePose + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                {heurePose ? ` à ${heurePose}` : ""}
                {lieuPose ? ` — ${lieuPose}` : ""}
              </span>
              <button type="button" onClick={effacerPose} style={{ border: 0, background: "none", color: "#d0212f", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
              <button type="button" onClick={ouvrirModal} style={{ border: "1px solid #2e77c9", background: "#fff", color: "#2e77c9", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>Modifier</button>
            </div>
          ) : (
            <button type="button" onClick={ouvrirModal} style={btnPlanifier}>
              📅 Planifier la première pose
            </button>
          )}
          <button type="submit" disabled={pending} style={btnAdd}>
            {pending ? "Création…" : "+ Créer le chantier"}
          </button>
        </div>
      </form>
    </>
  );
}

const grid: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const inp: React.CSSProperties  = { width: "100%", padding: "9px 11px", border: "1px solid #e7e9ee", borderRadius: 9, fontSize: 13, boxSizing: "border-box" };
const inp2: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e7e9ee", borderRadius: 8, fontSize: 13 };
const checkLbl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, fontSize: 13, padding: "5px 10px", border: "1px solid #e7e9ee", borderRadius: 8, cursor: "pointer", background: "#fafbfc" };
const lbl: React.CSSProperties  = { display: "block", fontSize: 12, fontWeight: 600, color: "#39424e", marginBottom: 4 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(20,30,50,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
const card: React.CSSProperties    = { background: "#fff", borderRadius: 16, width: 400, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" };
const modalHdr: React.CSSProperties = { padding: "16px 20px", background: "#39424e", color: "#fff" };
const btnCancel: React.CSSProperties = { padding: "9px 16px", border: "1px solid #e7e9ee", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 13, color: "#6b7686" };
const btnOk: React.CSSProperties    = { padding: "9px 20px", border: 0, borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, background: "#39424e" };
const btnAdd: React.CSSProperties   = { border: 0, background: "#1f9d55", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnPlanifier: React.CSSProperties = { border: "1px dashed #2e77c9", background: "#f0f6ff", color: "#2e77c9", borderRadius: 8, padding: "7px 13px", fontSize: 13, cursor: "pointer", fontWeight: 600 };

