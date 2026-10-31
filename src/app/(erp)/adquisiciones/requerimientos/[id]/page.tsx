import React from "react";
import { notFound } from "next/navigation";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import DetalleRequerimientoClient from "./DetalleRequerimientoClient";

export default async function DetalleRequerimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await exigirPermisoPagina([
    "ADQ_COTIZACIONES",
    "ADQ_DECIDIR",
    "ADQ_ORDENES",
    "ADQ_CONSULTAR",
    "GER_REPORTES",
  ]);

  const p = await params;
  const idAdq = parseInt(p.id, 10);
  if (isNaN(idAdq)) notFound();

  // 1. Consultar cabecera de la adquisición
  const { data: adq, error } = await supabaseAdmin
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
    .eq("id_adquisicion", idAdq)
    .single();

  if (error || !adq) notFound();

  // 2. Consultar cotizaciones del requerimiento con proveedores y detalle
  const { data: cotizaciones } = await supabaseAdmin
    .from("cotizacion")
    .select(
      `
      id_cotizacion,
      nro_cotizacion_prov,
      fecha_cotizacion,
      fecha_validez,
      plazo_entrega_dias,
      condiciones_pago,
      monto_total,
      estado,
      observacion,
      proveedor:proveedor (
        id_proveedor,
        ruc,
        razon_social
      ),
      detalle_cotizacion (
        id_detalle_cotizacion,
        id_producto,
        descripcion,
        cantidad,
        precio_unitario,
        subtotal
      )
    `
    )
    .eq("id_adquisicion", idAdq)
    .order("monto_total", { ascending: true });

  // 3. Consultar trazabilidad de decisiones
  const { data: decisiones } = await supabaseAdmin
    .from("decision_adquisicion")
    .select(
      `
      id_decision,
      unidad,
      decision,
      motivo,
      fecha_decision,
      id_cotizacion,
      usuario:usuario (
        username,
        nombres,
        apellidos
      )
    `
    )
    .eq("id_adquisicion", idAdq)
    .order("fecha_decision", { ascending: true });

  // 4. Consultar historial de verificaciones presupuestales
  const { data: verificaciones } = await supabaseAdmin
    .from("verificacion_presupuestal")
    .select(
      `
      id_verificacion,
      monto_solicitado,
      fecha_solicitud,
      disponible_al_evaluar,
      resultado,
      decision,
      fecha_evaluacion,
      observacion,
      usuario_solicita:usuario!id_usuario_solicita (username, nombres, apellidos),
      usuario_evalua:usuario!id_usuario_evalua (username, nombres, apellidos)
    `
    )
    .eq("id_adquisicion", idAdq)
    .order("fecha_solicitud", { ascending: true });

  // 5. Consultar órdenes emitidas para este requerimiento
  const { data: ordenes } = await supabaseAdmin
    .from("orden")
    .select("id_orden, nro_orden, tipo, monto_total, estado, fecha_emision")
    .eq("id_adquisicion", idAdq);

  // 6. Proveedores activos y productos activos para los modales
  const { data: proveedores } = await supabaseAdmin
    .from("proveedor")
    .select("id_proveedor, ruc, razon_social")
    .eq("estado", "ACTIVO")
    .order("razon_social", { ascending: true });

  const { data: productos } = await supabaseAdmin
    .from("producto")
    .select("id_producto, codigo, nombre, precio_venta")
    .eq("estado", "ACTIVO")
    .order("nombre", { ascending: true });

  // Si viene de una solicitud de reposición, traer los ítems solicitados
  let itemsSolicitudRef: any[] = [];
  if (adq.id_solicitud) {
    const { data: detSol } = await supabaseAdmin
      .from("detalle_solicitud_reposicion")
      .select("id_producto, cantidad_solicitada, producto:producto (codigo, nombre)")
      .eq("id_solicitud", adq.id_solicitud);
    itemsSolicitudRef = detSol || [];
  }

  const usr = Array.isArray(adq.usuario_registra) ? adq.usuario_registra[0] : adq.usuario_registra;
  const sol = Array.isArray(adq.solicitud_reposicion) ? adq.solicitud_reposicion[0] : adq.solicitud_reposicion;

  const adqAdaptada = {
    id_adquisicion: adq.id_adquisicion,
    nro_adquisicion: adq.nro_adquisicion,
    tipo: adq.tipo as "BIEN" | "SERVICIO",
    descripcion: adq.descripcion,
    monto_estimado: Number(adq.monto_estimado),
    estado: adq.estado,
    fecha_registro: adq.fecha_registro,
    nro_solicitud: sol?.nro_solicitud || null,
    id_solicitud: adq.id_solicitud,
    registrado_por: usr ? `${usr.nombres} ${usr.apellidos}` : "—",
  };

  return (
    <DetalleRequerimientoClient
      adquisicion={adqAdaptada}
      cotizaciones={cotizaciones || []}
      decisiones={decisiones || []}
      verificaciones={verificaciones || []}
      ordenes={ordenes || []}
      proveedores={proveedores || []}
      productos={productos || []}
      itemsSolicitudRef={itemsSolicitudRef}
      permisos={{
        puedeCotizar: tienePermiso(usuario, "ADQ_COTIZACIONES"),
        puedeDecidir: tienePermiso(usuario, "ADQ_DECIDIR"),
        puedeEmitirOrden: tienePermiso(usuario, "ADQ_ORDENES"),
      }}
    />
  );
}
