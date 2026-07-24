"use client";

import { useState } from "react";
import ChantierModal from "@/components/ChantierModal";
import { STATUT_COLOR, STATUT_LABEL, type StatutChantier } from "@/lib/types";

type P   = { id: string; nom: string; couleur: string | null; metier: string | null };
type C   = {
  id: string; client_nom: string; ville: string | null; adresse: string | null;
  designation: string | null; contact_tel: string | null; statut: StatutChantier;
  renfort: boolean; notes: string | null; equipe_ids: string[];
};
type A   = { id: string; profil_id: string; date: string; chantier_id: string; heure: string | null; creneau: string | null };
type Day = { iso: string; label: string; ddmm: string; weekend: boolean };

const TODAY = new Date().toISOString().slice(0, 10);
const JOUR3 = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function PlanningChantiers(props: {
  days: Day[];
  chantiers: C[];
  affectations: A[];
  equipe: P[];
  editable: boolean;
}) {
  const { days, chantiers, affectations, equipe, editable } = props;
  const [modal, setModal] = useState<null | "new" | C>(null);

  const profilById = new Map(equipe.map((p) => [p.id, p]));
  const dayLabelByIso = new Map(days.map((d) => [d.iso, d]));

  // chantier_id → (profil_id → Set<iso>)
  const idx = new Map<string, Map<string, Set<string>>>();
  const heureByCP    = new Map<string, string>(); // chantier|profil → heure
  const creneauByCP  = new Map<string, string>(); // chantier|profil → creneau
  for (const a of affectations) {
    if (!idx.has(a.chantier_id)) idx.set(a.chantier_id, new Map());
    const pm = idx.get(a.chantier_id)!;
    if (!pm.has(a.profil_id)) pm.set(a.profil_id, new Set());
    pm.get(a.profil_id)!.add(a.date);
    if (a.heure)    heureByCP.set(a.chantier_id + "|" + a.profil_id, a.heure.slice(0, 5));
    if (a.creneau)  creneauByCP.set(a.chantier_id + "|" + a.profil_id, a.creneau);
  }

  const CRENEAU_LABEL: Record<string, { label: string; bg: string; color: string; border: string }> = {
    matin:      { label: "Matin",      bg: "#fefce8", color: "#854d0e", border: "#fde047" },
    apres_midi: { label: "Après-midi", bg: "#fff7ed", color: "#9a3412", border: "#fb923c" },
    journee:    { label: "Journée",    bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  };

  const actifs   = chantiers.filter((c) => idx.has(c.id));
  const inactifs = chantiers.filter((c) => !idx.has(c.id));

  function renderCard(c: C, muted: boolean) {
    const pm = idx.get(c.id);
    const membres = pm ? [...pm.keys()] : [];
    return (
      <div key={c.id} style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderLeft: `5px solid ${STATUT_COLOR[c.statut]}`,
        borderRadius: 12, padding: "14px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        opacity: muted ? 0.7 : 1,
      }}>
        {/* En-tête */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{c.client_nom}</span>
              <span style={{ fontSize: 10.5, background: STATUT_COLOR[c.statut] + "22", color: STATUT_COLOR[c.statut], padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>
                {STATUT_LABEL[c.statut]}
              </span>
              {c.renfort && <span style={{ fontSize: 10.5, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>RENFORT</span>}
            </div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>
              {c.designation && <span>{c.designation}</span>}
              {c.designation && c.ville && <span> · </span>}
              {c.ville && <span>📍 {c.ville}</span>}
            </div>
          </div>
          {editable && (
            <button onClick={() => setModal(c)} title="Modifier" className="card-edit-btn"
                    style={{ border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 13, color: "#475569", flexShrink: 0 }}>
              ✏️
            </button>
          )}
        </div>

        {/* Équipe */}
        <div style={{ marginTop: 12 }}>
          {membres.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#cbd5e1", fontStyle: "italic" }}>Aucune affectation cette semaine</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {membres.map((pid) => {
                const p = profilById.get(pid);
                if (!p) return null;
                const isos    = [...(pm!.get(pid) ?? [])].sort();
                const heure   = heureByCP.get(c.id + "|" + pid);
                const creneau = creneauByCP.get(c.id + "|" + pid);
                const crInfo  = creneau ? CRENEAU_LABEL[creneau] : null;
                return (
                  <div key={pid} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: p.couleur ?? "#6b7686",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 1,
                    }}>
                      {p.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nom + métier */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                        {p.nom}
                        {p.metier && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}> · {p.metier}</span>}
                      </div>
                      {/* Jours avec date complète + heure */}
                      <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                        {isos.map((iso) => {
                          const d = dayLabelByIso.get(iso);
                          const dt = new Date(iso + "T00:00:00");
                          const dow = dt.getDay();
                          const jourLabel = d ? d.label : JOUR3[dow];
                          const jour = iso.slice(8, 10);
                          const mois = iso.slice(5, 7);
                          const isToday = iso === TODAY;
                          return (
                            <span key={iso} style={{
                              fontSize: 10.5, padding: "2px 7px", borderRadius: 5, fontWeight: 700,
                              background: isToday ? "#fbbf24" : "#eff6ff",
                              color: isToday ? "#78350f" : "#1d4ed8",
                              border: isToday ? "1px solid #f59e0b" : "1px solid #bfdbfe",
                              letterSpacing: 0.2,
                            }}>
                              {jourLabel} {jour}/{mois}
                            </span>
                          );
                        })}
                        {crInfo && (
                          <span style={{
                            fontSize: 10.5, padding: "2px 8px", borderRadius: 5, fontWeight: 700,
                            background: crInfo.bg, color: crInfo.color,
                            border: `1px solid ${crInfo.border}`,
                          }}>
                            {crInfo.label}
                          </span>
                        )}
                        {heure && (
                          <span style={{
                            fontSize: 10.5, padding: "2px 8px", borderRadius: 5, fontWeight: 700,
                            background: "#eff6ff", color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                          }}>
                            🕐 {heure}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Barre d'action */}
      {editable && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setModal("new")}
                  style={{ border: 0, background: "#1f9d55", color: "#fff", borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + Ajouter un chantier
          </button>
        </div>
      )}

      {/* Chantiers actifs */}
      {actifs.length === 0 && inactifs.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12, padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
          Aucun chantier. Cliquez sur <strong>+ Ajouter un chantier</strong> pour commencer.
        </div>
      ) : (
        <div className="chantier-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {actifs.map((c) => renderCard(c, false))}
        </div>
      )}

      {/* Chantiers non planifiés */}
      {inactifs.length > 0 && (
        <>
          <div style={{ margin: "20px 0 10px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            📭 Non planifiés cette semaine ({inactifs.length})
          </div>
          <div className="chantier-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {inactifs.map((c) => renderCard(c, true))}
          </div>
        </>
      )}

      {/* Modal création / édition */}
      {modal && (
        <ChantierModal
          equipe={equipe}
          chantier={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
