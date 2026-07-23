export const dynamic = "force-dynamic";
import { getMyProfil, getNotifConfig, getRecentNotifs } from "@/lib/queries";
import { estBureau } from "@/lib/types";
import { updateNotifConfig } from "./actions";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const moi = await getMyProfil();
  if (!estBureau(moi?.role)) redirect("/");

  const [cfg, notifs] = await Promise.all([getNotifConfig(), getRecentNotifs()]);

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 18 }}>Notifications</h2>
      <p style={{ color: "#6b7686", fontSize: 13, marginTop: -6 }}>
        SMS envoyés la veille de chaque pose ou rendez-vous, avec un lien vers l&apos;application.
      </p>

      <form action={updateNotifConfig} style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginTop: 0 }}>Déclencheurs</h3>
        <Toggle name="veille_pose" on={cfg?.veille_pose ?? true} label="SMS la veille au poseur / maçon (avant chaque pose)" />
        <Toggle name="rappel_rdv" on={cfg?.rappel_rdv ?? true} label="SMS la veille au commercial (avant chaque RDV)" />
        <Toggle name="changement" on={cfg?.changement ?? true} label="Alerte en cas de changement d’affectation" />
        <Toggle name="livraison" on={cfg?.livraison ?? true} label="Alerte livraison fournisseur (secrétariat)" />

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13 }}>Heure d’envoi de la veille</label>
          <input type="time" name="heure_envoi" defaultValue={cfg?.heure_envoi?.slice(0, 5) ?? "18:00"} style={{ padding: "7px 10px", border: "1px solid #e7e9ee", borderRadius: 8 }} />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Modèle du SMS</label>
          <textarea name="modele_sms" rows={3} defaultValue={cfg?.modele_sms ?? ""} style={{ width: "100%", padding: 10, border: "1px solid #e7e9ee", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
          <p style={{ fontSize: 11.5, color: "#6b7686", marginTop: 6 }}>
            Variables : <code>{"{jour}"}</code> <code>{"{chantier}"}</code> <code>{"{ville}"}</code> <code>{"{creneau}"}</code> <code>{"{lien}"}</code> (lien unique vers la fiche du jour).
          </p>
        </div>

        <button style={{ marginTop: 14, border: 0, background: "#39424e", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Enregistrer les réglages
        </button>
      </form>

      <h3 style={{ fontSize: 14 }}>Derniers envois</h3>
      <div style={{ background: "#fff", border: "1px solid #e7e9ee", borderRadius: 12, padding: 8 }}>
        {notifs.length === 0 && <p style={{ color: "#6b7686", padding: 12, margin: 0 }}>Aucun envoi pour le moment. Le premier lot partira le soir configuré, une fois l’Edge Function déployée.</p>}
        {notifs.map((n) => (
          <div key={n.id} style={{ display: "flex", gap: 10, padding: "8px 10px", borderBottom: "1px solid #f4f5f7", fontSize: 12.5 }}>
            <span style={{ ...badge, background: n.statut === "envoye" ? "#e6f2e8" : n.statut === "echec" ? "#fdecee" : "#f4f5f7", color: n.statut === "envoye" ? "#256b31" : n.statut === "echec" ? "#d0212f" : "#6b7686" }}>
              {n.statut}
            </span>
            <div>
              <b>{n.profils?.nom ?? "—"}</b>{n.date_concernee ? ` · ${n.date_concernee}` : ""}
              <div style={{ color: "#6b7686" }}>{n.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ name, on, label }: { name: string; on: boolean; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, padding: "5px 0", cursor: "pointer" }}>
      <input type="checkbox" name={name} defaultChecked={on} style={{ width: 17, height: 17 }} />
      {label}
    </label>
  );
}

const badge: React.CSSProperties = { borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, height: "fit-content", textTransform: "uppercase" };
