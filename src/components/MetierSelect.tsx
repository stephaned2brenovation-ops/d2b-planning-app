"use client";

import { useState } from "react";
import { METIER_OPTIONS } from "@/lib/types";

const STANDARD = METIER_OPTIONS as readonly string[];

interface Props {
  defaultValue?: string | null;
  required?: boolean;
}

export default function MetierSelect({ defaultValue, required }: Props) {
  // Si la valeur par défaut n'est pas dans les options standards, c'est un poste personnalisé
  const isCustom = defaultValue && !STANDARD.includes(defaultValue);
  const [mode, setMode]     = useState<"select" | "custom">(isCustom ? "custom" : "select");
  const [selected, setSelected] = useState(isCustom ? "" : (defaultValue ?? ""));
  const [custom, setCustom]   = useState(isCustom ? (defaultValue ?? "") : "");

  // La vraie valeur envoyée au formulaire
  const value = mode === "custom" ? custom : selected;

  return (
    <div style={{ position: "relative" }}>
      {/* Champ caché qui porte name="metier" — toujours présent */}
      <input type="hidden" name="metier" value={value} />

      {mode === "select" ? (
        <select
          value={selected}
          onChange={(e) => {
            if (e.target.value === "__autre__") {
              setMode("custom");
              setCustom("");
            } else {
              setSelected(e.target.value);
            }
          }}
          required={required}
          style={inp}
        >
          <option value="">— Choisir un poste —</option>
          {STANDARD.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
          <option value="__autre__">✏️ Autre (créer un poste…)</option>
        </select>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Nom du poste…"
            required={required}
            style={{ ...inp, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => { setMode("select"); setSelected(""); setCustom(""); }}
            title="Revenir à la liste"
            style={{
              padding: "6px 10px", border: "1px solid #e7e9ee", borderRadius: 8,
              background: "#f4f5f7", cursor: "pointer", fontSize: 13, color: "#6b7686",
              flexShrink: 0,
            }}
          >↩</button>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #e7e9ee", borderRadius: 8,
  fontSize: 13, width: "100%", boxSizing: "border-box", background: "#fff",
};
