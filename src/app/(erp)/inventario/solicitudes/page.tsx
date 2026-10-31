import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import SolicitudesClient from "./SolicitudesClient";

export default async function SolicitudesPage() {
  const usuario = await exigirPermisoPagina(["INV_SOLICITAR_REPOS", "ADQ_COTIZACIONES", "GER_REPORTES"]);
  const puedeSolicitar = tienePermiso(usuario, "INV_SOLICITAR_REPOS");
  const puedeAtender = tienePermiso(usuario, "ADQ_COTIZACIONES");

  // Consultar todas las solicitudes con su usuario solicitante y detalle
  const { data: solicitudes } = await supabaseAdmin
    .from("solicitud_reposicion")
    .select(
      `
      id_solicitud,
      nro_solicitud,
      fecha_solicitud,
      estado,
      observacion,
      usuario_solicita:usuario (
        username,
        nombres,
        apellidos
      ),
      detalle_solicitud_reposicion (
        id_detalle_solicitud,
        stock_actual_ref,
        stock_minimo_ref,
        cantidad_solicitada,
        producto:producto (
          id_producto,
          codigo,
          nombre
        )
      )
    `
    )
    .order("fecha_solicitud", { ascending: false });

  // Productos actualmente bajo el stock mínimo (para proponer automáticamente al crear)
  const { data: productosBajoMinimo } = await supabaseAdmin
    .from("v_productos_bajo_minimo")
    .select("*");

  // Catálogo completo de productos por si se desea agregar otros
  const { data: todosProductos } = await supabaseAdmin
    .from("producto")
    .select("id_producto, codigo, nombre, stock_actual, stock_minimo")
    .eq("estado", "ACTIVO")
    .order("nombre", { ascending: true });

  const solicitudesAdaptadas = (solicitudes || []).map((s) => {
    const usr = Array.isArray(s.usuario_solicita) ? s.usuario_solicita[0] : s.usuario_solicita;
    const items = (s.detalle_solicitud_reposicion || []).map((d: any) => {
      const prod = Array.isArray(d.producto) ? d.producto[0] : d.producto;
      return {
        id_detalle_solicitud: d.id_detalle_solicitud,
        id_producto: prod?.id_producto,
        codigo: prod?.codigo || "",
        nombre: prod?.nombre || "",
        stock_actual_ref: d.stock_actual_ref,
        stock_minimo_ref: d.stock_minimo_ref,
        cantidad_solicitada: d.cantidad_solicitada,
      };
    });

    return {
      id_solicitud: s.id_solicitud,
      nro_solicitud: s.nro_solicitud,
      fecha_solicitud: s.fecha_solicitud,
      estado: s.estado,
      observacion: s.observacion || "",
      solicitante: usr ? `${usr.nombres} ${usr.apellidos} (${usr.username})` : "",
      items,
    };
  });

  return (
    <SolicitudesClient
      puedeSolicitar={puedeSolicitar}
      puedeAtender={puedeAtender}
      solicitudesIniciales={solicitudesAdaptadas}
      productosBajoMinimo={productosBajoMinimo || []}
      todosProductos={todosProductos || []}
    />
  );
}
