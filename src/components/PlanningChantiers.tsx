"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { assignEquipeChantier, removeAffectation } from "@/app/(app)/planning-actions";
import { STATUT_COLOR, STATUT_LABEL, type StatutChantier } from "@/lib/types";

type P   = { id: string; nom: string; couleur: string | null; metier: string | null };
type C   = { id: string; client_nom: string; ville: string | null; designation: string | null; statut: StatutChantier; equipe_ids: string[] };
type A   = { id: string; profil_id: string; date: string; chantier_id: string; heure: string | null; lieu: string | null };
type Day = { iso: string; label: string; ddmm: string; weekend: boolean };

const TODAY = new Date().toISOString().slice(0, 10);

type AddModal = {
  chantierId: string;
  chantierNom: string;
  iso: string;
  dayLabel: string;
  existingPids: string[];
  lieu: string;
};

export default function PlanningChantiers(props: {
  days: Day[];
  chantiers: C[];
  affectations: A[];
  equipe: P[];   // tous les membres terrain
  editable: boolean;
}) {
  const { days, chantiers, affectations, equipe, editable } = props;
  const router = useRouter();
  const [pending, start] = useTransition();

  const [modal, setModal] = useState<AddModal | null>(null);
  const [selPids, setSelPids]   = useState<string[]>([]);
  const [modalHeure, setModalHeure] = useState("");
  const [modalLieu, setModalLieu]   = useState("");
  const [modalCreneau, setModalCreneau] = useState<"journee"|"matin"|"apres_midi">("journee");

  function run(fn: () => Promise<unknown>) {
    start(async () => { await fn(); router.refresh(); });
  }

  // Index : chantier_id → date → Affectation[]
  const idx = new Map<string, Map<string, A[]>>();
  for (const a of affectations) {
    if (!idx.has(a.chantier_id)) idx.set(a.chantier_id, new Map());
    const dm = idx.get(a.chantier_id)!;
    if (!dm.has(a.date)) dm.set(a.date, []);
    dm.get(a.date)!.push(a);
  }

  // Lookup profil
  const profilById = new Map(equipe.map((p) => [p.id, p]));

  // Chantiers actifs cette semaine (au moins 1 affectation)
  const actifs   = chantiers.filter((c) => idx.has(c.id));
  const inactifs = chantiers.filter((c) => !idx.has(c.id));

  function openModal(c: C, d: Day) {
    const dayAffs = idx.get(c.id)?.get(d.iso) ?? [];
    const lieu = dayAffs[0]?.lieu ?? c.ville ?? "";
    setSelPids(dayAffs.map((a) => a.profil_id));
    setModalHeure(dayAffs[0]?.heure?.slice(0,5) ?? "");
    setModalLieu(lieu);
    setModalCreneau("journee");
    setModal({ chantierId: c.id, chantierNom: c.client_nom, iso: d.iso, dayLabel: `${d.label} ${d.ddmm}`, existingPids: dayAffs.map(a => a.profil_id), lieu });
  }

  function submitModal() {
    if (!modal) return;
    const ajouter = selPids.filter((id) => !modal.existingPids.includes(id));
    const supprimer = affectations.filter(
      (a) => a.chantier_id === modal.chantierId && a.date === modal.iso && !selPids.includes(a.profil_id)
    );
    start(async () => {
      if (ajouter.length) {
        await assignEquipeChantier(modal.chantierId, ajouter, modal.iso, modalCreneau, modalHeure || null, modalLieu || null);
      }
      for (const a of supprimer) await removeAffectation(a.id);
      router.refresh();
    });
    setModal(null);
  }

  return (
    <div style={{ opacity: pending ? 0.65 : 1, transition: "opacity .2s" }}>

      {/* ── Modal ajout équipe ── */}
      {modal && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: "#1e293b", padding: "16px 20px", color: "#fff" }}>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>Équipe sur ce chantier</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2 }}>{modal.chantierNom}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{modal.dayLabel}</div>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Membres présents</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                {equipe.map((p) => {
                  const sel = selPids.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => setSelPids((prev) => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "5px 12px", border: sel ? `2px solid ${p.couleur ?? "#2563eb"}` : "2px solid #e2e8f0",
                              borderRadius: 20, background: sel ? (p.couleur ?? "#2563eb") + "18" : "#f8fafc",
                              cursor: "pointer", fontSize: 12.5, fontWeight: sel ? 700 : 400,
                              color: sel ? (p.couleur ?? "#1d4ed8") : "#475569",
                            }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.couleur ?? "#6b7686", flexShrink: 0 }} />
                      {p.nom}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure de départ</label>
                  <input type="time" value={modalHeure} onChange={(e) => setModalHeure(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Créneau</label>
                  <select value={modalCreneau} onChange={(e) => setModalCreneau(e.target.value as "journee"|"matin"|"apres_midi")} style={inp}>
                    <option value="journee">Journée entière</option>
                    <option value="matin">Matin</option>
                    <option value="apres_midi">Après-midi</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Lieu / Adresse</label>
                <input value={modalLieu} onChange={(e) => setModalLieu(e.target.value)} placeholder="Adresse du chantier…" style={inp} />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(null)} style={btnCancel}>Annuler</button>
                <button type="button" onClick={submitModal} style={btnOk}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tableau chantiers ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflowX: "auto", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", paddingLeft: 14, width: 220, background: "#1e293b" }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "#94a3b8", textTransform: "uppercase" }}>Chantier</span>
              </th>
              {days.map((d) => {
                const isToday = d.iso === TODAY;
                return (
                  <th key={d.iso} style={{
                    ...th,
                    background: isToday ? "#1d4ed8" : d.weekend ? "#2d3f52" : "#334155",
                    borderBottom: isToday ? "3px solid #fbbf24" : undefined,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{d.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>{d.ddmm}</div>
                    {isToday && <div style={{ fontSize: 9, background: "#fbbf24", color: "#78350f", borderRadius: 4, padding: "1px 4px", display: "inline-block", marginTop: 2, fontWeight: 700 }}>AUJOURD&apos;HUI</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>

            {/* ── Chantiers actifs cette semaine ── */}
            {actifs.length === 0 && inactifs.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  Aucun chantier — créez-en dans l&apos;onglet <strong>Chantiers</strong>.
                </td>
              </tr>
            )}

            {actifs.map((c) => (
              <tr key={c.id}>
                {/* Info chantier */}
                <td style={{ ...tdLeft, borderLeft: `4px solid ${STATUT_COLOR[c.statut]}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUT_COLOR[c.statut], flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", lineHeight: 1.2 }}>{c.client_nom}</span>
                  </div>
                  {c.designation && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, marginLeft: 14 }}>{c.designation}</div>}
                  {c.ville       && <div style={{ fontSize: 11, color: "#94a3b8", marginLeft: 14 }}>📍 {c.ville}</div>}
                  <div style={{ marginTop: 4, marginLeft: 14 }}>
                    <span style={{ fontSize: 10, background: STATUT_COLOR[c.statut] + "22", color: STATUT_COLOR[c.statut], padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                      {STATUT_LABEL[c.statut]}
                    </span>
                  </div>
                </td>

                {/* Jours */}
                {days.map((d) => {
                  const dayAffs = idx.get(c.id)?.get(d.iso) ?? [];
                  const isToday = d.iso === TODAY;
                  return (
                    <td key={d.iso} style={{
                      ...tdDay,
                      background: dayAffs.length > 0
                        ? isToday ? "#fffde7" : "#f0fdf4"
                        : isToday ? "#fffde7"
                        : d.weekend ? "#f8f9fb" : "#fff",
                      borderTop: isToday ? "2px solid #fbbf24" : undefined,
                    }}>
                      {/* Membres assignés */}
                      {dayAffs.map((a) => {
                        const p = profilById.get(a.profil_id);
                        if (!p) return null;
                        return (
                          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: p.couleur ?? "#6b7686",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9.5, fontWeight: 700, color: "#fff", flexShrink: 0,
                            }}>
                              {p.nom.slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nom}</div>
                              {a.heure && <div style={{ fontSize: 10, color: "#64748b" }}>{a.heure.slice(0,5)}</div>}
                            </div>
                            {editable && (
                              <span
                                onClick={() => window.confirm(`Retirer ${p.nom} de ce chantier ?`) && run(() => removeAffectation(a.id))}
                                style={{ color: "#d0212f", cursor: "pointer", fontSize: 12, opacity: 0.5, flexShrink: 0, lineHeight: 1 }}
                              >✕</span>
                            )}
                          </div>
                        );
                      })}

                      {/* Bouton ajouter */}
                      {editable && (
                        <button
                          type="button"
                          onClick={() => openModal(c, d)}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            fontSize: 11, padding: "2px 0", border: 0, background: "none",
                            cursor: "pointer", color: "#94a3b8",
                          }}
                        >
                          {dayAffs.length > 0 ? "✏️ Modifier" : "+ Ajouter"}
                        </button>
                      )}

                      {dayAffs.length === 0 && !editable && (
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* ── Séparateur chantiers non planifiés ── */}
            {inactifs.length > 0 && (
              <>
                <tr>
                  <td colSpan={8} style={{
                    background: "#f8f9fb", borderTop: "2px solid #f1f5f9",
                    padding: "6px 14px", fontSize: 11, fontWeight: 700,
                    color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5,
                  }}>
                    📭 Non planifiés cette semaine ({inactifs.length})
                  </td>
                </tr>
                {inactifs.map((c) => (
                  <tr key={c.id} style={{ opacity: 0.6 }}>
                    <td style={{ ...tdLeft, borderLeft: `4px solid ${STATUT_COLOR[c.statut]}40` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUT_COLOR[c.statut] + "60", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#64748b" }}>{c.client_nom}</span>
                      </div>
                      {c.designation && <div style={{ fontSize: 11, color: "#94a3b8", marginLeft: 14 }}>{c.designation}</div>}
                      {c.ville       && <div style={{ fontSize: 11, color: "#94a3b8", marginLeft: 14 }}>📍 {c.ville}</div>}
                    </td>
                    {days.map((d) => (
                      <td key={d.iso} style={{ ...tdDay, background: d.weekend ? "#f8f9fb" : "#fafbfc" }}>
                        {editable && (
                          <button type="button" onClick={() => openModal(c, d)}
                                  style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, padding: "2px 0", border: 0, background: "none", cursor: "pointer", color: "#cbd5e1" }}>
                            + Ajouter
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
        {Object.entries(STATUT_LABEL).map(([k, v]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUT_COLOR[k as StatutChantier], display: "inline-block" }} />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Styles ── */
const th: React.CSSProperties = {
  color: "#fff", fontWeight: 600, fontSize: 12.5,
  padding: "10px 8px", textAlign: "center",
  border: "1px solid rgba(255,255,255,.08)",
};
const tdLeft: React.CSSProperties = {
  border: "1px solid #f1f5f9", padding: "8px 10px",
  verticalAlign: "top", background: "#fafbfc", minWidth: 180,
};
const tdDay: React.CSSProperties = {
  border: "1px solid #f1f5f9", padding: "6px 7px",
  verticalAlign: "top", minHeight: 40, minWidth: 80,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3,
};
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,.5)",
  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(2px)",
};
const modalCard: React.CSSProperties = {
  background: "#fff", borderRadius: 16, width: 460, maxWidth: "95vw",
  boxShadow: "0 25px 60px rgba(0,0,0,.3)", overflow: "hidden",
};
const btnCancel: React.CSSProperties = {
  padding: "9px 16px", border: "1px solid #e2e8f0", borderRadius: 10,
  background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b",
};
const btnOk: React.CSSProperties = {
  padding: "9px 22px", border: 0, borderRadius: 10,
  background: "#1e293b", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
};
