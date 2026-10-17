import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { monetizeConfig } from "@/../monetize.config";

export const metadata: Metadata = {
  title: `${monetizeConfig.tool.name} | Payments + Auth + Hosting Wrapper`,
  description: monetizeConfig.tool.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
