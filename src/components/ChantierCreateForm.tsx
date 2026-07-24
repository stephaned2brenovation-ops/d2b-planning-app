"use client";

import { useRef, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { addChantier } from "@/app/(app)/chantiers/actions";
import { STATUT_LABEL, type StatutChantier } from "@/lib/types";

type Profil = { id: string; nom: string; couleur: string | null; metier: string | null };
const STATUTS: StatutChantier[] = ["a_planifier", "en_cours", "termine", "sav"];

export default function ChantierCreateForm({ equipe }: { equipe: Profil[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selEquipe, setSelEquipe] = useState<Set<string>>(new Set());

  function toggleMembre(id: string) {
    setSelEquipe((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Injecter les ids sélectionnés (les checkboxes sont gérés par React state)
    selEquipe.forEach((id) => fd.append("equipe_ids", id));
    start(async () => {
      await addChantier(fd);
      formRef.current?.reset();
      setSelEquipe(new Set());
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ opacity: pending ? 0.65 : 1, transition: "opacity .2s" }}>

      {/* ── INFORMATIONS ── */}
      <div style={section}>
        <SectionTitle>📋 Informations du chantier</SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="Client *" style={{ minWidth: 160, flex: 2 }}>
            <input name="client_nom" required placeholder="Nom du client" style={inp} />
          </Field>
          <Field label="Désignation" style={{ minWidth: 140, flex: 2 }}>
            <input name="designation" placeholder="Ex : 1F 2vtx, Baie coulissante…" style={inp} />
          </Field>
          <Field label="Ville" style={{ minWidth: 110, flex: 1 }}>
            <input name="ville" placeholder="Toulon, Hyères…" style={inp} />
          </Field>
          <Field label="Adresse" style={{ minWidth: 180, flex: 2 }}>
            <input name="adresse" placeholder="Rue + n° (pour l'itinéraire)" style={inp} />
          </Field>
          <Field label="Tél. contact" style={{ minWidth: 120 }}>
            <input name="contact_tel" placeholder="06 …" style={inp} />
          </Field>
          <Field label="Statut" style={{ minWidth: 120 }}>
            <select name="statut" defaultValue="a_planifier" style={inp}>
              {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
            </select>
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, whiteSpace: "nowrap", paddingBottom: 2 }}>
            <input type="checkbox" name="renfort" /> Renfort (RE)
          </label>
        </div>
      </div>

      {/* ── ÉQUIPE ── */}
      <div style={section}>
        <SectionTitle>👷 Équipe assignée</SectionTitle>
        {equipe.length === 0 ? (
          <p style={{ color: "#9aa3ad", fontSize: 13, margin: 0 }}>Aucun membre terrain — ajoutez du personnel d&apos;abord.</p>
        ) : (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {equipe.map((p) => {
              const sel = selEquipe.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleMembre(p.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px",
                    border: sel ? `2px solid ${p.couleur ?? "#2563eb"}` : "2px solid #e7e9ee",
                    borderRadius: 20,
                    background: sel ? (p.couleur ?? "#2563eb") + "18" : "#fafbfc",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: sel ? 700 : 400,
                    color: sel ? (p.couleur ?? "#2563eb") : "#39424e",
                    transition: "all .15s",
                  }}
                >
                  <span style={{
                    width: 11, height: 11, borderRadius: "50%",
                    background: p.couleur ?? "#6b7686",
                    flexShrink: 0,
                    outline: sel ? `2px solid ${p.couleur ?? "#2563eb"}` : "none",
                    outlineOffset: 1,
                  }} />
                  {p.nom}
                  {p.metier && <span style={{ fontSize: 11, opacity: 0.65 }}>· {p.metier}</span>}
                </button>
              );
            })}
          </div>
        )}
        {selEquipe.size > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#2563eb" }}>
            ✓ {selEquipe.size} personne{selEquipe.size > 1 ? "s" : ""} sélectionnée{selEquipe.size > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── PLANIFICATION ── */}
      <div style={section}>
        <SectionTitle>📅 Planification des interventions</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="Du" style={{ minWidth: 140 }}>
            <input type="date" name="date_debut" style={inp} />
          </Field>
          <div style={{ display: "flex", alignItems: "center", paddingBottom: 2, fontSize: 20, color: "#94a3b8" }}>→</div>
          <Field label="Au (inclus)" style={{ minWidth: 140 }}>
            <input type="date" name="date_fin" style={inp} />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, paddingBottom: 2, whiteSpace: "nowrap" }}>
            <input type="checkbox" name="ouvrables" defaultChecked onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) {
                const hidden = form.querySelector('input[name="ouvrables_val"]') as HTMLInputElement;
                if (hidden) hidden.value = e.target.checked ? "true" : "false";
              }
            }} />
            Jours ouvrables uniquement
          </label>
          <input type="hidden" name="ouvrables" value="true" />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 10 }}>
          <Field label="Heure de départ" style={{ minWidth: 120 }}>
            <input type="time" name="heure_pose" style={inp} />
          </Field>
          <Field label="Créneau" style={{ minWidth: 160 }}>
            <select name="creneau_pose" defaultValue="journee" style={inp}>
              <option value="journee">Journée entière</option>
              <option value="matin">Matin</option>
              <option value="apres_midi">Après-midi</option>
            </select>
          </Field>
          <Field label="Lieu / Adresse de pose" style={{ flex: 1, minWidth: 200 }}>
            <input name="lieu_pose" placeholder="Adresse du chantier…" style={inp} />
          </Field>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
          ℹ️ Les affectations sont créées automatiquement pour chaque jour et chaque membre sélectionné.
        </div>
      </div>

      {/* ── SUBMIT ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button type="submit" disabled={pending} style={btnAdd}>
          {pending ? "Création en cours…" : "+ Créer le chantier"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: "#39424e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6b7686", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const section: React.CSSProperties = {
  background: "#fafbfc",
  border: "1px solid #e7e9ee",
  borderRadius: 10,
  padding: "12px 14px",
  marginBottom: 10,
};
const inp: React.CSSProperties = {
  padding: "8px 10px", border: "1px solid #e7e9ee", borderRadius: 8,
  fontSize: 13, width: "100%", boxSizing: "border-box", background: "#fff",
};
const btnAdd: React.CSSProperties = {
  border: 0, background: "#1f9d55", color: "#fff",
  borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
