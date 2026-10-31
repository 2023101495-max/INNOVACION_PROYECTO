import type { Metadata } from "next";
import "./globals.css";
import AntdProvider from "@/components/AntdProvider";

export const metadata: Metadata = {
  title: "ERP TecnoCel — Gestión Empresarial",
  description:
    "Sistema ERP para comercializadora de celulares y productos tecnológicos — UCSS Nueva Cajamarca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
