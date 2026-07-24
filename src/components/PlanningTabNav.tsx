"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function PlanningTabNav({ vue }: { vue: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function goTo(v: string) {
    const p = new URLSearchParams(params.toString());
    p.set("vue", v);
    router.push(`/?${p.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 3, background: "#e2e8f0", borderRadius: 11, padding: 4, flexShrink: 0 }}>
      <Tab active={vue === "chantiers"} onClick={() => goTo("chantiers")}>📋 Chantiers</Tab>
      <Tab active={vue === "equipes"}   onClick={() => goTo("equipes")}>👥 Équipes</Tab>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 18px",
        borderRadius: 8,
        border: 0,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        background: active ? "#fff" : "transparent",
        color: active ? "#1e293b" : "#64748b",
        boxShadow: active ? "0 1px 4px rgba(0,0,0,.1)" : "none",
        transition: "all .15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
