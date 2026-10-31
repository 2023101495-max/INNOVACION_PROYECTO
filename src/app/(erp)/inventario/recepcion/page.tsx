import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import RecepcionClient from "./RecepcionClient";

export default async function RecepcionPage() {
  await exigirPermisoPagina(["INV_RECEPCION"]);

  // 1. Consultar órdenes de compra pendientes de recibir (tipo = 'COMPRA' y no RECIBIDA/CONFORME/ANULADA)
  const { data: ordenesData } = await supabaseAdmin
    .from("orden")
    .select(
      `
      id_orden,
      nro_orden,
      tipo,
      fecha_emision,
      fecha_entrega_pactada,
      estado,
      monto_total,
      condiciones,
      proveedor:proveedor (
        id_proveedor,
        ruc,
        razon_social
      ),
      detalle_orden (
        id_detalle_orden,
        id_producto,
        descripcion,
        cantidad,
        precio_unitario,
        producto:producto (
          codigo,
          nombre
        )
      )
    `
    )
    .eq("tipo", "COMPRA")
    .in("estado", ["EMITIDA", "ENVIADA", "EN_TRANSITO", "RECIBIDA_PARCIAL"])
    .order("fecha_emision", { ascending: false });

  // 2. Consultar cantidades ya recibidas por línea de orden
  const { data: recepcionesDetalles } = await supabaseAdmin
    .from("detalle_recepcion")
    .select("id_detalle_orden, cantidad_recibida");

  const sumaRecibidaPorDetalle: Record<number, number> = {};
  for (const dr of recepcionesDetalles || []) {
    sumaRecibidaPorDetalle[dr.id_detalle_orden] =
      (sumaRecibidaPorDetalle[dr.id_detalle_orden] || 0) + Number(dr.cantidad_recibida);
  }

  // 3. Adaptar las órdenes calculando lo pendiente por cada línea
  const ordenesAdaptadas = (ordenesData || []).map((o) => {
    const prov = Array.isArray(o.proveedor) ? o.proveedor[0] : o.proveedor;
    const items = (o.detalle_orden || []).map((d: any) => {
      const prod = Array.isArray(d.producto) ? d.producto[0] : d.producto;
      const recibido = sumaRecibidaPorDetalle[d.id_detalle_orden] || 0;
      const pendiente = Math.max(0, Number(d.cantidad) - recibido);
      return {
        id_detalle_orden: d.id_detalle_orden,
        id_producto: d.id_producto,
        codigo: prod?.codigo || "",
        nombre: prod?.nombre || d.descripcion,
        cantidad_ordenada: Number(d.cantidad),
        cantidad_previa: recibido,
        cantidad_pendiente: pendiente,
        precio_unitario: Number(d.precio_unitario),
      };
    });

    return {
      id_orden: o.id_orden,
      nro_orden: o.nro_orden,
      fecha_emision: o.fecha_emision,
      fecha_entrega_pactada: o.fecha_entrega_pactada,
      estado: o.estado,
      condiciones: o.condiciones || "",
      proveedor: prov?.razon_social || "",
      ruc: prov?.ruc || "",
      items,
    };
  });

  // 4. Consultar historial de recepciones realizadas para auditoría y consulta
  const { data: historialRecepciones } = await supabaseAdmin
    .from("recepcion")
    .select(
      `
      id_recepcion,
      nro_recepcion,
      fecha_recepcion,
      guia_remision,
      observacion,
      orden:orden (
        nro_orden,
        proveedor:proveedor (razon_social)
      ),
      usuario:usuario (
        username,
        nombres,
        apellidos
      )
    `
    )
    .order("fecha_recepcion", { ascending: false })
    .limit(15);

  const historialAdaptado = (historialRecepciones || []).map((r) => {
    const ord = Array.isArray(r.orden) ? r.orden[0] : r.orden;
    const prov = Array.isArray(ord?.proveedor) ? ord?.proveedor[0] : ord?.proveedor;
    const usr = Array.isArray(r.usuario) ? r.usuario[0] : r.usuario;
    return {
      id_recepcion: r.id_recepcion,
      nro_recepcion: r.nro_recepcion,
      fecha_recepcion: r.fecha_recepcion,
      guia_remision: r.guia_remision || "—",
      nro_orden: ord?.nro_orden || "—",
      proveedor: prov?.razon_social || "—",
      almacenero: usr ? `${usr.nombres} ${usr.apellidos}` : "—",
      observacion: r.observacion || "—",
    };
  });

  return (
    <RecepcionClient
      ordenesPendientes={ordenesAdaptadas}
      historialRecepciones={historialAdaptado}
    />
  );
}
