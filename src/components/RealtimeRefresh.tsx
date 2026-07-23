"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Rafraîchit la page dès qu'une donnée du planning change (pour tous les postes).
export default function RealtimeRefresh() {
  const router = useRouter();
  useEffect(() => {
    const sb = createClient();
    const tables = ["affectations", "rdv", "chantiers", "presence_magasin", "livraisons"];
    const channel = sb.channel("planning-live");
    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => router.refresh());
    }
    channel.subscribe();
    return () => { sb.removeChannel(channel); };
  }, [router]);
  return null;
}
