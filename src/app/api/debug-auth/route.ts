import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "no_user", authErr });
  }

  const { data: profil, error: profilErr } = await supabase
    .from("profils")
    .select("id, nom, email, user_id, role, actif")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    auth_user_id: user.id,
    auth_email: user.email,
    profil,
    profilErr,
  });
}
