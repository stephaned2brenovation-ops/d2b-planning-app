"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { mondayOf, mondayOfISOWeek, weeksInYear, toISO, weekLabel, isoWeek } from "@/lib/dates";

export default function WeekNav({ refISO }: { refISO: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const ref    = new Date(refISO + "T00:00:00");
  const curW   = isoWeek(ref);
  const curY   = ref.getFullYear();

  function push(weekISO: string | null) {
    const p = new URLSearchParams(params.toString());
    if (weekISO) p.set("week", weekISO); else p.delete("week");
    router.push(`/?${p.toString()}`);
  }

  function go(deltaWeeks: number) {
    const m = mondayOf(ref);
    m.setDate(m.getDate() + deltaWeeks * 7);
    push(toISO(m));
  }

  function onSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    push(e.target.value);
  }

  // Générer toutes les semaines : année précédente + année courante + année suivante
  const options: { value: string; label: string; year: number; week: number }[] = [];
  for (let y = curY - 1; y <= curY + 1; y++) {
    const total = weeksInYear(y);
    for (let w = 1; w <= total; w++) {
      const monday = mondayOfISOWeek(y, w);
      options.push({ value: toISO(monday), label: `S${String(w).padStart(2, "0")} · ${y}`, year: y, week: w });
    }
  }

  // Valeur sélectionnée = lundi de la semaine courante
  const selectedValue = toISO(mondayOf(ref));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      <button onClick={() => go(-1)} style={arrow}>‹</button>

      {/* Menu déroulant semaine */}
      <select value={selectedValue} onChange={onSelect} style={sel}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <button onClick={() => go(1)} style={arrow}>›</button>

      {/* Label détaillé */}
      <span style={{ fontSize: 13, color: "#6b7686" }}>{weekLabel(ref)}</span>

      <button onClick={() => router.push("/")}
              style={{ ...arrow, width: "auto", padding: "0 12px", fontSize: 13 }}>
        Aujourd&apos;hui
      </button>
    </div>
  );
}

const arrow: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid #e7e9ee",
  background: "#fff", cursor: "pointer", fontSize: 15, flexShrink: 0,
};

const sel: React.CSSProperties = {
  padding: "6px 10px", border: "1px solid #e7e9ee", borderRadius: 8,
  fontSize: 14, fontWeight: 600, background: "#fff", cursor: "pointer",
  minWidth: 110,
};
