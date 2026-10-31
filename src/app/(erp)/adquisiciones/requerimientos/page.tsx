import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import RequerimientosClient from "./RequerimientosClient";

export default async function RequerimientosPage() {
  const usuario = await exigirPermisoPagina(["ADQ_COTIZACIONES", "ADQ_CONSULTAR", "GER_REPORTES"]);
  const puedeCrear = tienePermiso(usuario, "ADQ_COTIZACIONES");

  // Consultar todas las adquisiciones con solicitud de reposición vinculada
  const { data: adquisiciones } = await supabaseAdmin
    .from("adquisicion")
    .select(
      `
      id_adquisicion,
      nro_adquisicion,
      tipo,
      descripcion,
      monto_estimado,
      estado,
      fecha_registro,
      id_solicitud,
      solicitud_reposicion:solicitud_reposicion (
        nro_solicitud
      ),
      usuario_registra:usuario (
        username,
        nombres,
        apellidos
      )
    `
    )
    .order("fecha_registro", { ascending: false });

  // Consultar solicitudes de reposición en estado PENDIENTE para el modal de atender
  const { data: solicitudesPendientes } = await supabaseAdmin
    .from("solicitud_reposicion")
    .select("id_solicitud, nro_solicitud, observacion, fecha_solicitud")
    .eq("estado", "PENDIENTE")
    .order("fecha_solicitud", { ascending: true });

  const adqsAdaptadas = (adquisiciones || []).map((a) => {
    const sol = Array.isArray(a.solicitud_reposicion)
      ? a.solicitud_reposicion[0]
      : a.solicitud_reposicion;
    const usr = Array.isArray(a.usuario_registra)
      ? a.usuario_registra[0]
      : a.usuario_registra;

    return {
      id_adquisicion: a.id_adquisicion,
      nro_adquisicion: a.nro_adquisicion,
      tipo: a.tipo as "BIEN" | "SERVICIO",
      descripcion: a.descripcion,
      monto_estimado: Number(a.monto_estimado),
      estado: a.estado,
      fecha_registro: a.fecha_registro,
      nro_solicitud: sol?.nro_solicitud || null,
      id_solicitud: a.id_solicitud,
      registrado_por: usr ? `${usr.nombres} ${usr.apellidos}` : "—",
    };
  });

  return (
    <RequerimientosClient
      puedeCrear={puedeCrear}
      adquisicionesIniciales={adqsAdaptadas}
      solicitudesPendientes={solicitudesPendientes || []}
    />
  );
}
