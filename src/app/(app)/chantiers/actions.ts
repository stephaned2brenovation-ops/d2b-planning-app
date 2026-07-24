"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Génère toutes les dates entre debut et fin (inclus).
 *  Si ouvrables=true, ignore samedis (6) et dimanches (0). */
function plage(debut: string, fin: string, ouvrables: boolean): string[] {
  const dates: string[] = [];
  const cur = new Date(debut + "T00:00:00");
  const end = new Date(fin + "T00:00:00");
  while (cur <= end) {
    const dow = cur.getDay();
    if (!ouvrables || (dow !== 0 && dow !== 6)) {
      // Utiliser les composantes locales pour éviter le décalage UTC (France UTC+1/+2)
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function addChantier(formData: FormData) {
  const client_nom = String(formData.get("client_nom") || "").trim();
  if (!client_nom) return;

  const equipe_ids    = formData.getAll("equipe_ids").map(String).filter(Boolean);
  const date_debut    = String(formData.get("date_debut") || "").trim();
  const date_fin      = String(formData.get("date_fin")   || "").trim() || date_debut;
  const ouvrables     = formData.get("ouvrables") !== "false"; // true par défaut
  const heure_pose    = String(formData.get("heure_pose")    || "").trim() || null;
  const lieu_pose     = String(formData.get("lieu_pose")     || "").trim() || null;
  const creneau_pose  = (String(formData.get("creneau_pose") || "journee")) as "journee" | "matin" | "apres_midi";
  const notes         = String(formData.get("notes") || "").trim() || null;

  const supabase = createClient();
  const { data: chantier } = await supabase.from("chantiers").insert({
    client_nom,
    designation:  String(formData.get("designation")  || "") || null,
    ville:        String(formData.get("ville")         || "") || null,
    adresse:      String(formData.get("adresse")       || "") || null,
    contact_tel:  String(formData.get("contact_tel")   || "") || null,
    statut:       String(formData.get("statut")        || "a_planifier"),
    renfort:      formData.get("renfort") === "on",
    notes,
    equipe_ids,
  }).select("id").single();

  // Créer une affectation par jour × par membre d'équipe (upsert pour éviter les doublons)
  if (chantier && date_debut && equipe_ids.length > 0) {
    const dates = plage(date_debut, date_fin, ouvrables);
    if (dates.length > 0) {
      await supabase.from("affectations").upsert(
        dates.flatMap((date) =>
          equipe_ids.map((pid) => ({
            profil_id: pid,
            chantier_id: chantier.id,
            date,
            creneau: creneau_pose,
            heure: heure_pose,
            lieu: lieu_pose,
          }))
        ),
        { onConflict: "profil_id,date,creneau" }
      );
    }
  }

  revalidatePath("/chantiers");
  revalidatePath("/");
}

export async function updateChantier(formData: FormData) {
  const id = String(formData.get("id"));
  const equipe_ids = formData.getAll("equipe_ids").map(String).filter(Boolean);
  const supabase = createClient();
  await supabase.from("chantiers").update({
    client_nom:   String(formData.get("client_nom")   || "").trim(),
    designation:  String(formData.get("designation")  || "") || null,
    ville:        String(formData.get("ville")         || "") || null,
    adresse:      String(formData.get("adresse")       || "") || null,
    contact_tel:  String(formData.get("contact_tel")   || "") || null,
    statut:       String(formData.get("statut")        || "a_planifier"),
    renfort:      formData.get("renfort") === "on",
    notes:        String(formData.get("notes")         || "") || null,
    equipe_ids,
  }).eq("id", id);

  // Re-planification optionnelle : si une plage est fournie, créer les affectations
  const date_debut = String(formData.get("date_debut") || "").trim();
  if (date_debut && equipe_ids.length > 0) {
    const date_fin     = String(formData.get("date_fin") || "").trim() || date_debut;
    const ouvrables    = formData.get("ouvrables") !== "false";
    const heure_pose   = String(formData.get("heure_pose")   || "").trim() || null;
    const lieu_pose    = String(formData.get("lieu_pose")    || "").trim() || null;
    const creneau_pose = (String(formData.get("creneau_pose") || "journee")) as "journee" | "matin" | "apres_midi";
    const dates = plage(date_debut, date_fin, ouvrables);
    if (dates.length > 0) {
      await supabase.from("affectations").upsert(
        dates.flatMap((date) =>
          equipe_ids.map((pid) => ({
            profil_id: pid, chantier_id: id, date,
            creneau: creneau_pose, heure: heure_pose, lieu: lieu_pose,
          }))
        ),
        { onConflict: "profil_id,date,creneau" }
      );
    }
  }

  revalidatePath("/chantiers");
  revalidatePath("/");
}

export async function deleteChantier(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = createClient();
  await supabase.from("chantiers").delete().eq("id", id);
  revalidatePath("/chantiers");
  revalidatePath("/");
}
