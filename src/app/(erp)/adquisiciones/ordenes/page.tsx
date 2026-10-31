import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import OrdenesClient from "./OrdenesClient";

export default async function OrdenesPage() {
  const usuario = await exigirPermisoPagina(["ADQ_ORDENES", "ADQ_CONSULTAR", "GER_REPORTES"]);
  const puedeEditar = tienePermiso(usuario, "ADQ_ORDENES");

  // Consultar todas las órdenes con proveedor, adquisición y detalle
  const { data: ordenesData } = await supabaseAdmin
    .from("orden")
    .select(
      `
      id_orden,
      nro_orden,
      tipo,
      fecha_emision,
      fecha_entrega_pactada,
      condiciones,
      monto_total,
      estado,
      id_adquisicion,
      proveedor:proveedor (
        id_proveedor,
        ruc,
        razon_social,
        contacto,
        telefono,
        direccion
      ),
      adquisicion:adquisicion (
        nro_adquisicion,
        descripcion
      ),
      usuario:usuario (
        username,
        nombres,
        apellidos
      ),
      detalle_orden (
        id_detalle_orden,
        descripcion,
        cantidad,
        precio_unitario,
        subtotal
      )
    `
    )
    .order("fecha_emision", { ascending: false });

  // Consultar coordinaciones de entrega existentes
  const { data: coordinaciones } = await supabaseAdmin
    .from("coordinacion_entrega")
    .select("*")
    .order("fecha_coordinacion", { ascending: false });

  const ordenesAdaptadas = (ordenesData || []).map((o) => {
    const prov = Array.isArray(o.proveedor) ? o.proveedor[0] : o.proveedor;
    const adq = Array.isArray(o.adquisicion) ? o.adquisicion[0] : o.adquisicion;
    const usr = Array.isArray(o.usuario) ? o.usuario[0] : o.usuario;
    const coord = (coordinaciones || []).find((c) => c.id_orden === o.id_orden);

    return {
      id_orden: o.id_orden,
      nro_orden: o.nro_orden,
      tipo: o.tipo as "COMPRA" | "SERVICIO",
      fecha_emision: o.fecha_emision,
      fecha_entrega_pactada: o.fecha_entrega_pactada,
      condiciones: o.condiciones || "—",
      monto_total: Number(o.monto_total),
      estado: o.estado,
      id_adquisicion: o.id_adquisicion,
      nro_adquisicion: adq?.nro_adquisicion || "—",
      descripcion_adq: adq?.descripcion || "—",
      proveedor: prov?.razon_social || "—",
      ruc_proveedor: prov?.ruc || "—",
      contacto_proveedor: prov?.contacto || "",
      telefono_proveedor: prov?.telefono || "",
      direccion_proveedor: prov?.direccion || "",
      emitido_por: usr ? `${usr.nombres} ${usr.apellidos}` : "—",
      detalle: o.detalle_orden || [],
      coordinacion: coord || null,
    };
  });

  return (
    <OrdenesClient
      puedeEditar={puedeEditar}
      ordenesIniciales={ordenesAdaptadas}
    />
  );
}
