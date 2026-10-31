import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import ReportesClient from "./ReportesClient";

export default async function ReportesPage() {
  await exigirPermisoPagina(["GER_REPORTES"]);

  // 1. Consultar vistas de reportes consolidados (RF-GGE-01 a 04)
  const [
    { data: ventasDiarias },
    { data: ventasPorProducto },
    { data: inventarioConsolidado },
    { data: adquisicionesHistorial },
    { data: situacionPresupuestal },
  ] = await Promise.all([
    supabaseAdmin.from("v_ventas_consolidado_diario").select("*").order("fecha", { ascending: true }),
    supabaseAdmin.from("v_ventas_por_producto").select("*").order("monto_vendido", { ascending: false }),
    supabaseAdmin.from("v_inventario_consolidado").select("*").order("producto", { ascending: true }),
    supabaseAdmin.from("v_historial_adquisiciones").select("*").order("fecha_registro", { ascending: false }),
    supabaseAdmin.from("v_situacion_presupuestal").select("*").order("anio", { ascending: false }),
  ]);

  // Adaptar datos para gráficos
  const ventasDiariasAdaptadas = (ventasDiarias || []).map((v) => ({
    fecha: v.fecha,
    nro_ventas: Number(v.nro_ventas),
    unidades: Number(v.unidades_vendidas),
    monto: Number(v.monto_vendido),
  }));

  const ventasProductoAdaptadas = (ventasPorProducto || []).map((p) => ({
    producto: p.producto,
    codigo: p.codigo,
    categoria: p.categoria,
    unidades: Number(p.unidades_vendidas),
    monto: Number(p.monto_vendido),
  }));

  const presActual = situacionPresupuestal?.[0] || null;

  // Resumen de adquisiciones por estado para gráfico
  const adqsPorEstado: Record<string, number> = {};
  for (const a of adquisicionesHistorial || []) {
    const st = a.estado_adquisicion || "DESCONOCIDO";
    adqsPorEstado[st] = (adqsPorEstado[st] || 0) + 1;
  }
  const adqsGrafico = Object.entries(adqsPorEstado).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }));

  return (
    <ReportesClient
      ventasDiarias={ventasDiariasAdaptadas}
      ventasPorProducto={ventasProductoAdaptadas}
      inventarioConsolidado={inventarioConsolidado || []}
      adquisiciones={adquisicionesHistorial || []}
      presupuesto={presActual}
      adqsPorEstado={adqsGrafico}
    />
  );
}
