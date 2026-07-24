"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IconBuilding, IconUsers } from "@/components/icons";

export default function PlanningTabNav({ vue, bureau }: { vue: string; bureau: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  function goTo(v: string) {
    const p = new URLSearchParams(params.toString());
    p.set("vue", v);
    router.push(`/?${p.toString()}`);
  }

  // Les ouvriers du bâtiment n'ont accès qu'à la vue Chantiers
  if (!bureau) return null;

  return (
    <div style={{ display: "flex", gap: 3, background: "#e2e8f0", borderRadius: 11, padding: 4, flexShrink: 0 }}>
      <ChantierTab active={vue === "chantiers"} onClick={() => goTo("chantiers")}><IconBuilding size={14} /> Chantiers</ChantierTab>
      <Tab active={vue === "equipes"} onClick={() => goTo("equipes")}><IconUsers size={14} /> D2B</Tab>
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
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

/** Onglet Chantiers — toujours coloré (orange/rouge) pour rester visible */
function ChantierTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 18px",
        borderRadius: 8,
        border: 0,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        background: active ? "#c85a11" : "#e8623a",
        color: "#fff",
        boxShadow: active ? "0 1px 4px rgba(200,90,17,.35)" : "none",
        transition: "all .15s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        opacity: active ? 1 : 0.82,
      }}
    >
      {children}
    </button>
  );
}
