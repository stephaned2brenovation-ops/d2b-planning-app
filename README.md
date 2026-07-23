# D2B Planning — application (Next.js + Supabase)

Application de planning des chantiers, RDV et équipes pour D2B Rénovation.

## Stack
- **Next.js 14** (App Router, TypeScript) — déployé sur Vercel
- **Supabase** — base Postgres, authentification par téléphone (OTP SMS), droits RLS
- Notifications SMS la veille via Edge Function + `pg_cron` (voir `../appli-d2b/`)

## Prérequis
1. Avoir exécuté `../appli-d2b/supabase-schema.sql` dans Supabase.
2. Activer l'authentification par **téléphone** (Supabase → Authentication → Providers → Phone).

## Lancer en local
```bash
npm install
cp .env.local.example .env.local   # puis renseigner les 2 clés Supabase
npm run dev                        # http://localhost:3000
```

## Déployer sur Vercel
1. Pousser ce dossier sur un dépôt GitHub.
2. Vercel → New Project → importer le dépôt.
3. Variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

Guide détaillé : `../appli-d2b/GUIDE-DEPLOIEMENT.md`.

## Structure
```
src/
  lib/supabase/   clients (navigateur / serveur / middleware)
  lib/            types, dates, requêtes
  middleware.ts   protège les routes (redirige vers /login)
  app/
    login/        connexion par téléphone (OTP SMS)
    (app)/        espace connecté : planning, mon planning, personnel
    j/[token]/    fiche publique ouverte depuis le lien du SMS
```

## Rôles et droits
Appliqués côté base (RLS) : secrétariat/direction éditent tout, commerciaux gèrent
leurs RDV, poseurs/maçons en lecture seule.

## Fonctionnalités (v1 + P2 + P3)
- Connexion par téléphone (OTP SMS), droits par rôle (RLS)
- Planning éditable : chantiers, affectations (glisser-déposer + menus), RDV, statuts
- Présence magasin, livraisons fournisseurs
- Notifications SMS la veille (config + journal) — Edge Function `../appli-d2b/`
- Temps réel (mise à jour en direct), duplication de semaine
- PWA installable + consultation hors-ligne (service worker `public/sw.js`)
- Détection de conflit d'affectation, confirmations de suppression

## Installer sur mobile
Ouvrir l'adresse de l'appli dans le navigateur du téléphone → menu → « Ajouter à
l'écran d'accueil ». L'appli s'installe et fonctionne comme une application native.

## Amorçage
Créer le premier compte Direction via `../appli-d2b/seed-premier-compte.sql`, puis
gérer tout le personnel depuis l'onglet « Personnel ».

## Idées futures (P4)
- Photos de chantier, vue carte du Var, tableau de bord (charge par poseur), congés/absences
