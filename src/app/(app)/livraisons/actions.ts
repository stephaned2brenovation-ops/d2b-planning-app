"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addLivraison(formData: FormData) {
  const fournisseur = String(formData.get("fournisseur") || "").trim();
  const date = String(formData.get("date") || "");
  if (!fournisseur || !date) return;
  const supabase = createClient();
  await supabase.from("livraisons").insert({
    date, fournisseur,
    description: String(formData.get("description") || "") || null,
    chantier_id: String(formData.get("chantier_id") || "") || null,
    statut: String(formData.get("statut") || "attendue"),
  });
  revalidatePath("/livraisons");
  revalidatePath("/");
}

export async function toggleLivraison(formData: FormData) {
  const id = String(formData.get("id"));
  const statut = String(formData.get("statut")) === "recue" ? "attendue" : "recue";
  const supabase = createClient();
  await supabase.from("livraisons").update({ statut }).eq("id", id);
  revalidatePath("/livraisons");
  revalidatePath("/");
}

export async function deleteLivraison(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = createClient();
  await supabase.from("livraisons").delete().eq("id", id);
  revalidatePath("/livraisons");
  revalidatePath("/");
}
