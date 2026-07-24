"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Creneau, StatutChantier } from "@/lib/types";

// Affecte (ou déplace) un poseur/maçon sur un chantier, un jour donné.
export async function assignAffectation(
  profilId: string,
  chantierId: string,
  date: string,
  creneau: Creneau = "journee",
  heure: string | null = null,
  lieu: string | null = null,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("affectations")
    .upsert(
      { profil_id: profilId, chantier_id: chantierId, date, creneau, heure, lieu },
      { onConflict: "profil_id,date,creneau" },
    );
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function removeAffectation(id: string) {
  const supabase = createClient();
  await supabase.from("affectations").delete().eq("id", id);
  revalidatePath("/");
}

export async function setStatut(chantierId: string, statut: StatutChantier) {
  const supabase = createClient();
  await supabase.from("chantiers").update({ statut }).eq("id", chantierId);
  revalidatePath("/");
  revalidatePath("/chantiers");
}

export async function addRdv(
  profilId: string,
  date: string,
  titre: string,
  heure: string | null,
  lieu: string | null,
) {
  if (!titre.trim()) return;
  const supabase = createClient();
  await supabase.from("rdv").insert({
    profil_id: profilId, date, titre: titre.trim(),
    heure: heure || null, lieu: lieu || null,
  });
  revalidatePath("/");
}

export async function removeRdv(id: string) {
  const supabase = createClient();
  await supabase.from("rdv").delete().eq("id", id);
  revalidatePath("/");
}

// Copie les affectations + présence magasin de la semaine précédente sur la semaine courante.
export async function copyPreviousWeek(formData: FormData) {
  const monday = String(formData.get("monday")); // lundi de la semaine courante (YYYY-MM-DD)
  const supabase = createClient();
  const shift = (iso: string, days: number) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    // Composantes locales — évite le décalage UTC (fuseau France)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const prevLundi = shift(monday, -7);
  const prevDim = shift(monday, -1);

  const { data: aff } = await supabase
    .from("affectations")
    .select("profil_id, chantier_id, date, creneau")
    .gte("date", prevLundi).lte("date", prevDim);
  if (aff?.length) {
    await supabase.from("affectations").upsert(
      aff.map((a) => ({ ...a, date: shift(a.date, 7) })),
      { onConflict: "profil_id,date,creneau", ignoreDuplicates: true },
    );
  }

  const { data: pres } = await supabase
    .from("presence_magasin")
    .select("profil_id, date, creneau, lieu")
    .gte("date", prevLundi).lte("date", prevDim);
  if (pres?.length) {
    await supabase.from("presence_magasin").upsert(
      pres.map((p) => ({ ...p, date: shift(p.date, 7) })),
      { onConflict: "profil_id,date,creneau", ignoreDuplicates: true },
    );
  }
  revalidatePath("/");
}

// Affecte plusieurs profils sur un même chantier pour un jour donné (depuis la vue chantiers)
export async function assignEquipeChantier(
  chantierId: string,
  profilIds: string[],
  date: string,
  creneau: Creneau = "journee",
  heure: string | null = null,
  lieu: string | null = null,
) {
  if (!profilIds.length) return;
  const supabase = createClient();
  await supabase.from("affectations").upsert(
    profilIds.map((pid) => ({
      profil_id: pid, chantier_id: chantierId, date, creneau, heure, lieu,
    })),
    { onConflict: "profil_id,date,creneau" },
  );
  revalidatePath("/");
}

// Présence magasin (Stéphane / Max au showroom)
export async function setPresence(profilId: string, date: string, lieu: "magasin" | "rdv_ext" | "") {
  const supabase = createClient();
  if (!lieu) {
    await supabase.from("presence_magasin").delete()
      .eq("profil_id", profilId).eq("date", date).eq("creneau", "journee");
  } else {
    await supabase.from("presence_magasin").upsert(
      { profil_id: profilId, date, creneau: "journee", lieu },
      { onConflict: "profil_id,date,creneau" },
    );
  }
  revalidatePath("/");
}
