-- ============================================================
--  RELANCES CLIENTS (commerciaux)
--  À exécuter dans Supabase → SQL Editor
-- ============================================================

create table if not exists relances (
  id           uuid primary key default gen_random_uuid(),
  profil_id    uuid not null references profils(id) on delete cascade,
  chantier_id  uuid references chantiers(id) on delete set null,
  client_nom   text not null,
  client_email text,
  client_tel   text,
  -- Canal de relance. 'sms' : envoi manuel pour l'instant,
  -- envoi automatique possible plus tard via Twilio (Edge Function + statut)
  canal        text not null default 'email' check (canal in ('email', 'telephone', 'sms')),
  date         date not null,
  heure        time,
  objet        text,      -- objet de l'email
  message      text,      -- corps email / script téléphone / texte SMS
  statut       text not null default 'a_faire' check (statut in ('a_faire', 'fait')),
  fait_le      timestamptz,
  envoye_le    timestamptz,  -- rempli par Twilio le jour où l'envoi auto est actif
  cree_le      timestamptz not null default now()
);

create index if not exists idx_relances_date   on relances(date);
create index if not exists idx_relances_profil on relances(profil_id);

alter table relances enable row level security;

-- Lecture : tout le monde (authentifié)
create policy lecture_relances on relances
  for select to authenticated using (true);

-- Écriture : le bureau OU le commercial propriétaire
create policy ecr_relances on relances
  for all to authenticated
  using (est_bureau() or profil_id = mon_profil_id())
  with check (est_bureau() or profil_id = mon_profil_id());
