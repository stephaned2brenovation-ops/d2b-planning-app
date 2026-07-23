"use client";

import { useRouter } from "next/navigation";
import { mondayOf, toISO, weekLabel } from "@/lib/dates";

export default function WeekNav({ refISO }: { refISO: string }) {
  const router = useRouter();
  const ref = new Date(refISO + "T00:00:00");

  function go(deltaWeeks: number) {
    const m = mondayOf(ref);
    m.setDate(m.getDate() + deltaWeeks * 7);
    router.push(`/?week=${toISO(m)}`);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <button onClick={() => go(-1)} style={arrow}>‹</button>
      <strong style={{ fontSize: 15 }}>{weekLabel(ref)}</strong>
      <button onClick={() => go(1)} style={arrow}>›</button>
      <button onClick={() => router.push("/")} style={{ ...arrow, width: "auto", padding: "0 12px", fontSize: 13 }}>
        Aujourd&apos;hui
      </button>
    </div>
  );
}

const arrow: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid #e7e9ee",
  background: "#fff", cursor: "pointer", fontSize: 15,
};
