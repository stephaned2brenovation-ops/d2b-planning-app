"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  assignAffectation, removeAffectation, addRdv, removeRdv,
} from "@/app/(app)/planning-actions";
import { STATUT_COLOR, type StatutChantier } from "@/lib/types";
import { IconBriefcase, IconClipboard, IconHardHat, IconTruck, IconPin } from "@/components/icons";

type P   = { id: string; nom: string; couleur: string | null };
type C   = { id: string; client_nom: string; ville: string | null; adresse: string | null; designation: string | null; statut: StatutChantier };
type A   = { id: string; profil_id: string; date: string; chantier_id: string; client_nom: string; heure: string | null; lieu: string | null };
type R   = { id: string; profil_id: string; date: string; titre: string; heure: string | null };
type Pr  = { profil_id: string; date: string; lieu: "magasin" | "rdv_ext" };
type Liv = { date: string; fournisseur: string; description: string | null };
type Day = { iso: string; label: string; ddmm: string; weekend: boolean };

type RdvModal = { kind: "rdv";    pid: string; pnom: string; pcouleur: string | null; iso: string; label: string };
type PosModal = { kind: "poseur"; pid: string; pnom: string; pcouleur: string | null; iso: string; label: string };

const TODAY = new Date().toISOString().slice(0, 10);

/* ── Couleurs par section ── */
const SEC = {
  commerciaux:   { bg: "#f8fafc", border: "#2563eb", color: "#1e40af" },
  administration:{ bg: "#f8fafc", border: "#7c3aed", color: "#5b21b6" },
  ouvriers:      { bg: "#f8fafc", border: "#d97706", color: "#92400e" },
  livraisons:    { bg: "#f8fafc", border: "#ea580c", color: "#9a3412" },
} as const;

export default function PlanningEditor(props: {
  days: Day[];
  commerciaux: P[]; administration: P[];
  ouvriers: { metier: string; personnes: P[] }[];
  chantiers: C[]; affectations: A[]; rdv: R[]; presence: Pr[];
  livraisons: Liv[];
  editable: boolean;
}) {
  const { days, chantiers, affectations, rdv, livraisons, editable } = props;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [drag, setDrag] = useState<string | null>(null);

  const [modal, setModal]         = useState<RdvModal | PosModal | null>(null);
  const [rdvTitre, setRdvTitre]   = useState("");
  const [rdvHeure, setRdvHeure]   = useState("");
  const [rdvLieu,  setRdvLieu]    = useState("");
  const [rdvDate,  setRdvDate]    = useState("");
  const [posChantier, setPosChantier] = useState("");
  const [posDate,     setPosDate]     = useState("");
  const [posHeure,    setPosHeure]    = useState("");
  const [posLieu,     setPosLieu]     = useState("");
  const [posCreneau,  setPosCreneau]  = useState<"journee"|"matin"|"apres_midi">("journee");

  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  const affOf = (pid: string, iso: string) => affectations.filter((a) => a.profil_id === pid && a.date === iso);
  const rdvOf = (pid: string, iso: string) => rdv.filter((r) => r.profil_id === pid && r.date === iso);

  function openRdvModal(p: P, d: Day) {
    setRdvTitre(""); setRdvHeure(""); setRdvLieu(""); setRdvDate(d.iso);
    setModal({ kind: "rdv", pid: p.id, pnom: p.nom, pcouleur: p.couleur, iso: d.iso, label: d.label });
  }
  function openPosModal(p: P, d: Day) {
    setPosChantier(""); setPosDate(d.iso); setPosHeure(""); setPosLieu(""); setPosCreneau("journee");
    setModal({ kind: "poseur", pid: p.id, pnom: p.nom, pcouleur: p.couleur, iso: d.iso, label: d.label });
  }

  function submitRdv(e: React.FormEvent) {
    e.preventDefault();
    if (!modal || modal.kind !== "rdv" || !rdvTitre.trim()) return;
    run(() => addRdv(modal.pid, rdvDate || modal.iso, rdvTitre.trim(), rdvHeure || null, rdvLieu || null));
    setModal(null);
  }
  function submitPoseur(e: React.FormEvent) {
    e.preventDefault();
    if (!modal || modal.kind !== "poseur" || !posChantier) return;
    run(() => assignAffectation(modal.pid, posChantier, posDate || modal.iso, posCreneau, posHeure || null, posLieu || null));
    setModal(null);
  }

  function assign(pid: string, chantierId: string, iso: string) {
    const autre = affOf(pid, iso).find((a) => a.chantier_id !== chantierId);
    if (autre && !window.confirm(`Déjà affecté à ${autre.client_nom} ce jour-là. Remplacer ?`)) return;
    run(() => assignAffectation(pid, chantierId, iso));
  }
  function drop(pid: string, iso: string) {
    if (drag) assign(pid, drag, iso);
    setDrag(null);
  }

  /* ── Lignes poseurs / maçons ── */
  function poseurRows(list: P[]) {
    if (!list.length) return (
      <tr><td style={tdLbl}>—</td>
        <td colSpan={7} style={{ ...td, color: "#c4cad4", fontStyle: "italic", fontSize: 12 }}>Aucun</td>
      </tr>
    );
    return list.map((p) => (
      <tr key={p.id}>
        <td style={{ ...tdLbl, borderLeft: `4px solid ${p.couleur ?? "#6b7686"}` }}>
          <span style={{ color: p.couleur ?? "#39424e", fontWeight: 700 }}>{p.nom}</span>
        </td>
        {days.map((d) => {
          const isToday = d.iso === TODAY;
          return (
            <td key={d.iso}
                onDragOver={editable ? (e) => e.preventDefault() : undefined}
                onDrop={editable ? () => drop(p.id, d.iso) : undefined}
                style={{ ...td, background: isToday ? "#fffde7" : d.weekend ? "#f8f9fb" : "#fff", borderTop: isToday ? "2px solid #fbbf24" : undefined }}>
              {affOf(p.id, d.iso).map((a) => (
                <div key={a.id} style={{ marginBottom: 3, background: "#fff", border: "1px solid #e8ebf0", borderLeft: `3px solid ${p.couleur ?? "#6b7686"}`, borderRadius: 6, padding: "3px 7px", fontSize: 11.5, boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {a.heure && (
                      <span style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 10.5 }}>
                        {a.heure.slice(0, 5)}
                      </span>
                    )}
                    <span style={{ flex: 1, fontWeight: 600, color: "#1e293b" }}>{a.client_nom}</span>
                    {editable && (
                      <span onClick={() => window.confirm("Retirer cette affectation ?") && run(() => removeAffectation(a.id))}
                            style={{ color: "#94a3b8", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</span>
                    )}
                  </div>
                  {a.lieu && (
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, display: "flex", alignItems: "center", gap: 3 }}>
                      <IconPin size={10} /> {a.lieu}
                    </div>
                  )}
                </div>
              ))}
              {editable && (
                <button onClick={() => openPosModal(p, d)} className="cell-add" style={addBtn} title="Affecter un chantier">＋</button>
              )}
            </td>
          );
        })}
      </tr>
    ));
  }

  /* ── Lignes RDV (commerciaux / administration) ── */
  function rdvRows(list: P[]) {
    if (!list.length) return (
      <tr><td style={tdLbl}>—</td>
        <td colSpan={7} style={{ ...td, color: "#c4cad4", fontStyle: "italic", fontSize: 12 }}>Aucun</td>
      </tr>
    );
    return list.map((p) => (
      <tr key={p.id}>
        <td style={{ ...tdLbl, borderLeft: `4px solid ${p.couleur ?? "#6b7686"}` }}>
          <span style={{ color: p.couleur ?? "#39424e", fontWeight: 700 }}>{p.nom}</span>
        </td>
        {days.map((d) => {
          const isToday = d.iso === TODAY;
          return (
            <td key={d.iso} style={{ ...td, background: isToday ? "#fffde7" : d.weekend ? "#f8f9fb" : "#fff", borderTop: isToday ? "2px solid #fbbf24" : undefined }}>
              {rdvOf(p.id, d.iso).map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, background: "#fff", border: "1px solid #e8ebf0", borderLeft: "3px solid #2563eb", borderRadius: 6, padding: "3px 7px", fontSize: 11.5, boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
                  {r.heure && (
                    <span style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 10.5 }}>
                      {r.heure.slice(0, 5)}
                    </span>
                  )}
                  <span style={{ flex: 1, color: "#1e293b", fontWeight: 600 }}>{r.titre}</span>
                  {editable && (
                    <span onClick={() => window.confirm("Supprimer ce RDV ?") && run(() => removeRdv(r.id))}
                          style={{ color: "#94a3b8", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</span>
                  )}
                </div>
              ))}
              {editable && (
                <button onClick={() => openRdvModal(p, d)} className="cell-add" style={addBtn} title="Ajouter un RDV">＋</button>
              )}
            </td>
          );
        })}
      </tr>
    ));
  }

  const headerColor = modal?.pcouleur ?? "#39424e";

  return (
    <div style={{ opacity: pending ? 0.65 : 1, transition: "opacity .2s" }}>

      {/* ══ MODAL RDV ══ */}
      {modal?.kind === "rdv" && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHdr, background: `linear-gradient(135deg, ${headerColor}, ${headerColor}cc)` }}>
              <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>Nouveau RDV</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>{modal.pnom}</div>
            </div>
            <form onSubmit={submitRdv} style={{ padding: "20px 22px 18px" }}>
              <label style={lbl}>Date <span style={{ color: "#d0212f" }}>*</span></label>
              <input type="date" required value={rdvDate} onChange={(e) => setRdvDate(e.target.value)} style={{ ...inp, marginBottom: 14 }} />

              <label style={lbl}>Désignation <span style={{ color: "#d0212f" }}>*</span></label>
              <input autoFocus required value={rdvTitre} onChange={(e) => setRdvTitre(e.target.value)}
                     placeholder="Visite client, Devis, Réunion…" style={{ ...inp, marginBottom: 14 }} />

              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure</label>
                  <input type="time" value={rdvHeure} onChange={(e) => setRdvHeure(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={lbl}>Lieu</label>
                  <input value={rdvLieu} onChange={(e) => setRdvLieu(e.target.value)} placeholder="Adresse, ville…" style={inp} />
                </div>
              </div>

              <div style={modalFtr}>
                <button type="button" onClick={() => setModal(null)} style={btnCancel}>Annuler</button>
                <button type="submit" style={{ ...btnOk, background: headerColor }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL POSEUR ══ */}
      {modal?.kind === "poseur" && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHdr, background: `linear-gradient(135deg, ${headerColor}, ${headerColor}cc)` }}>
              <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>Affecter un chantier</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>{modal.pnom}</div>
            </div>
            <form onSubmit={submitPoseur} style={{ padding: "20px 22px 18px" }}>
              <label style={lbl}>Date <span style={{ color: "#d0212f" }}>*</span></label>
              <input type="date" required value={posDate} onChange={(e) => setPosDate(e.target.value)} style={{ ...inp, marginBottom: 14 }} />

              <label style={lbl}>Chantier <span style={{ color: "#d0212f" }}>*</span></label>
              <select required value={posChantier} onChange={(e) => {
                setPosChantier(e.target.value);
                const c = chantiers.find((x) => x.id === e.target.value);
                if (c && !posLieu) setPosLieu(c.adresse ?? c.ville ?? "");
              }} style={{ ...inp, marginBottom: 14 }}>
                <option value="">— Sélectionner un chantier —</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_nom}{c.ville ? ` — ${c.ville}` : ""}{c.designation ? ` (${c.designation})` : ""}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure de départ</label>
                  <input type="time" value={posHeure} onChange={(e) => setPosHeure(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Créneau</label>
                  <select value={posCreneau} onChange={(e) => setPosCreneau(e.target.value as "journee"|"matin"|"apres_midi")} style={inp}>
                    <option value="journee">Journée entière</option>
                    <option value="matin">Matin</option>
                    <option value="apres_midi">Après-midi</option>
                  </select>
                </div>
              </div>

              <label style={lbl}>Lieu / Adresse</label>
              <input value={posLieu} onChange={(e) => setPosLieu(e.target.value)}
                     placeholder="Adresse du chantier…" style={{ ...inp, marginBottom: 16 }} />

              <div style={modalFtr}>
                <button type="button" onClick={() => setModal(null)} style={btnCancel}>Annuler</button>
                <button type="submit" style={{ ...btnOk, background: headerColor }}>Affecter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Barre glisser-déposer ── */}
      {editable && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center", background: "#fff", border: "1px solid #e7e9ee", borderRadius: 10, padding: "8px 12px" }}>
          <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginRight: 4 }}>Glisser :</span>
          {chantiers.map((c) => (
            <span key={c.id} draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => setDrag(null)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: drag === c.id ? "#dbeafe" : "#f1f5f9", border: `1px solid ${drag === c.id ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 20, padding: "3px 10px 3px 8px", fontSize: 12, cursor: "grab", fontWeight: 500, color: "#334155" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUT_COLOR[c.statut], display: "inline-block" }} />
              {c.client_nom}
            </span>
          ))}
          {chantiers.length === 0 && <span style={{ fontSize: 12, color: "#c4cad4" }}>Aucun chantier — créez-en dans l&apos;onglet Chantiers.</span>}
        </div>
      )}

      {/* ── Tableau ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflowX: "auto", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 840 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", paddingLeft: 14, background: "#1e293b", width: 130 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "#94a3b8", textTransform: "uppercase" }}>Personnel</span>
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
                    <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.75, marginTop: 1 }}>{d.ddmm}</div>
                    {isToday && <div style={{ fontSize: 9, background: "#fbbf24", color: "#78350f", borderRadius: 4, padding: "1px 4px", display: "inline-block", marginTop: 2, fontWeight: 700 }}>AUJOURD&apos;HUI</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>

            {/* COMMERCIAUX */}
            <SectionRow label="Commerciaux" s={SEC.commerciaux} icon={<IconBriefcase size={13} />} />
            {rdvRows(props.commerciaux)}

            {/* ADMINISTRATION */}
            {props.administration.length > 0 && <>
              <SectionRow label="Administration" s={SEC.administration} icon={<IconClipboard size={13} />} />
              {rdvRows(props.administration)}
            </>}

            {/* OUVRIERS DU BÂTIMENT — groupés par métier */}
            <SectionRow label="Ouvriers du bâtiment" s={SEC.ouvriers} icon={<IconHardHat size={13} />} />
            {props.ouvriers.length === 0 && (
              <tr><td style={tdLbl}>—</td>
                <td colSpan={7} style={{ ...td, color: "#c4cad4", fontStyle: "italic", fontSize: 12 }}>Aucun</td>
              </tr>
            )}
            {props.ouvriers.map((groupe) => (
              <MetierRows key={groupe.metier} metier={groupe.metier}>
                {poseurRows(groupe.personnes)}
              </MetierRows>
            ))}

            {/* LIVRAISONS */}
            <SectionRow label="Livraisons fournisseurs" s={SEC.livraisons} icon={<IconTruck size={13} />} />
            <tr>
              <td style={{ ...tdLbl, color: SEC.livraisons.color, fontWeight: 700, fontSize: 11 }}>Livraisons</td>
              {days.map((d) => {
                const livs = livraisons.filter((l) => l.date === d.iso);
                const isToday = d.iso === TODAY;
                return (
                  <td key={d.iso} style={{ ...td, background: livs.length ? "#fff7ed" : isToday ? "#fffde7" : d.weekend ? "#f8f9fb" : "#fff" }}>
                    {livs.map((l, i) => (
                      <div key={i} style={{ marginBottom: 3 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #fdba74", borderLeft: "3px solid #ea580c", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#9a3412" }}>
                          <IconTruck size={11} /> {l.fournisseur}
                        </span>
                        {l.description && <div style={{ fontSize: 10.5, color: "#92400e", marginTop: 2, marginLeft: 2 }}>{l.description}</div>}
                      </div>
                    ))}
                    {!livs.length && <span style={{ color: "#e2e8f0", fontSize: 12 }}>—</span>}
                  </td>
                );
              })}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetierRows({ metier, children }: { metier: string; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={8} style={{
          background: "#fcfcfd", padding: "3px 14px 3px 26px",
          fontSize: 10.5, fontWeight: 700, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: 0.8,
          borderLeft: "4px solid #e2e8f0",
        }}>
          {metier}
        </td>
      </tr>
      {children}
    </>
  );
}

function SectionRow({ label, s, icon }: { label: string; s: typeof SEC[keyof typeof SEC]; icon: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={8} style={{
        background: s.bg,
        borderLeft: `4px solid ${s.border}`,
        padding: "8px 14px",
        fontWeight: 700, fontSize: 11.5, letterSpacing: 0.5,
        color: s.color,
        textTransform: "uppercase",
        borderTop: "2px solid #f1f5f9",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          {icon} {label}
        </span>
      </td>
    </tr>
  );
}

/* ── Styles ── */
const th: React.CSSProperties = {
  color: "#fff", fontWeight: 600, fontSize: 12.5, padding: "10px 8px",
  textAlign: "center", border: "1px solid rgba(255,255,255,.08)",
};
const td: React.CSSProperties = {
  border: "1px solid #f1f5f9", padding: "6px 7px", fontSize: 12, verticalAlign: "top", minHeight: 38,
};
const tdLbl: React.CSSProperties = {
  ...td, fontSize: 12, background: "#fafbfc", width: 126, padding: "8px 10px",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 11px", border: "1px solid #e2e8f0",
  borderRadius: 9, fontSize: 13, boxSizing: "border-box", outline: "none",
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
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 18, width: 440, maxWidth: "95vw",
  boxShadow: "0 25px 60px rgba(0,0,0,.3)", overflow: "hidden",
};
const modalHdr: React.CSSProperties = { padding: "18px 22px", color: "#fff" };
const modalFtr: React.CSSProperties = { display: "flex", gap: 8, justifyContent: "flex-end" };
const btnCancel: React.CSSProperties = {
  padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 10,
  background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b",
};
const btnOk: React.CSSProperties = {
  padding: "9px 22px", border: 0, borderRadius: 10,
  color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
};
const addBtn: React.CSSProperties = {
  fontSize: 13, borderRadius: 6, padding: "1px 0", cursor: "pointer",
  border: 0, color: "#94a3b8", background: "transparent",
  display: "block", width: "100%", textAlign: "center", fontWeight: 600,
  lineHeight: 1.4,
};
