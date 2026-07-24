"use client";

import { useState } from "react";

type P = { id: string; nom: string; couleur: string | null; metier: string | null };

/**
 * Sélecteur d'équipe compact :
 * - affiche uniquement les membres sélectionnés (pastilles)
 * - bouton ▾ ouvre un menu déroulant multi-choix pour modifier
 * - injecte des <input hidden name="equipe_ids"> pour le formulaire parent
 */
export default function EquipeSelect({ equipe, selected }: { equipe: P[]; selected: string[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set(selected));
  const [open, setOpen] = useState(false);

  const membres = equipe.filter((p) => sel.has(p.id));

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Valeurs pour le formulaire */}
      {[...sel].map((id) => <input key={id} type="hidden" name="equipe_ids" value={id} />)}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {/* Membres sélectionnés */}
        {membres.length === 0 ? (
          <span style={{ fontSize: 12.5, color: "#94a3b8", fontStyle: "italic" }}>Aucun membre affecté</span>
        ) : (
          membres.map((p) => (
            <span key={p.id} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: (p.couleur ?? "#6b7686") + "15",
              border: `1.5px solid ${p.couleur ?? "#6b7686"}`,
              borderRadius: 20, padding: "3px 11px",
              fontSize: 12.5, fontWeight: 600, color: "#1e293b",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.couleur ?? "#6b7686" }} />
              {p.nom}
              {p.metier && <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 400 }}>· {p.metier}</span>}
            </span>
          ))
        )}

        {/* Bouton ouvrir le menu */}
        <button type="button" onClick={() => setOpen(!open)}
                style={{
                  border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 20,
                  padding: "3px 12px", fontSize: 12.5, fontWeight: 600, color: "#2563eb", cursor: "pointer",
                }}>
          {open ? "Fermer ▴" : "Modifier ▾"}
        </button>
      </div>

      {/* Menu déroulant multi-choix */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 6, zIndex: 50,
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,.15)", padding: 10,
            minWidth: 260, maxHeight: 280, overflowY: "auto",
          }}>
            {equipe.map((p) => {
              const on = sel.has(p.id);
              return (
                <label key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                  borderRadius: 8, cursor: "pointer", fontSize: 13,
                  background: on ? (p.couleur ?? "#2563eb") + "12" : "transparent",
                }}>
                  <input type="checkbox" checked={on} onChange={() => toggle(p.id)} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.couleur ?? "#6b7686", flexShrink: 0 }} />
                  <span style={{ fontWeight: on ? 700 : 400, flex: 1 }}>{p.nom}</span>
                  {p.metier && <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.metier}</span>}
                </label>
              );
            })}
            {equipe.length === 0 && <div style={{ fontSize: 12.5, color: "#94a3b8", padding: 6 }}>Aucun membre terrain.</div>}
          </div>
        </>
      )}
    </div>
  );
}
