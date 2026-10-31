import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import PresupuestoClient from "./PresupuestoClient";

export default async function PresupuestoPage() {
  const usuario = await exigirPermisoPagina(["FIN_CONSULTAR", "FIN_PRESUPUESTO", "GER_REPORTES"]);
  const puedeEditar = tienePermiso(usuario, "FIN_PRESUPUESTO");

  // 1. Consultar todos los presupuestos anuales desde v_situacion_presupuestal
  const { data: presupuestos } = await supabaseAdmin
    .from("v_situacion_presupuestal")
    .select("*")
    .order("anio", { ascending: false });

  // 2. Consultar movimientos presupuestales con usuario
  const { data: movimientosData } = await supabaseAdmin
    .from("movimiento_presupuestal")
    .select(
      `
      id_mov_presupuestal,
      id_presupuesto,
      tipo,
      monto,
      disponible_anterior,
      disponible_posterior,
      descripcion,
      fecha_hora,
      usuario:usuario (
        username,
        nombres,
        apellidos
      )
    `
    )
    .order("fecha_hora", { ascending: false });

  // 3. Consultar adquisiciones y su situación presupuestal desde v_adquisiciones_presupuesto (RF-ADM-11)
  const { data: adqsPresupuesto } = await supabaseAdmin
    .from("v_adquisiciones_presupuesto")
    .select("*");

  const movimientosAdaptados = (movimientosData || []).map((m) => {
    const usr = Array.isArray(m.usuario) ? m.usuario[0] : m.usuario;
    return {
      id_mov_presupuestal: m.id_mov_presupuestal,
      id_presupuesto: m.id_presupuesto,
      tipo: m.tipo,
      monto: Number(m.monto),
      disponible_anterior: m.disponible_anterior !== null ? Number(m.disponible_anterior) : null,
      disponible_posterior: m.disponible_posterior !== null ? Number(m.disponible_posterior) : null,
      descripcion: m.descripcion || "—",
      fecha_hora: m.fecha_hora,
      usuario: usr ? `${usr.nombres} ${usr.apellidos} (${usr.username})` : "—",
    };
  });

  return (
    <PresupuestoClient
      puedeEditar={puedeEditar}
      presupuestos={presupuestos || []}
      movimientos={movimientosAdaptados}
      adquisicionesPresupuesto={adqsPresupuesto || []}
    />
  );
}
