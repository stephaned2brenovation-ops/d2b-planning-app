"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link href={href} style={{
      color: active ? "#fff" : "#b8cce0",
      textDecoration: "none",
      padding: "6px 13px",
      borderRadius: 7,
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      background: active ? "rgba(255,255,255,0.15)" : "transparent",
      transition: "background .15s, color .15s",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    }}>
      {children}
    </Link>
  );
}
