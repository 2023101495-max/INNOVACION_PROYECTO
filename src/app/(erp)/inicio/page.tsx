import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import InicioClient from "./InicioClient";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ denegado?: string; modulo?: string }>;
}) {
  const usuario = await exigirPermisoPagina();
  const params = await searchParams;
  const accesoDenegado = params?.denegado === "1";

  return (
    <InicioClient
      usuario={usuario}
      accesoDenegado={accesoDenegado}
      modulo={params?.modulo}
    />
  );
}
