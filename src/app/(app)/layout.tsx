import Link from "next/link";
import Image from "next/image";
import { getMyProfil } from "@/lib/queries";
import { estBureau, ROLE_LABEL } from "@/lib/types";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profil = await getMyProfil();

  if (!profil) {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto", background: "#fff", padding: 24, borderRadius: 14, textAlign: "center" }}>
        <h2>Compte non rattaché</h2>
        <p style={{ color: "#6b7686" }}>
          Votre numéro n&apos;est pas encore enregistré dans le personnel. Demandez au secrétariat
          de vous ajouter, puis reconnectez-vous.
        </p>
        <form action={signOut}><button style={{ padding: "10px 16px", borderRadius: 10, border: 0, background: "#39424e", color: "#fff", cursor: "pointer" }}>Se déconnecter</button></form>
      </div>
    );
  }

  const bureau = estBureau(profil.role);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, background: "#39424e", color: "#fff", padding: "12px 18px", borderRadius: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <Image src="/logo-d2b.png" alt="D2B Rénovation" height={36} width={180} style={{ objectFit: "contain", objectPosition: "left" }} priority />
        </Link>
        <nav style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          <Link href="/" style={navLink}>Planning</Link>
          <Link href="/mobile" style={navLink}>Mon planning</Link>
          {bureau && <Link href="/chantiers" style={navLink}>Chantiers</Link>}
          {bureau && <Link href="/livraisons" style={navLink}>Livraisons</Link>}
          {bureau && <Link href="/personnel" style={navLink}>Personnel</Link>}
          {bureau && <Link href="/notifications" style={navLink}>Notifications</Link>}
        </nav>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, opacity: 0.85 }}>{profil.nom} · {ROLE_LABEL[profil.role]}</span>
        <form action={signOut}>
          <button style={{ background: "rgba(255,255,255,.13)", border: 0, color: "#fff", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Déconnexion</button>
        </form>
      </header>
      <main style={{ marginTop: 16 }}>{children}</main>
    </div>
  );
}

const navLink: React.CSSProperties = {
  color: "#dbe6f2", textDecoration: "none", padding: "7px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600,
};
