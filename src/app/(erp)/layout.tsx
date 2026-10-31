import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import ErpLayoutClient from "@/components/ErpLayoutClient";

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirPermisoPagina();
  return <ErpLayoutClient usuario={usuario}>{children}</ErpLayoutClient>;
}
