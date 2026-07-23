"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateNotifConfig(formData: FormData) {
  const supabase = createClient();
  await supabase.from("notification_config").update({
    veille_pose: formData.get("veille_pose") === "on",
    rappel_rdv:  formData.get("rappel_rdv")  === "on",
    changement:  formData.get("changement")  === "on",
    livraison:   formData.get("livraison")   === "on",
    heure_envoi: String(formData.get("heure_envoi") || "18:00"),
    sujet_email: String(formData.get("sujet_email") || ""),
    modele_sms:  String(formData.get("modele_email") || ""),   // colonne DB conservée
  }).eq("id", 1);
  revalidatePath("/notifications");
}
