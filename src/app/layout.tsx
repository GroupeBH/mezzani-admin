import type { Metadata } from "next";
import "./globals.css";
import { BackOfficeShell } from "@/components/layout/back-office-shell";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "MEZANI Admin",
  description: "Commandes, caisse et stocks pour les établissements de Kinshasa.",
  manifest: "/manifest.webmanifest",
  applicationName: "MEZANI",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MEZANI" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <BackOfficeShell>{children}</BackOfficeShell>
        </Providers>
      </body>
    </html>
  );
}
