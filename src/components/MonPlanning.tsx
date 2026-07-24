"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addRdv, updateRdv, removeRdv,
  addRelance, updateRelance, toggleRelanceFait, removeRelance,
} from "@/app/(app)/planning-actions";
import type { CanalRelance } from "@/lib/types";
import { IconMail, IconPhoneCall, IconMessage, IconCheck, IconSend, IconPin, IconCalendar } from "@/components/icons";

type Aff = { id: string; date: string; client_nom: string; ville: string | null; adresse: string | null; creneau: string; heure: string | null };
type R   = { id: string; date: string; titre: string; heure: string | null; lieu: string | null };
type Rel = {
  id: string; date: string; client_nom: string;
  client_email: string | null; client_tel: string | null;
  canal: CanalRelance; heure: string | null;
  objet: string | null; message: string | null; statut: "a_faire" | "fait";
};
type Vue = "jour" | "semaine" | "mois";

const CANAL_ICON: Record<CanalRelance, React.ReactNode> = {
  email:     <IconMail size={13} />,
  telephone: <IconPhoneCall size={13} />,
  sms:       <IconMessage size={13} />,
};

const JOURS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const _now = new Date();
const TODAY = isoLocal(_now);

/** Liste des jours à afficher selon la vue */
function joursVisibles(vue: Vue): { iso: string; label: string; ddmm: string }[] {
  const out: { iso: string; label: string; ddmm: string }[] = [];
  const push = (d: Date) => out.push({
    iso: isoLocal(d),
    label: JOURS_FR[d.getDay()],
    ddmm: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
  });
  const base = new Date();
  if (vue === "jour") {
    push(base);
  } else if (vue === "semaine") {
    const lundi = new Date(base);
    const shift = (base.getDay() + 6) % 7; // 0 = lundi
    lundi.setDate(base.getDate() - shift);
    for (let i = 0; i < 7; i++) { push(new Date(lundi)); lundi.setDate(lundi.getDate() + 1); }
  } else {
    const d = new Date(base.getFullYear(), base.getMonth(), 1);
    while (d.getMonth() === base.getMonth()) { push(new Date(d)); d.setDate(d.getDate() + 1); }
  }
  return out;
}

export default function MonPlanning(props: {
  profil: { id: string; nom: string; couleur: string | null; roleLabel: string };
  affectations: Aff[];
  rdv: R[];
  relances: Rel[];
}) {
  const { profil, affectations, rdv, relances } = props;
  const [vue, setVue] = useState<Vue>("semaine");
  const days = joursVisibles(vue);
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  const [modal, setModal] = useState<null | { kind: "rdv"; id?: string } | { kind: "relance"; id?: string }>(null);

  // États RDV
  const [rdvDate, setRdvDate]   = useState(TODAY);
  const [rdvTitre, setRdvTitre] = useState("");
  const [rdvHeure, setRdvHeure] = useState("");
  const [rdvLieu, setRdvLieu]   = useState("");

  // États Relance
  const [relClient, setRelClient] = useState("");
  const [relEmail, setRelEmail]   = useState("");
  const [relTel, setRelTel]       = useState("");
  const [relCanal, setRelCanal]   = useState<CanalRelance>("email");
  const [relDate, setRelDate]     = useState(TODAY);
  const [relHeure, setRelHeure]   = useState("");
  const [relObjet, setRelObjet]   = useState("");
  const [relMsg, setRelMsg]       = useState("");

  const MSG_DEFAUT = (client: string) =>
    `Bonjour ${client},\n\nNous revenons vers vous concernant votre projet de rénovation.\nAvez-vous eu le temps d'étudier notre proposition ?\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\nD2B Rénovation`;

  function relanceHref(r: Rel): string | null {
    if (r.canal === "email" && r.client_email) {
      const su = encodeURIComponent(r.objet || "D2B Rénovation — Votre projet");
      const bo = encodeURIComponent(r.message || MSG_DEFAUT(r.client_nom));
      return `mailto:${r.client_email}?subject=${su}&body=${bo}`;
    }
    if (r.canal === "telephone" && r.client_tel) return `tel:${r.client_tel.replace(/\s/g, "")}`;
    if (r.canal === "sms" && r.client_tel) {
      const bo = encodeURIComponent(r.message || MSG_DEFAUT(r.client_nom));
      return `sms:${r.client_tel.replace(/\s/g, "")}?body=${bo}`;
    }
    return null;
  }

  function openRdvNew() {
    setRdvDate(TODAY); setRdvTitre(""); setRdvHeure(""); setRdvLieu("");
    setModal({ kind: "rdv" });
  }
  function openRdvEdit(r: R) {
    setRdvDate(r.date); setRdvTitre(r.titre); setRdvHeure(r.heure?.slice(0, 5) ?? ""); setRdvLieu(r.lieu ?? "");
    setModal({ kind: "rdv", id: r.id });
  }
  function openRelNew() {
    setRelClient(""); setRelEmail(""); setRelTel(""); setRelCanal("email");
    setRelDate(TODAY); setRelHeure(""); setRelObjet(""); setRelMsg("");
    setModal({ kind: "relance" });
  }
  function openRelEdit(r: Rel) {
    setRelClient(r.client_nom); setRelEmail(r.client_email ?? ""); setRelTel(r.client_tel ?? "");
    setRelCanal(r.canal); setRelDate(r.date); setRelHeure(r.heure?.slice(0, 5) ?? "");
    setRelObjet(r.objet ?? ""); setRelMsg(r.message ?? "");
    setModal({ kind: "relance", id: r.id });
  }

  function submitRdv(e: React.FormEvent) {
    e.preventDefault();
    if (!modal || modal.kind !== "rdv" || !rdvTitre.trim()) return;
    if (modal.id) run(() => updateRdv(modal.id!, rdvDate, rdvTitre.trim(), rdvHeure || null, rdvLieu || null));
    else          run(() => addRdv(profil.id, rdvDate, rdvTitre.trim(), rdvHeure || null, rdvLieu || null));
    setModal(null);
  }
  function submitRelance(e: React.FormEvent) {
    e.preventDefault();
    if (!modal || modal.kind !== "relance" || !relClient.trim()) return;
    const input = {
      client_nom: relClient.trim(),
      client_email: relEmail.trim() || null,
      client_tel: relTel.trim() || null,
      canal: relCanal,
      date: relDate,
      heure: relHeure || null,
      objet: relObjet.trim() || null,
      message: relMsg.trim() || null,
    };
    if (modal.id) run(() => updateRelance(modal.id!, input));
    else          run(() => addRelance(profil.id, input));
    setModal(null);
  }

  const couleur = profil.couleur ?? "#39424e";

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", opacity: pending ? 0.65 : 1, transition: "opacity .2s" }}>
      {/* En-tête */}
      <div style={{ background: "#39424e", color: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{profil.roleLabel}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{profil.nom}</div>
      </div>

      {/* Sélecteur de vue */}
      <div style={{ display: "flex", gap: 3, background: "#e2e8f0", borderRadius: 11, padding: 4, marginBottom: 10 }}>
        {(["jour", "semaine", "mois"] as Vue[]).map((v) => (
          <button key={v} onClick={() => setVue(v)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, border: 0, cursor: "pointer",
                    fontSize: 13, fontWeight: vue === v ? 700 : 500,
                    background: vue === v ? "#fff" : "transparent",
                    color: vue === v ? "#1e293b" : "#64748b",
                    boxShadow: vue === v ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                    textTransform: "capitalize",
                  }}>
            {v}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={openRdvNew} style={{ ...btnAction, background: "#2563eb" }}>
          <IconCalendar size={14} /> Nouveau RDV
        </button>
        <button onClick={openRelNew} style={{ ...btnAction, background: "#d97706" }}>
          <IconSend size={14} /> Nouvelle relance
        </button>
      </div>

      {/* Jours */}
      {days.map((d) => {
        const aff = affectations.filter((a) => a.date === d.iso);
        const rd  = rdv.filter((r) => r.date === d.iso);
        const rel = relances.filter((r) => r.date === d.iso);
        if (aff.length === 0 && rd.length === 0 && rel.length === 0) return null;
        const isToday = d.iso === TODAY;
        return (
          <div key={d.iso} style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, border: isToday ? "2px solid #d0212f" : "1px solid #e7e9ee" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? "#d0212f" : "#6b7686", textTransform: "uppercase" }}>
              {d.label} {d.ddmm} {isToday ? "· aujourd’hui" : ""}
            </div>

            {/* Affectations chantier (lecture) */}
            {aff.map((a) => (
              <div key={a.id} style={{ marginTop: 10, paddingLeft: 10, borderLeft: "3px solid #64748b" }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {a.heure ? a.heure.slice(0, 5) + " · " : ""}{a.client_nom}
                </div>
                <div style={{ fontSize: 13, color: "#6b7686", display: "flex", alignItems: "center", gap: 4 }}>
                  <IconPin size={12} /> {a.ville ?? "—"} · {a.creneau.replace("_", "-")}
                </div>
                {a.adresse && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(a.adresse)}`}
                     style={{ fontSize: 13, color: "#2e77c9" }}>Itinéraire →</a>
                )}
              </div>
            ))}

            {/* RDV (modifiables) */}
            {rd.map((r) => (
              <div key={r.id} onClick={() => openRdvEdit(r)}
                   style={{ marginTop: 10, paddingLeft: 10, borderLeft: "3px solid #2563eb", cursor: "pointer" }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {r.heure ? r.heure.slice(0, 5) + " · " : ""}{r.titre}
                </div>
                {r.lieu && <div style={{ fontSize: 13, color: "#6b7686" }}>{r.lieu}</div>}
                <div style={{ fontSize: 11.5, color: "#94a3b8" }}>Toucher pour modifier</div>
              </div>
            ))}

            {/* Relances */}
            {rel.map((r) => {
              const fait = r.statut === "fait";
              const href = relanceHref(r);
              return (
                <div key={r.id} onClick={() => openRelEdit(r)}
                     style={{ marginTop: 10, paddingLeft: 10, borderLeft: `3px solid ${fait ? "#22c55e" : "#f59e0b"}`, cursor: "pointer", opacity: fait ? 0.7 : 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: fait ? "#16a34a" : "#d97706", display: "inline-flex" }}>{CANAL_ICON[r.canal]}</span>
                    <span style={{ textDecoration: fait ? "line-through" : "none" }}>
                      {r.heure ? r.heure.slice(0, 5) + " · " : ""}Relance {r.client_nom}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {href && !fait && (
                      <a href={href} onClick={(e) => e.stopPropagation()}
                         style={{ ...miniBtn, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                        <IconSend size={12} /> {r.canal === "email" ? "Envoyer l'email" : r.canal === "sms" ? "Envoyer le SMS" : "Appeler"}
                      </a>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); run(() => toggleRelanceFait(r.id, !fait)); }}
                            style={{ ...miniBtn, background: fait ? "#f0fdf4" : "#f8fafc", color: fait ? "#16a34a" : "#64748b", border: `1px solid ${fait ? "#bbf7d0" : "#e2e8f0"}` }}>
                      <IconCheck size={12} /> {fait ? "Fait" : "Marquer fait"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {(() => {
        const vis = new Set(days.map((d) => d.iso));
        const vide = !affectations.some((a) => vis.has(a.date))
                  && !rdv.some((r) => vis.has(r.date))
                  && !relances.some((r) => vis.has(r.date));
        return vide ? (
          <p style={{ color: "#6b7686", textAlign: "center", marginTop: 30 }}>
            Rien de prévu {vue === "jour" ? "aujourd’hui" : vue === "semaine" ? "cette semaine" : "ce mois-ci"}.
          </p>
        ) : null;
      })()}

      {/* ══ MODAL RDV ══ */}
      {modal?.kind === "rdv" && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHdr, background: couleur }}>
              {modal.id ? "Modifier le RDV" : "Nouveau RDV"}
            </div>
            <form onSubmit={submitRdv} style={{ padding: "18px 20px" }}>
              <label style={lbl}>Date *</label>
              <input type="date" required value={rdvDate} onChange={(e) => setRdvDate(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
              <label style={lbl}>Désignation *</label>
              <input autoFocus required value={rdvTitre} onChange={(e) => setRdvTitre(e.target.value)}
                     placeholder="Visite client, Devis…" style={{ ...inp, marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure</label>
                  <input type="time" value={rdvHeure} onChange={(e) => setRdvHeure(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={lbl}>Lieu</label>
                  <input value={rdvLieu} onChange={(e) => setRdvLieu(e.target.value)} placeholder="Adresse…" style={inp} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {modal.id && (
                  <button type="button"
                          onClick={() => { if (window.confirm("Supprimer ce RDV ?")) { run(() => removeRdv(modal.id!)); setModal(null); } }}
                          style={btnDel}>Supprimer</button>
                )}
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setModal(null)} style={btnCancel}>Annuler</button>
                <button type="submit" style={{ ...btnOk, background: couleur }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL RELANCE ══ */}
      {modal?.kind === "relance" && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={card} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHdr, background: couleur }}>
              {modal.id ? "Modifier la relance" : "Nouvelle relance client"}
            </div>
            <form onSubmit={submitRelance} style={{ padding: "18px 20px", maxHeight: "72vh", overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Date *</label>
                  <input type="date" required value={relDate} onChange={(e) => setRelDate(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Heure</label>
                  <input type="time" value={relHeure} onChange={(e) => setRelHeure(e.target.value)} style={inp} />
                </div>
              </div>
              <label style={lbl}>Client *</label>
              <input autoFocus required value={relClient} onChange={(e) => setRelClient(e.target.value)}
                     placeholder="Mr DUPONT" style={{ ...inp, marginBottom: 12 }} />
              <label style={lbl}>Canal *</label>
              <select value={relCanal} onChange={(e) => setRelCanal(e.target.value as CanalRelance)} style={{ ...inp, marginBottom: 12 }}>
                <option value="email">✉️ Email</option>
                <option value="telephone">📞 Téléphone</option>
                <option value="sms">💬 SMS</option>
              </select>
              {relCanal === "email" ? (
                <>
                  <label style={lbl}>Email du client *</label>
                  <input type="email" required value={relEmail} onChange={(e) => setRelEmail(e.target.value)}
                         placeholder="client@email.com" style={{ ...inp, marginBottom: 12 }} />
                  <label style={lbl}>Objet</label>
                  <input value={relObjet} onChange={(e) => setRelObjet(e.target.value)}
                         placeholder="D2B Rénovation — Votre projet" style={{ ...inp, marginBottom: 12 }} />
                </>
              ) : (
                <>
                  <label style={lbl}>Téléphone du client *</label>
                  <input type="tel" required value={relTel} onChange={(e) => setRelTel(e.target.value)}
                         placeholder="06 12 34 56 78" style={{ ...inp, marginBottom: 12 }} />
                </>
              )}
              <label style={lbl}>{relCanal === "telephone" ? "Notes / points à aborder" : "Message"}</label>
              <textarea value={relMsg} onChange={(e) => setRelMsg(e.target.value)} rows={4}
                        placeholder={relCanal === "telephone" ? "Points à aborder…" : "Laissez vide pour le message type D2B."}
                        style={{ ...inp, marginBottom: 14, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {modal.id && (
                  <button type="button"
                          onClick={() => { if (window.confirm("Supprimer cette relance ?")) { run(() => removeRelance(modal.id!)); setModal(null); } }}
                          style={btnDel}>Supprimer</button>
                )}
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setModal(null)} style={btnCancel}>Annuler</button>
                <button type="submit" style={{ ...btnOk, background: couleur }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */
const btnAction: React.CSSProperties = {
  flex: 1, border: 0, color: "#fff", borderRadius: 10, padding: "11px 12px",
  fontSize: 13.5, fontWeight: 700, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
};
const miniBtn: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, borderRadius: 7, padding: "5px 10px",
  cursor: "pointer", textDecoration: "none",
  display: "inline-flex", alignItems: "center", gap: 5,
};
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,.5)",
  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(2px)", padding: 12,
};
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 16, width: 420, maxWidth: "96vw",
  boxShadow: "0 25px 60px rgba(0,0,0,.3)", overflow: "hidden",
};
const modalHdr: React.CSSProperties = { padding: "15px 20px", color: "#fff", fontWeight: 700, fontSize: 16 };
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 11px", border: "1px solid #e2e8f0",
  borderRadius: 9, fontSize: 13.5, boxSizing: "border-box", outline: "none",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569",
  marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3,
};
const btnCancel: React.CSSProperties = {
  padding: "9px 16px", border: "1px solid #e2e8f0", borderRadius: 10,
  background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b",
};
const btnOk: React.CSSProperties = {
  padding: "9px 20px", border: 0, borderRadius: 10,
  color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
};
const btnDel: React.CSSProperties = {
  padding: "9px 14px", border: "1px solid #fecaca", borderRadius: 10,
  background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 600,
};
