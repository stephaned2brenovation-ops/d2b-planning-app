export const dynamic = "force-dynamic";
import { getMyProfil, getWeek } from "@/lib/queries";
import { weekDays, toISO, ddmm, JOURS } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/types";

export default async function MobilePage() {
  const profil = await getMyProfil();
  if (!profil) return null;

  const today = new Date();
  const days = weekDays(today);
  const { affectations, rdv } = await getWeek(toISO(days[0]), toISO(days[6]));

  const mesAff = affectations.filter((a) => a.profil_id === profil.id);
  const mesRdv = rdv.filter((r) => r.profil_id === profil.id);
  const todayISO = toISO(today);

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div style={{ background: "#39424e", color: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{ROLE_LABEL[profil.role]}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{profil.nom}</div>
      </div>

      {days.map((d, i) => {
        const di = toISO(d);
        const aff = mesAff.filter((a) => a.date === di);
        const rd = mesRdv.filter((r) => r.date === di);
        if (aff.length === 0 && rd.length === 0) return null;
        const isToday = di === todayISO;
        return (
          <div key={di} style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, border: isToday ? "2px solid #d0212f" : "1px solid #e7e9ee" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? "#d0212f" : "#6b7686", textTransform: "uppercase" }}>
              {JOURS[i]} {ddmm(d)} {isToday ? "· aujourd’hui" : ""}
            </div>
            {aff.map((a) => (
              <div key={a.id} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{a.chantiers?.client_nom}</div>
                <div style={{ fontSize: 13, color: "#6b7686" }}>
                  📍 {a.chantiers?.ville ?? "—"} · {a.creneau.replace("_", "-")}
                </div>
                {a.chantiers?.adresse && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(a.chantiers.adresse)}`}
                     style={{ fontSize: 13, color: "#2e77c9" }}>🧭 Itinéraire</a>
                )}
              </div>
            ))}
            {rd.map((r) => (
              <div key={r.id} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {r.heure ? r.heure.slice(0, 5) + " · " : ""}{r.titre}
                </div>
                <div style={{ fontSize: 13, color: "#6b7686" }}>{r.lieu}</div>
              </div>
            ))}
          </div>
        );
      })}

      {mesAff.length === 0 && mesRdv.length === 0 && (
        <p style={{ color: "#6b7686", textAlign: "center", marginTop: 30 }}>
          Aucune affectation cette semaine.
        </p>
      )}
    </div>
  );
}
