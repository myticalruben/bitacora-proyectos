import { getChatGPTUser } from "./chatgpt-auth";
import { isOwnerEmail } from "../lib/owner";
import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rubén Alexander — Bitácora de proyectos",
  description: "Proyectos, documentación y aprendizajes de Rubén Alexander.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getChatGPTUser();
  const canManage = isOwnerEmail(user?.email);

  return (
    <html lang="es">
      <body>
        <SiteShell canManage={canManage}>{children}</SiteShell>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
