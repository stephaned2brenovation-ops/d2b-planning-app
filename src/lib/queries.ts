import { createClient } from "@/lib/supabase/server";
import type { Profil, Chantier, Affectation, Rdv, Presence, Livraison, Relance } from "@/lib/types";

export async function getMyProfil(): Promise<Profil | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profils").select("*").eq("user_id", user.id).single();
  return data as Profil | null;
}

export async function getProfils(): Promise<Profil[]> {
  const supabase = createClient();
  const { data } = await supabase.from("profils").select("*").eq("actif", true).order("role").order("nom");
  return (data ?? []) as Profil[];
}

export async function getChantiers(): Promise<Chantier[]> {
  const supabase = createClient();
  const { data } = await supabase.from("chantiers").select("*").order("cree_le", { ascending: false });
  return (data ?? []) as Chantier[];
}

export async function getLivraisons(): Promise<Livraison[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("livraisons")
    .select("*, chantiers(client_nom)")
    .order("date", { ascending: true });
  return (data ?? []) as Livraison[];
}

// Toutes les données d'une semaine (du lundi au dimanche inclus)
export async function getWeek(lundiISO: string, dimancheISO: string) {
  const supabase = createClient();
  const [chantiers, affectations, rdv, presence, livraisons, prochaines, relances] = await Promise.all([
    supabase.from("chantiers").select("*"),
    supabase
      .from("affectations")
      .select("*, chantiers(*), profils(*)")
      .gte("date", lundiISO)
      .lte("date", dimancheISO),
    supabase
      .from("rdv")
      .select("*, profils(*)")
      .gte("date", lundiISO)
      .lte("date", dimancheISO),
    supabase
      .from("presence_magasin")
      .select("*")
      .gte("date", lundiISO)
      .lte("date", dimancheISO),
    supabase
      .from("livraisons")
      .select("*, chantiers(*)")
      .gte("date", lundiISO)
      .lte("date", dimancheISO),
    // Prochaines affectations hors de la semaine courante (pour les chantiers non planifiés)
    supabase
      .from("affectations")
      .select("chantier_id, date")
      .gt("date", dimancheISO)
      .order("date"),
    supabase
      .from("relances")
      .select("*")
      .gte("date", lundiISO)
      .lte("date", dimancheISO),
  ]);
  return {
    chantiers: (chantiers.data ?? []) as Chantier[],
    affectations: (affectations.data ?? []) as Affectation[],
    rdv: (rdv.data ?? []) as Rdv[],
    presence: (presence.data ?? []) as Presence[],
    livraisons: (livraisons.data ?? []) as Livraison[],
    prochaines: (prochaines.data ?? []) as { chantier_id: string; date: string }[],
    relances: (relances.data ?? []) as Relance[],
  };
}

export async function getNotifConfig() {
  const supabase = createClient();
  const { data } = await supabase.from("notification_config").select("*").eq("id", 1).single();
  return data as {
    veille_pose: boolean; rappel_rdv: boolean; changement: boolean; livraison: boolean;
    heure_envoi: string; modele_sms: string; sujet_email: string | null;
  } | null;
}

export async function getRecentNotifs() {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, message, statut, date_concernee, envoye_le, profils(nom)")
    .order("cree_le", { ascending: false })
    .limit(30);
  return (data ?? []) as unknown as {
    id: string; message: string; statut: string;
    date_concernee: string | null; envoye_le: string | null; profils?: { nom: string };
  }[];
}

// Résout un lien SMS /j/{token} vers le profil + la date concernés
export async function getNotificationByToken(token: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("date_prevue, profils(id,nom,role)")
    .eq("lien_token", token)
    .single();
  return data;
}
