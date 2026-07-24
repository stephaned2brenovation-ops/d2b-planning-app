export const dynamic = "force-dynamic";

import Link from "next/link";
import WeekNav from "@/components/WeekNav";
import PlanningEditor from "@/components/PlanningEditor";
import PlanningChantiers from "@/components/PlanningChantiers";
import PlanningTabNav from "@/components/PlanningTabNav";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import { getWeek, getProfils, getMyProfil } from "@/lib/queries";
import { copyPreviousWeek } from "./planning-actions";
import { weekDays, toISO, ddmm, JOURS, mondayOf } from "@/lib/dates";
import { estBureau } from "@/lib/types";
import { IconCopy, IconBuilding } from "@/components/icons";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: { week?: string; vue?: string };
}) {
  const vueParam = searchParams.vue ?? "chantiers"; // "chantiers" | "equipes"
  const ref = searchParams.week ? new Date(searchParams.week + "T00:00:00") : new Date();
  const days = weekDays(ref);
  const lundiISO = toISO(days[0]);
  const dimISO   = toISO(days[6]);

  const [{ chantiers, affectations, rdv, presence, livraisons, prochaines }, profils, moi] = await Promise.all([
    getWeek(lundiISO, dimISO),
    getProfils(),
    getMyProfil(),
  ]);

  const editable = estBureau(moi?.role);
  // Les ouvriers du bâtiment (non-bureau) voient uniquement les chantiers
  const vue = editable ? vueParam : "chantiers";

  const slim     = (list: typeof profils) => list.map((x) => ({ id: x.id, nom: x.nom, couleur: x.couleur }));
  const slimFull = (list: typeof profils) => list.map((x) => ({ id: x.id, nom: x.nom, couleur: x.couleur, metier: x.metier }));

  // ── Groupement équipes ──
  const byMetier = (m: string) => slim(profils.filter((p) => p.metier === m));

  const commerciaux    = [...byMetier("Commercial"), ...byMetier("Direction")];
  const administration = [...byMetier("Secrétariat"), ...byMetier("Comptabilité")];

  // Ouvriers du bâtiment = personnel terrain (role poseur ou macon), classés par métier
  const terrain = profils.filter((p) => p.role === "poseur" || p.role === "macon");
  const ORDRE_METIER = ["Poseur", "Maçon", "Plombier", "Électricien", "Carreleur", "Apprenti"];
  const metiersPresents = Array.from(new Set(terrain.map((p) => p.metier || "Autre")));
  metiersPresents.sort((a, b) => {
    const ia = ORDRE_METIER.indexOf(a); const ib = ORDRE_METIER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const ouvriers = metiersPresents.map((metier) => ({
    metier,
    personnes: slim(terrain.filter((p) => (p.metier || "Autre") === metier)),
  }));

  // Équipe terrain pour la vue chantiers (avec métier pour affichage)
  const equipe = slimFull(terrain);

  const daysData = days.map((d, i) => ({
    iso: toISO(d), label: JOURS[i], ddmm: ddmm(d), weekend: i > 4,
  }));

  const chantiersData = chantiers.map((c) => ({
    id: c.id, client_nom: c.client_nom, ville: c.ville, adresse: c.adresse,
    designation: c.designation, contact_tel: c.contact_tel, statut: c.statut,
    renfort: c.renfort ?? false, notes: c.notes ?? null,
    equipe_ids: c.equipe_ids ?? [],
  }));

  const affData = affectations.map((a) => ({
    id: a.id, profil_id: a.profil_id, date: a.date, chantier_id: a.chantier_id,
    client_nom: a.chantiers?.client_nom ?? "—",
    heure: a.heure ?? null, lieu: a.lieu ?? null, creneau: a.creneau ?? null,
  }));

  return (
    <div>
      <RealtimeRefresh />

      {/* ── Barre de navigation ── */}
      <div className="planning-bar" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        {/* Tabs */}
        <PlanningTabNav vue={vue} bureau={editable} />

        {/* WeekNav */}
        <WeekNav refISO={toISO(mondayOf(ref))} />

        <div style={{ flex: 1 }} />

        {editable && (
          <>
            <form action={copyPreviousWeek}>
              <input type="hidden" name="monday" value={lundiISO} />
              <button style={{ fontSize: 13, background: "#4c5766", color: "#fff", padding: "8px 12px", borderRadius: 8, border: 0, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconCopy size={13} /> Dupliquer la semaine préc.
              </button>
            </form>
            <Link href="/chantiers" style={{ fontSize: 13, background: "#d0212f", color: "#fff", padding: "8px 12px", borderRadius: 8, textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconBuilding size={13} /> Gérer les chantiers
            </Link>
          </>
        )}
      </div>

      {/* ── Vue CHANTIERS ── */}
      {vue === "chantiers" && (
        <>
          <PlanningChantiers
            days={daysData}
            chantiers={chantiersData}
            affectations={affData}
            equipe={equipe}
            editable={editable}
            prochaines={prochaines}
          />
          {editable && (
            <p className="mob-hide" style={{ color: "#64748b", fontSize: 12, marginTop: 10 }}>
              Astuce : cliquez sur &quot;+ Ajouter&quot; dans une cellule pour affecter des membres à ce chantier ce jour-là.
            </p>
          )}
        </>
      )}

      {/* ── Vue ÉQUIPES ── */}
      {vue === "equipes" && (
        <>
          <PlanningEditor
            editable={editable}
            days={daysData}
            commerciaux={commerciaux}
            administration={administration}
            ouvriers={ouvriers}
            chantiers={chantiers.map((c) => ({
              id: c.id, client_nom: c.client_nom, ville: c.ville,
              adresse: c.adresse, designation: c.designation, statut: c.statut,
            }))}
            affectations={affData}
            rdv={rdv.map((r) => ({ id: r.id, profil_id: r.profil_id, date: r.date, titre: r.titre, heure: r.heure, lieu: r.lieu ?? null }))}
            presence={presence.map((p) => ({ profil_id: p.profil_id, date: p.date, lieu: p.lieu }))}
            livraisons={livraisons.map((l) => ({ date: l.date, fournisseur: l.fournisseur, description: l.description }))}
          />
          {editable && (
            <p className="mob-hide" style={{ color: "#64748b", fontSize: 12, marginTop: 10 }}>
              Astuce : glissez un chantier sur une case ou utilisez le ＋ dans chaque cellule.
            </p>
          )}
        </>
      )}
    </div>
  );
}
