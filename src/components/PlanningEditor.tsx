"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  assignAffectation, removeAffectation, addRdv, removeRdv, setPresence,
} from "@/app/(app)/planning-actions";
import { STATUT_COLOR, STATUT_LABEL, type StatutChantier } from "@/lib/types";

type P = { id: string; nom: string; couleur: string | null };
type C = { id: string; client_nom: string; ville: string | null; statut: StatutChantier };
type A = { id: string; profil_id: string; date: string; chantier_id: string; client_nom: string };
type R = { id: string; profil_id: string; date: string; titre: string; heure: string | null };
type Pr = { profil_id: string; date: string; lieu: "magasin" | "rdv_ext" };
type Liv = { date: string; fournisseur: string; description: string | null };
type Day = { iso: string; label: string; ddmm: string; weekend: boolean };

export default function PlanningEditor(props: {
  days: Day[];
  direction: P[]; commerciaux: P[]; secretariat: P[]; poseurs: P[]; macons: P[];
  chantiers: C[]; affectations: A[]; rdv: R[]; presence: Pr[];
  livraisons: Liv[];
  editable: boolean;
}) {
  const { days, chantiers, affectations, rdv, presence, livraisons, editable } = props;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [drag, setDrag] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  const affOf = (pid: string, iso: string) => affectations.filter((a) => a.profil_id === pid && a.date === iso);
  const rdvOf = (pid: string, iso: string) => rdv.filter((r) => r.profil_id === pid && r.date === iso);

  function assign(pid: string, chantierId: string, iso: string) {
    const autre = affOf(pid, iso).find((a) => a.chantier_id !== chantierId);
    if (autre && !window.confirm(`Déjà affecté à ${autre.client_nom} ce jour-là. Remplacer ?`)) return;
    run(() => assignAffectation(pid, chantierId, iso));
  }
  function drop(pid: string, iso: string) {
    if (drag) assign(pid, drag, iso);
    setDrag(null);
  }

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
              <span key={a.id} style={chip}>
                {a.client_nom}
                {editable && <b onClick={() => window.confirm("Retirer cette affectation ?") && run(() => removeAffectation(a.id))} style={x}>✕</b>}
              </span>
            ))}
            {editable && (
              <select value="" onChange={(e) => { if (e.target.value) assign(p.id, e.target.value, d.iso); }}
                      style={sel}>
                <option value="">＋</option>
                {chantiers.map((c) => <option key={c.id} value={c.id}>{c.client_nom}</option>)}
              </select>
            )}
          </td>
        ))}
      </tr>
    ));
  }

  function rdvRows(list: P[]) {
    if (!list.length) return <tr><td style={tdLbl}>—</td><td colSpan={7} style={{ ...td, color: "#c4cad4" }}>Aucun</td></tr>;
    return list.map((p) => (
      <tr key={p.id}>
        <td style={{ ...tdLbl, borderLeft: `5px solid ${p.couleur ?? "#6b7686"}`, color: p.couleur ?? "#39424e" }}>{p.nom}</td>
        {days.map((d) => (
          <td key={d.iso} style={{ ...td, background: d.weekend ? "#fafafa" : "#fff" }}>
            {rdvOf(p.id, d.iso).map((r) => (
              <div key={r.id} style={{ marginBottom: 2 }}>
                {r.heure ? r.heure.slice(0, 5) + " " : ""}{r.titre}
                {editable && <b onClick={() => window.confirm("Supprimer ce RDV ?") && run(() => removeRdv(r.id))} style={x}>✕</b>}
              </div>
            ))}
            {editable && (
              <button onClick={() => {
                const titre = window.prompt("Titre du RDV ?");
                if (!titre) return;
                const heure = window.prompt("Heure (ex : 09:30) ? — laisser vide sinon", "") || null;
                run(() => addRdv(p.id, d.iso, titre, heure, null));
              }} style={addBtn}>＋ RDV</button>
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

  return (
    <div>
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
          {chantiers.length === 0 && <span style={{ fontSize: 12, color: "#c4cad4" }}>Aucun chantier — créez-en dans l’onglet Chantiers.</span>}
        </div>
      )}

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
            {/* ── Direction & Comptabilité ── */}
            {props.direction.length > 0 && <>
              <tr><td colSpan={8} style={sec}>Direction / Comptabilité</td></tr>
              {rdvRows(props.direction)}
            </>}

            {/* ── Commerciaux ── */}
            <tr><td colSpan={8} style={sec}>Commerciaux</td></tr>
            {rdvRows(props.commerciaux)}

            {/* ── Secrétariat ── */}
            {props.secretariat.length > 0 && <>
              <tr><td colSpan={8} style={sec}>Secrétariat</td></tr>
              {rdvRows(props.secretariat)}
            </>}

            {/* ── Poseurs ── */}
            <tr><td colSpan={8} style={sec}>Poseurs</td></tr>
            {poseurRows(props.poseurs)}

            {/* ── Maçons ── */}
            {props.macons.length > 0 && <>
              <tr><td colSpan={8} style={sec}>Maçons</td></tr>
              {poseurRows(props.macons)}
            </>}

            {/* ── Livraisons fournisseurs ── */}
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

const th: React.CSSProperties = { color: "#fff", fontWeight: 600, fontSize: 12.5, padding: "9px 8px", textAlign: "center", border: "1px solid #2b333d" };
const sec: React.CSSProperties = { background: "#f4f5f7", fontWeight: 700, fontSize: 11, letterSpacing: 0.6, color: "#6b7686", padding: "6px 14px", textTransform: "uppercase", border: "1px solid #e3e6ec" };
const td: React.CSSProperties = { border: "1px solid #e3e6ec", padding: "6px 8px", fontSize: 12, verticalAlign: "top" };
const tdLbl: React.CSSProperties = { ...td, fontWeight: 600, fontSize: 12.5, background: "#fbfcfd", width: 120 };
const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, background: "#e8f0f8", borderRadius: 6, padding: "2px 7px", fontSize: 11.5, marginRight: 4, marginBottom: 3 };
const x: React.CSSProperties = { cursor: "pointer", color: "#d0212f", marginLeft: 2 };
const sel: React.CSSProperties = { fontSize: 11, border: "1px dashed #cbd2db", borderRadius: 6, padding: "2px 4px", color: "#6b7686", background: "#fff" };
const addBtn: React.CSSProperties = { fontSize: 11, border: "1px dashed #cbd2db", borderRadius: 6, padding: "2px 6px", color: "#6b7686", background: "#fff", cursor: "pointer" };
