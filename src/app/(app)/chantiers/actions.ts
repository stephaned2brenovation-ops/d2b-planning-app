"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addChantier(formData: FormData) {
  const client_nom = String(formData.get("client_nom") || "").trim();
  if (!client_nom) return;
  const equipe_ids = formData.getAll("equipe_ids").map(String).filter(Boolean);
  const supabase = createClient();
  await supabase.from("chantiers").insert({
    client_nom,
    designation: String(formData.get("designation") || "") || null,
    ville: String(formData.get("ville") || "") || null,
    adresse: String(formData.get("adresse") || "") || null,
    contact_tel: String(formData.get("contact_tel") || "") || null,
    statut: String(formData.get("statut") || "a_planifier"),
    renfort: formData.get("renfort") === "on",
    equipe_ids,
  });
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
