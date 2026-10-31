import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { fechaHoyPeru } from "@/lib/formato";
import InicioClient from "./InicioClient";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ denegado?: string; modulo?: string }>;
}) {
  const usuario = await exigirPermisoPagina();
  const params = await searchParams;
  const accesoDenegado = params?.denegado === "1";
  const hoyStr = fechaHoyPeru();

  // Consultas de indicadores según RF-GGE-01 a 04 y RF-INV-09
  // 1. Alertas de stock bajo mínimo
  const { count: alertasStockCount } = await supabaseAdmin
    .from("alerta_stock")
    .select("*", { count: "exact", head: true })
    .eq("estado", "PENDIENTE");

  // 2. Solicitudes de reposición pendientes
  const { count: solicitudesPendientesCount } = await supabaseAdmin
    .from("solicitud_reposicion")
    .select("*", { count: "exact", head: true })
    .in("estado", ["PENDIENTE", "EN_PROCESO"]);

  // 3. Verificaciones presupuestales pendientes
  const { count: verificacionesPendientesCount } = await supabaseAdmin
    .from("verificacion_presupuestal")
    .select("*", { count: "exact", head: true })
    .eq("resultado", "PENDIENTE");

  // 4. Ventas de hoy y del mes
  const { data: ventasHoyData } = await supabaseAdmin
    .from("venta")
    .select("total")
    .gte("fecha_hora", `${hoyStr}T00:00:00`)
    .lte("fecha_hora", `${hoyStr}T23:59:59`);

  const totalVentasHoy = (ventasHoyData || []).reduce((acc, v) => acc + Number(v.total || 0), 0);
  const nroVentasHoy = (ventasHoyData || []).length;

  const { data: todasVentasData } = await supabaseAdmin
    .from("venta")
    .select("total");
  const totalVentasHistoricas = (todasVentasData || []).reduce((acc, v) => acc + Number(v.total || 0), 0);
  const nroVentasHistoricas = (todasVentasData || []).length;

  // 5. Presupuesto disponible del año vigente
  const { data: presupuestoData } = await supabaseAdmin
    .from("v_situacion_presupuestal")
    .select("*")
    .order("anio", { ascending: false })
    .limit(1);

  const presupuestoVigente = presupuestoData?.[0] || null;

  // 6. Lista de productos en alerta bajo mínimo para mostrar en el panel
  const { data: productosBajoMinimo } = await supabaseAdmin
    .from("v_productos_bajo_minimo")
    .select("*")
    .limit(5);

  return (
    <InicioClient
      usuario={usuario}
      accesoDenegado={accesoDenegado}
      modulo={params?.modulo}
      indicadores={{
        alertasStock: alertasStockCount ?? 0,
        solicitudesPendientes: solicitudesPendientesCount ?? 0,
        verificacionesPendientes: verificacionesPendientesCount ?? 0,
        ventasHoyMonto: totalVentasHoy,
        ventasHoyCantidad: nroVentasHoy,
        ventasTotalMonto: totalVentasHistoricas,
        ventasTotalCantidad: nroVentasHistoricas,
        presupuesto: presupuestoVigente,
        productosBajoMinimo: productosBajoMinimo || [],
      }}
    />
  );
}
