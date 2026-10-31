import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import MovimientosClient from "./MovimientosClient";

export default async function MovimientosPage() {
  const usuario = await exigirPermisoPagina(["INV_CONSULTAR", "INV_MOVIMIENTOS"]);
  const puedeRegistrar = tienePermiso(usuario, "INV_MOVIMIENTOS");

  // Consultar historial de movimientos desde la vista v_historial_movimientos (RF-INV-14, 15)
  const { data: movimientos } = await supabaseAdmin
    .from("v_historial_movimientos")
    .select("*")
    .order("fecha_hora", { ascending: false });

  // Productos para el selector del modal manual
  const { data: productos } = await supabaseAdmin
    .from("producto")
    .select("id_producto, codigo, nombre, stock_actual")
    .eq("estado", "ACTIVO")
    .order("nombre", { ascending: true });

  return (
    <MovimientosClient
      puedeRegistrar={puedeRegistrar}
      movimientosIniciales={movimientos || []}
      productos={productos || []}
    />
  );
}
