export type Role = "direction" | "secretariat" | "commercial" | "poseur" | "macon";
export type StatutChantier = "a_planifier" | "en_cours" | "termine" | "sav";
export type Creneau = "journee" | "matin" | "apres_midi";

// Métiers affichés dans le personnel (indépendant des droits)
export const METIER_OPTIONS = [
  "Direction",
  "Secrétariat",
  "Commercial",
  "Comptabilité",
  "Poseur",
  "Maçon",
] as const;

// Niveaux d'accès — mappés sur le champ `role` en base pour la sécurité RLS
export const ACCES_OPTIONS: { label: string; role: Role; description: string }[] = [
  { label: "Administration", role: "direction",   description: "Accès total + gestion du personnel" },
  { label: "Modifier",       role: "secretariat", description: "Crée et modifie planning, RDV, livraisons" },
  { label: "Créer",          role: "commercial",  description: "Gère ses propres RDV" },
  { label: "Lecture",        role: "poseur",      description: "Consultation uniquement" },
];

export interface Profil {
  id: string;
  user_id: string | null;
  nom: string;
  role: Role;
  metier: string | null;   // intitulé métier libre (direction, comptabilité…)
  email: string | null;
  telephone: string | null;
  couleur: string | null;
  actif: boolean;
}

export interface Chantier {
  id: string;
  client_nom: string;
  designation: string | null;
  ville: string | null;
  adresse: string | null;
  contact_tel: string | null;
  statut: StatutChantier;
  renfort: boolean;
  notes: string | null;
  equipe_ids: string[];   // profil IDs des poseurs/maçons assignés
}

export interface Affectation {
  id: string;
  chantier_id: string;
  profil_id: string;
  date: string; // YYYY-MM-DD
  creneau: Creneau;
  chantiers?: Chantier;
  profils?: Profil;
}

export interface Rdv {
  id: string;
  profil_id: string;
  date: string;
  heure: string | null;
  titre: string;
  lieu: string | null;
  notes: string | null;
  profils?: Profil;
}

export type PresenceLieu = "magasin" | "rdv_ext";

export interface Presence {
  id: string;
  profil_id: string;
  date: string;
  creneau: Creneau;
  lieu: PresenceLieu;
}

export interface Livraison {
  id: string;
  date: string;
  fournisseur: string;
  description: string | null;
  chantier_id: string | null;
  statut: "attendue" | "recue";
  chantiers?: Chantier;
}

export const ROLE_LABEL: Record<Role, string> = {
  direction: "Administration",
  secretariat: "Secrétariat",
  commercial: "Commercial",
  poseur: "Poseur",
  macon: "Maçon",
};

export const STATUT_LABEL: Record<StatutChantier, string> = {
  a_planifier: "À planifier",
  en_cours: "En cours",
  termine: "Terminé",
  sav: "SAV",
};

export const STATUT_COLOR: Record<StatutChantier, string> = {
  a_planifier: "#8892a0",
  en_cours: "#2e77c9",
  termine: "#1f9d55",
  sav: "#d0212f",
};

export function estBureau(role?: Role | null) {
  return role === "secretariat" || role === "direction";
}
