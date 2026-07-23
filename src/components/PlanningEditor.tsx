"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  assignAffectation, removeAffectation, addRdv, removeRdv, setPresence,
} from "@/app/(app)/planning-actions";
import { STATUT_COLOR, STATUT_LABEL, type StatutChantier } from "@/lib/types";

type P = { id: string; nom: string; couleur: string | null };
type C = { id: string; client_nom: string; ville: string | null; adresse: string | null; designation: string | null; statut: StatutChantier };
type A = { id: string; profil_id: string; date: string; chantier_id: string; client_nom: string; heure: string | null; lieu: string | null };
type R = { id: string; profil_id: string; date: string; titre: string; heure: string | null };
type Pr = { profil_id: string; date: string; lieu: "magasin" | "rdv_ext" };
type Liv = { date: string; fournisseur: string; description: string | null };
type Day = { iso: string; label: string; ddmm: string; weekend: boolean };

type RdvModal  = { kind: "rdv";     pid: string; pnom: string; pcouleur: string | null; iso: string; label: string };
type PosModal  = { kind: "poseur";  pid: string; pnom: string; pcouleur: string | null; iso: string; label: string };

function fmtDate(iso: string, label: string) {
  const d = new Date(iso + "T00:00:00");
  return `${label} ${d.getDate()} ${d.toLocaleString("fr-FR", { month: "long" })} ${d.getFullYear()}`;
}

export default function PlanningEditor(props: {
  days: Day[];
  commerciaux: P[]; administration: P[]; menuiseries: P[]; maconnerie: P[];
  chantiers: C[]; affectations: A[]; rdv: R[]; presence: Pr[];
  livraisons: Liv[];
  editable: boolean;
}) {
  const { days, chantiers, affectations, rdv, presence, livraisons, editable } = props;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [drag, setDrag] = useState<string | null>(null);

  // ── Modaux ──
  const [modal, setModal] = useState<RdvModal | PosModal | null>(null);
  const [rdvTitre, setRdvTitre] = useState("");
  const [rdvHeure, setRdvHeure] = useState("");
  const [rdvLieu,  setRdvLieu]  = useState("");
  const [rdvDate,  setRdvDate]  = useState("");   // date choisie dans le modal
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

  /* ── Lignes poseurs / maçons — même style que rdvRows ── */
  function poseurRows(list: P[]) {
    if (!list.length) return <tr><td style={tdLbl}>—</td><td colSpan={7} style={{ ...td, color: "#c4cad4" }}>Aucun</td></tr>;
    return list.map((p) => (
      <tr key={p.id}>
        <td style={{ ...tdLbl, borderLeft: `5px solid ${p.couleur ?? "#6b7686"}`, color: p.couleur ?? "#39424e" }}>{p.nom}</td>
        {days.map((d) => (
          <td key={d.iso}
              onDragOver={editable ? (e) => e.preventDefault() : undefined}
              onDrop={editable ? () => drop(p.id, d.iso) : undefined}
              style={{ ...td, background: d.weekend ? "#fafafa" : "#fff" }}>
            {affOf(p.id, d.iso).map((a) => (
              <div key={a.id} style={{ marginBottom: 3, background: (p.couleur ?? "#6b7686") + "18", borderRadius: 6, padding: "3px 6px", fontSize: 11.5 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {a.heure && <span style={{ color: "#2e77c9", fontWeight: 700, whiteSpace: "nowrap" }}>{a.heure.slice(0,5)}</span>}
                  <span style={{ flex: 1, color: "#39424e", fontWeight: 600 }}>{a.client_nom}</span>
                  {editable && <b onClick={() => window.confirm("Retirer cette affectation ?") && run(() => removeAffectation(a.id))} style={xBtn}>✕</b>}
                </div>
                {a.lieu && <div style={{ fontSize: 10.5, color: "#6b7686", marginTop: 1 }}>📍 {a.lieu}</div>}
              </div>
            ))}
            {editable && (
              <button onClick={() => openPosModal(p, d)} style={addBtn}>＋ Chantier</button>
            )}
          </td>
        ))}
      </tr>
    ));
  }

  /* ── Lignes RDV (bureau / commerciaux) ── */
  function rdvRows(list: P[]) {
    if (!list.length) return <tr><td style={tdLbl}>—</td><td colSpan={7} style={{ ...td, color: "#c4cad4" }}>Aucun</td></tr>;
    return list.map((p) => (
      <tr key={p.id}>
        <td style={{ ...tdLbl, borderLeft: `5px solid ${p.couleur ?? "#6b7686"}`, color: p.couleur ?? "#39424e" }}>{p.nom}</td>
        {days.map((d) => (
          <td key={d.iso} style={{ ...td, background: d.weekend ? "#fafafa" : "#fff" }}>
            {rdvOf(p.id, d.iso).map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3, background: "#eef4ff", borderRadius: 6, padding: "3px 6px", fontSize: 11.5 }}>
                {r.heure && <span style={{ color: "#2e77c9", fontWeight: 700, whiteSpace: "nowrap" }}>{r.heure.slice(0, 5)}</span>}
                <span style={{ flex: 1 }}>{r.titre}</span>
                {editable && <b onClick={() => window.confirm("Supprimer ce RDV ?") && run(() => removeRdv(r.id))} style={xBtn}>✕</b>}
              </div>
            ))}
            {editable && (
              <button onClick={() => openRdvModal(p, d)} style={addBtn}>＋ RDV</button>
            )}
          </td>
        ))}
      </tr>
    ));
  }

  const presOf = (pid: string, iso: string) =>
    presence.find((p) => p.profil_id === pid && p.date === iso)?.lieu ?? "";

  function presenceRows(list: P[]) {
    if (!list.length) return <tr><td style={tdLbl}>—</td><td colSpan={7} style={{ ...td, color: "#c4cad4" }}>Aucun</td></tr>;
    return list.map((p) => (
      <tr key={"pres-" + p.id}>
        <td style={{ ...tdLbl, borderLeft: `5px solid ${p.couleur ?? "#6b7686"}`, color: p.couleur ?? "#39424e" }}>{p.nom}</td>
        {days.map((d) => {
          const cur = presOf(p.id, d.iso);
          const mag = cur === "magasin";
          return (
            <td key={d.iso} style={{ ...td, background: mag ? (p.couleur ?? "#39424e") + "14" : d.weekend ? "#fafafa" : "#fff", color: mag ? (p.couleur ?? "#39424e") : undefined, fontWeight: mag ? 600 : undefined }}>
              {editable ? (
                <select value={cur} onChange={(e) => run(() => setPresence(p.id, d.iso, e.target.value as "magasin" | "rdv_ext" | ""))} style={sel}>
                  <option value="">—</option>
                  <option value="magasin">Magasin</option>
                  <option value="rdv_ext">RDV ext.</option>
                </select>
              ) : (cur === "magasin" ? "Magasin" : cur === "rdv_ext" ? "RDV ext." : <span style={{ color: "#c4cad4" }}>—</span>)}
            </td>
          );
        })}
      </tr>
    ));
  }

  const headerColor = modal?.pcouleur ?? "#39424e";

  return (
    <div>

      {/* ═══════════════════════════════════════
          MODAL RDV
      ═══════════════════════════════════════ */}
      {modal?.kind === "rdv" && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHdr, background: headerColor }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Nouveau RDV</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{modal.pnom}</div>
            </div>
            <form onSubmit={submitRdv} style={{ padding: "18px 20px 16px" }}>
              <label style={lbl}>Date <span style={{ color: "#d0212f" }}>*</span></label>
              <input type="date" required value={rdvDate} onChange={(e) => setRdvDate(e.target.value)} style={{ ...inp, marginBottom: 12 }} />

              <label style={lbl}>Désignation <span style={{ color: "#d0212f" }}>*</span></label>
              <input autoFocus required value={rdvTitre} onChange={(e) => setRdvTitre(e.target.value)}
                     placeholder="Visite client, Devis, Réunion…" style={{ ...inp, marginBottom: 12 }} />

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
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

      {/* ═══════════════════════════════════════
          MODAL POSEUR — affectation chantier
      ═══════════════════════════════════════ */}
      {modal?.kind === "poseur" && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHdr, background: headerColor }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Affecter un chantier</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{modal.pnom}</div>
            </div>
            <form onSubmit={submitPoseur} style={{ padding: "18px 20px 16px" }}>

              <label style={lbl}>Date <span style={{ color: "#d0212f" }}>*</span></label>
              <input type="date" required value={posDate} onChange={(e) => setPosDate(e.target.value)} style={{ ...inp, marginBottom: 12 }} />

              <label style={lbl}>Chantier <span style={{ color: "#d0212f" }}>*</span></label>
              <select required value={posChantier} onChange={(e) => {
                setPosChantier(e.target.value);
                const c = chantiers.find((x) => x.id === e.target.value);
                if (c?.ville && !posLieu) setPosLieu(c.adresse ?? c.ville ?? "");
              }} style={{ ...inp, marginBottom: 12 }}>
                <option value="">— Sélectionner un chantier —</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_nom}{c.ville ? ` — ${c.ville}` : ""}{c.designation ? ` (${c.designation})` : ""}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
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
              <input value={posLieu} onChange={(e) => setPosLieu(e.target.value)} placeholder="Adresse du chantier…" style={{ ...inp, marginBottom: 14 }} />

              <div style={modalFtr}>
                <button type="button" onClick={() => setModal(null)} style={btnCancel}>Annuler</button>
                <button type="submit" style={{ ...btnOk, background: headerColor }}>Affecter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Barre chantiers drag ── */}
      {editable && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7686" }}>Glissez un chantier sur une case :</span>
          {chantiers.map((c) => (
            <span key={c.id} draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => setDrag(null)}
                  style={{ ...chip, cursor: "grab", background: "#eef1f5" }}>
              {c.client_nom}
              <span style={{ marginLeft: 6, color: "#fff", background: STATUT_COLOR[c.statut], borderRadius: 4, padding: "0 5px", fontSize: 10 }}>{STATUT_LABEL[c.statut]}</span>
            </span>
          ))}
          {chantiers.length === 0 && <span style={{ fontSize: 12, color: "#c4cad4" }}>Aucun chantier — créez-en dans l'onglet Chantiers.</span>}
        </div>
      )}

      {/* ── Tableau ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e9ee", overflowX: "auto", opacity: pending ? 0.6 : 1 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", paddingLeft: 12, background: "#4c5766" }}>D2B RÉNOVATION</th>
              {days.map((d) => (
                <th key={d.iso} style={{ ...th, background: d.weekend ? "#345f86" : "#39424e" }}>
                  {d.label}<div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>{d.ddmm}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} style={sec}>Commerciaux</td></tr>
            {rdvRows(props.commerciaux)}

            {props.administration.length > 0 && <>
              <tr><td colSpan={8} style={sec}>Administration</td></tr>
              {rdvRows(props.administration)}
            </>}

            <tr><td colSpan={8} style={sec}>Menuiseries Extérieures</td></tr>
            {poseurRows(props.menuiseries)}

            {props.maconnerie.length > 0 && <>
              <tr><td colSpan={8} style={sec}>Maçonnerie Général</td></tr>
              {poseurRows(props.maconnerie)}
            </>}

            <tr><td colSpan={8} style={{ ...sec, background: "#fff3e0", color: "#b45309" }}>🚚 Livraisons fournisseurs</td></tr>
            <tr>
              <td style={{ ...tdLbl, color: "#b45309", fontWeight: 700 }}>Livraisons</td>
              {days.map((d) => {
                const livs = livraisons.filter((l) => l.date === d.iso);
                return (
                  <td key={d.iso} style={{ ...td, background: livs.length ? "#fff8ed" : d.weekend ? "#fafafa" : "#fff" }}>
                    {livs.map((l, i) => (
                      <div key={i} style={{ marginBottom: 3 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fed7aa", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600, color: "#92400e" }}>
                          🚚 {l.fournisseur}
                        </span>
                        {l.description && <div style={{ fontSize: 10.5, color: "#92400e", marginTop: 2, marginLeft: 2 }}>{l.description}</div>}
                      </div>
                    ))}
                    {!livs.length && <span style={{ color: "#d4c5a9", fontSize: 11 }}>—</span>}
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

/* ── Styles ── */
const th: React.CSSProperties  = { color: "#fff", fontWeight: 600, fontSize: 12.5, padding: "9px 8px", textAlign: "center", border: "1px solid #2b333d" };
const sec: React.CSSProperties = { background: "#f4f5f7", fontWeight: 700, fontSize: 11, letterSpacing: 0.6, color: "#6b7686", padding: "6px 14px", textTransform: "uppercase", border: "1px solid #e3e6ec" };
const td: React.CSSProperties  = { border: "1px solid #e3e6ec", padding: "6px 8px", fontSize: 12, verticalAlign: "top" };
const tdLbl: React.CSSProperties = { ...td, fontWeight: 600, fontSize: 12.5, background: "#fbfcfd", width: 120 };
const chip: React.CSSProperties  = { display: "inline-flex", alignItems: "center", gap: 4, background: "#e8f0f8", borderRadius: 6, padding: "2px 7px", fontSize: 11.5, marginRight: 4, marginBottom: 3 };
const xBtn: React.CSSProperties  = { cursor: "pointer", color: "#d0212f", marginLeft: 2 };
const sel: React.CSSProperties   = { fontSize: 11, border: "1px dashed #cbd2db", borderRadius: 6, padding: "2px 4px", color: "#6b7686", background: "#fff" };
const addBtn: React.CSSProperties = { fontSize: 11, border: "1px dashed #cbd2db", borderRadius: 6, padding: "2px 6px", color: "#6b7686", background: "#fff", cursor: "pointer" };
const inp: React.CSSProperties   = { width: "100%", padding: "9px 11px", border: "1px solid #e7e9ee", borderRadius: 9, fontSize: 13, boxSizing: "border-box" };
const lbl: React.CSSProperties   = { display: "block", fontSize: 12, fontWeight: 600, color: "#39424e", marginBottom: 4 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(20,30,50,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
const card: React.CSSProperties    = { background: "#fff", borderRadius: 16, width: 420, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" };
const modalHdr: React.CSSProperties = { padding: "16px 20px", color: "#fff" };
const modalFtr: React.CSSProperties = { display: "flex", gap: 8, justifyContent: "flex-end" };
const btnCancel: React.CSSProperties = { padding: "9px 16px", border: "1px solid #e7e9ee", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 13, color: "#6b7686" };
const btnOk: React.CSSProperties    = { padding: "9px 20px", border: 0, borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 };
