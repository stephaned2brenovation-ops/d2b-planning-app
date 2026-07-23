import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "D2B Planning",
  description: "Planning des chantiers et rendez-vous — D2B Rénovation",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "D2B Planning" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#39424e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
