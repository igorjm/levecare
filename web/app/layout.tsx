import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeveCare — Cuidado médico para emagrecer (demo)",
  description:
    "Projeto de demonstração: telehealth de emagrecimento para o Brasil com Java, Go e AWS serverless.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
