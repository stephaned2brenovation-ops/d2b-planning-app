import Image from "next/image";
import { getMyProfil } from "@/lib/queries";
import { estBureau, ROLE_LABEL } from "@/lib/types";
import { signOut } from "./actions";
import NavLink from "@/components/NavLink";
import { IconCalendar, IconPhone, IconBuilding, IconTruck, IconUsers, IconBell } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profil = await getMyProfil();

  if (!profil) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
        <div style={{ maxWidth: 420, background: "#fff", padding: "32px 28px", borderRadius: 16, textAlign: "center", boxShadow: "0 8px 30px rgba(20,30,50,.1)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Compte non rattaché</h2>
          <p style={{ color: "#6b7686", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
            Votre adresse email n&apos;est pas encore associée à un profil.<br />
            Demandez à l&apos;administration de vous ajouter, puis reconnectez-vous.
          </p>
          <form action={signOut}>
            <button style={{ padding: "10px 20px", borderRadius: 10, border: 0, background: "#39424e", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const bureau = estBureau(profil.role);
  const initiales = profil.nom.slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(135deg, #2c3540 0%, #39424e 100%)",
        boxShadow: "0 2px 12px rgba(0,0,0,.18)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Barre colorée en haut */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #d0212f 0%, #e05a67 50%, #d0212f 100%)" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 18px", display: "flex", alignItems: "center", gap: 12, height: 56 }}>
          {/* Logo */}
          <a href="/" className="logo-link" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Image src="/logo-d2b-maison.jpg" alt="D2B Rénovation" height={40} width={162}
                   style={{ objectFit: "contain", objectPosition: "left", display: "block" }} priority />
          </a>

          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.15)", margin: "0 4px" }} />

          {/* Nav */}
          <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <NavLink href="/"><IconCalendar size={14} /> <span className="nav-text">Planning</span></NavLink>
            <NavLink href="/mobile"><IconPhone size={14} /> <span className="nav-text">Mon planning</span></NavLink>
            {bureau && <NavLink href="/chantiers"><IconBuilding size={14} /> <span className="nav-text">Chantiers</span></NavLink>}
            {bureau && <NavLink href="/livraisons"><IconTruck size={14} /> <span className="nav-text">Livraisons</span></NavLink>}
            {bureau && <NavLink href="/personnel"><IconUsers size={14} /> <span className="nav-text">Personnel</span></NavLink>}
            {bureau && <NavLink href="/notifications"><IconBell size={14} /> <span className="nav-text">Notifs</span></NavLink>}
          </nav>

          <div style={{ flex: 1 }} />

          {/* User badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: profil.couleur ?? "#d0212f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {initiales}
            </div>
            <div className="user-nom" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{profil.nom}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{ROLE_LABEL[profil.role]}</div>
            </div>
          </div>

          <form action={signOut}>
            <button style={{
              background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
              color: "#cbd5e1", padding: "6px 12px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="app-main" style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 18px" }}>
        {children}
      </main>
    </div>
  );
}
