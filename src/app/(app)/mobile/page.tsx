export const dynamic = "force-dynamic";
import { getMyProfil, getWeek } from "@/lib/queries";
import { weekDays, toISO } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/types";
import MonPlanning from "@/components/MonPlanning";

export default async function MobilePage() {
  const profil = await getMyProfil();
  if (!profil) return null;

  // Plage assez large pour couvrir la semaine courante ET le mois courant
  const today = new Date();
  const days = weekDays(today);
  const moisDebut = new Date(today.getFullYear(), today.getMonth(), 1);
  const moisFin   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const debut = days[0] < moisDebut ? days[0] : moisDebut;
  const fin   = days[6] > moisFin   ? days[6] : moisFin;

  const { affectations, rdv, relances } = await getWeek(toISO(debut), toISO(fin));

  const mesAff = affectations
    .filter((a) => a.profil_id === profil.id)
    .map((a) => ({
      id: a.id, date: a.date,
      client_nom: a.chantiers?.client_nom ?? "—",
      ville: a.chantiers?.ville ?? null,
      adresse: a.chantiers?.adresse ?? null,
      creneau: a.creneau, heure: a.heure,
    }));

  const mesRdv = rdv
    .filter((r) => r.profil_id === profil.id)
    .map((r) => ({ id: r.id, date: r.date, titre: r.titre, heure: r.heure, lieu: r.lieu ?? null }));

  const mesRelances = relances
    .filter((r) => r.profil_id === profil.id)
    .map((r) => ({
      id: r.id, date: r.date, client_nom: r.client_nom,
      client_email: r.client_email, client_tel: r.client_tel,
      canal: r.canal, heure: r.heure, objet: r.objet, message: r.message, statut: r.statut,
    }));

  return (
    <MonPlanning
      profil={{ id: profil.id, nom: profil.nom, couleur: profil.couleur, roleLabel: ROLE_LABEL[profil.role] }}
      affectations={mesAff}
      rdv={mesRdv}
      relances={mesRelances}
    />
  );
}
