export const dynamic = "force-dynamic";

import Link from "next/link";
import WeekNav from "@/components/WeekNav";
import PlanningEditor from "@/components/PlanningEditor";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import { getWeek, getProfils, getMyProfil } from "@/lib/queries";
import { copyPreviousWeek } from "./planning-actions";
import { weekDays, toISO, ddmm, JOURS, mondayOf } from "@/lib/dates";
import { estBureau } from "@/lib/types";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const ref = searchParams.week ? new Date(searchParams.week + "T00:00:00") : new Date();
  const days = weekDays(ref);
  const lundiISO = toISO(days[0]);
  const dimISO = toISO(days[6]);

  const [{ chantiers, affectations, rdv, presence, livraisons }, profils, moi] = await Promise.all([
    getWeek(lundiISO, dimISO),
    getProfils(),
    getMyProfil(),
  ]);

  const editable = estBureau(moi?.role);
  const slim = (p: typeof profils) => p.map((x) => ({ id: x.id, nom: x.nom, couleur: x.couleur }));

  // Groupement par métier (pas par rôle)
  const byMetier = (m: string) => slim(profils.filter((p) => p.metier === m));

  return (
    <div>
      <RealtimeRefresh />
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <WeekNav refISO={toISO(mondayOf(ref))} />
        <div style={{ flex: 1 }} />
        {editable && (
          <>
            <form action={copyPreviousWeek}>
              <input type="hidden" name="monday" value={lundiISO} />
              <button style={{ fontSize: 13, background: "#4c5766", color: "#fff", padding: "8px 12px", borderRadius: 8, border: 0, fontWeight: 600, cursor: "pointer" }}>
                📑 Dupliquer la semaine précédente
              </button>
            </form>
            <Link href="/chantiers" style={{ fontSize: 13, background: "#d0212f", color: "#fff", padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
              Gérer les chantiers
            </Link>
          </>
        )}
      </div>

      <PlanningEditor
        editable={editable}
        days={days.map((d, i) => ({ iso: toISO(d), label: JOURS[i], ddmm: ddmm(d), weekend: i > 4 }))}
        commerciaux={[...byMetier("Commercial"), ...byMetier("Direction")]}
        administration={[...byMetier("Secrétariat"), ...byMetier("Comptabilité")]}
        menuiseries={byMetier("Poseur")}
        maconnerie={byMetier("Maçon")}
        chantiers={chantiers.map((c) => ({ id: c.id, client_nom: c.client_nom, ville: c.ville, adresse: c.adresse, designation: c.designation, statut: c.statut }))}
        affectations={affectations.map((a) => ({
          id: a.id, profil_id: a.profil_id, date: a.date, chantier_id: a.chantier_id,
          client_nom: a.chantiers?.client_nom ?? "—",
          heure: a.heure ?? null, lieu: a.lieu ?? null,
        }))}
        rdv={rdv.map((r) => ({ id: r.id, profil_id: r.profil_id, date: r.date, titre: r.titre, heure: r.heure }))}
        presence={presence.map((p) => ({ profil_id: p.profil_id, date: p.date, lieu: p.lieu }))}
        livraisons={livraisons.map((l) => ({ date: l.date, fournisseur: l.fournisseur, description: l.description }))}
      />

      <p style={{ color: "#6b7686", fontSize: 12, marginTop: 10 }}>
        {editable
          ? "Astuce : glissez un chantier sur une case, ou utilisez le ＋ dans chaque cellule."
          : "Vue en lecture seule."}
      </p>
    </div>
  );
}
