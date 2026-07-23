"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addChantier(formData: FormData) {
  const client_nom = String(formData.get("client_nom") || "").trim();
  if (!client_nom) return;
  const equipe_ids = formData.getAll("equipe_ids").map(String).filter(Boolean);
  const date_pose  = String(formData.get("date_pose") || "").trim();
  const heure_pose = String(formData.get("heure_pose") || "").trim() || null;
  const lieu_pose  = String(formData.get("lieu_pose") || "").trim() || null;
  const creneau_pose = (String(formData.get("creneau_pose") || "journee")) as "journee" | "matin" | "apres_midi";

  const supabase = createClient();
  const { data: chantier } = await supabase.from("chantiers").insert({
    client_nom,
    designation: String(formData.get("designation") || "") || null,
    ville: String(formData.get("ville") || "") || null,
    adresse: String(formData.get("adresse") || "") || null,
    contact_tel: String(formData.get("contact_tel") || "") || null,
    statut: String(formData.get("statut") || "a_planifier"),
    renfort: formData.get("renfort") === "on",
    equipe_ids,
  }).select("id").single();

  // Si une date de pose est planifiée, créer les affectations pour chaque membre d'équipe
  if (chantier && date_pose && equipe_ids.length > 0) {
    await supabase.from("affectations").insert(
      equipe_ids.map((pid) => ({
        profil_id: pid,
        chantier_id: chantier.id,
        date: date_pose,
        creneau: creneau_pose,
        heure: heure_pose,
        lieu: lieu_pose,
      }))
    );
  }

  revalidatePath("/chantiers");
  revalidatePath("/");
}

export async function updateChantier(formData: FormData) {
  const id = String(formData.get("id"));
  const equipe_ids = formData.getAll("equipe_ids").map(String).filter(Boolean);
  const supabase = createClient();
  await supabase.from("chantiers").update({
    client_nom: String(formData.get("client_nom") || "").trim(),
    designation: String(formData.get("designation") || "") || null,
    ville: String(formData.get("ville") || "") || null,
    adresse: String(formData.get("adresse") || "") || null,
    contact_tel: String(formData.get("contact_tel") || "") || null,
    statut: String(formData.get("statut") || "a_planifier"),
    renfort: formData.get("renfort") === "on",
    equipe_ids,
  }).eq("id", id);
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
