import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import VerificacionesClient from "./VerificacionesClient";

export default async function VerificacionesPage() {
  const usuario = await exigirPermisoPagina(["FIN_VERIFICAR", "FIN_CONSULTAR", "GER_REPORTES"]);
  const puedeEvaluar = tienePermiso(usuario, "FIN_VERIFICAR");

  // 1. Consultar verificaciones pendientes
  const { data: pendientesData } = await supabaseAdmin
    .from("verificacion_presupuestal")
    .select(
      `
      id_verificacion,
      id_adquisicion,
      id_presupuesto,
      monto_solicitado,
      fecha_solicitud,
      resultado,
      decision,
      adquisicion:adquisicion (
        nro_adquisicion,
        tipo,
        descripcion,
        estado
      ),
      presupuesto:presupuesto (
        anio,
        monto_disponible,
        estado
      ),
      usuario_solicita:usuario!id_usuario_solicita (
        username,
        nombres,
        apellidos
      )
    `
    )
    .eq("resultado", "PENDIENTE")
    .order("fecha_solicitud", { ascending: true });

  // 2. Consultar historial de verificaciones desde v_historial_verificaciones (RF-ADM-10)
  const { data: historialData } = await supabaseAdmin
    .from("v_historial_verificaciones")
    .select("*")
    .order("fecha_solicitud", { ascending: false });

  // 3. Consultar saldo disponible actual del periodo presupuestal abierto
  const { data: presupuestoActual } = await supabaseAdmin
    .from("v_situacion_presupuestal")
    .select("*")
    .eq("estado", "ABIERTO")
    .order("anio", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pendientesAdaptadas = (pendientesData || []).map((v) => {
    const adq = Array.isArray(v.adquisicion) ? v.adquisicion[0] : v.adquisicion;
    const pres = Array.isArray(v.presupuesto) ? v.presupuesto[0] : v.presupuesto;
    const usr = Array.isArray(v.usuario_solicita) ? v.usuario_solicita[0] : v.usuario_solicita;

    const dispActual = Number(presupuestoActual?.monto_disponible || pres?.monto_disponible || 0);
    const montoSolicitado = Number(v.monto_solicitado);
    const tieneDisponibilidad = dispActual >= montoSolicitado;

    return {
      id_verificacion: v.id_verificacion,
      id_adquisicion: v.id_adquisicion,
      nro_adquisicion: adq?.nro_adquisicion || "—",
      tipo_adq: adq?.tipo || "BIEN",
      descripcion_adq: adq?.descripcion || "—",
      monto_solicitado: montoSolicitado,
      fecha_solicitud: v.fecha_solicitud,
      solicitante: usr ? `${usr.nombres} ${usr.apellidos} (${usr.username})` : "—",
      saldo_disponible_actual: dispActual,
      tiene_disponibilidad: tieneDisponibilidad,
      anio_presupuesto: pres?.anio || 2026,
    };
  });

  return (
    <VerificacionesClient
      puedeEvaluar={puedeEvaluar}
      pendientes={pendientesAdaptadas}
      historial={historialData || []}
      presupuestoActual={presupuestoActual || null}
    />
  );
}
