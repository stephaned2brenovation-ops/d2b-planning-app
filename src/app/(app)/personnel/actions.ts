"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PALETTE = [
  "#6d3bd1", "#1f6fb2", "#0f8a6f", "#c85a11", "#b5297f", "#d6342b", "#2e77c9",
  "#1f9d55", "#cf8a00", "#7d3cc0", "#0f9d8f", "#d2691e", "#4457c4", "#8a6d3b",
  "#c2185b", "#558b2f", "#ad1457", "#00838f", "#33691e", "#5f6b7a",
];
function couleurPour(nom: string) {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function normalTel(v: string) {
  let t = v.replace(/[^\d+]/g, "");
  if (t.startsWith("0")) t = "+33" + t.slice(1);
  return t || "";
}

export async function addProfil(formData: FormData) {
  const nom    = String(formData.get("nom")    || "").trim();
  if (!nom) return;
  const role   = String(formData.get("role")   || "poseur");
  const metier = String(formData.get("metier") || "").trim() || null;
  const email  = String(formData.get("email")  || "").trim() || null;
  const tel    = normalTel(String(formData.get("telephone") || ""));
  const supabase = createClient();
  await supabase.from("profils").insert({
    nom, role, metier, email, telephone: tel || null, couleur: couleurPour(nom),
  });
  revalidatePath("/personnel");
  revalidatePath("/");
}

export async function updateProfil(formData: FormData) {
  const id     = String(formData.get("id"));
  const nom    = String(formData.get("nom")    || "").trim();
  const role   = String(formData.get("role")   || "poseur");
  const metier = String(formData.get("metier") || "").trim() || null;
  const email  = String(formData.get("email")  || "").trim() || null;
  const tel    = normalTel(String(formData.get("telephone") || ""));
  const supabase = createClient();
  await supabase.from("profils")
    .update({ nom, role, metier, email, telephone: tel || null })
    .eq("id", id);
  revalidatePath("/personnel");
  revalidatePath("/");
}

export async function deleteProfil(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = createClient();
  await supabase.from("profils").update({ actif: false }).eq("id", id);
  revalidatePath("/personnel");
  revalidatePath("/");
}
