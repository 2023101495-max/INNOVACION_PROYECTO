"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, obtenerCorrelativo, traducirErrorBD } from "@/lib/db";
import { exigirPermisoAccion } from "@/lib/sesion";

// =====================================================================
// PROVEEDORES (RF-ADQ-03)
// =====================================================================

export interface ProveedorInput {
  id_proveedor?: number;
  ruc: string;
  razon_social: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  contacto?: string;
  estado?: "ACTIVO" | "INACTIVO";
}

export async function guardarProveedorAction(input: ProveedorInput) {
  try {
    await exigirPermisoAccion(["ADQ_PROVEEDORES"]);

    const ruc = input.ruc.trim();
    const razon_social = input.razon_social.trim();

    if (!/^\d{11}$/.test(ruc)) {
      return { ok: false, error: "El RUC debe tener exactamente 11 dígitos numéricos." };
    }
    if (!razon_social) {
      return { ok: false, error: "La razón social del proveedor es obligatoria." };
    }

    const payload = {
      ruc,
      razon_social,
      direccion: input.direccion?.trim() || null,
      telefono: input.telefono?.trim() || null,
      correo: input.correo?.trim() || null,
      contacto: input.contacto?.trim() || null,
      estado: input.estado || "ACTIVO",
    };

    if (input.id_proveedor) {
      const { error } = await supabaseAdmin
        .from("proveedor")
        .update(payload)
        .eq("id_proveedor", input.id_proveedor);

      if (error) return { ok: false, error: traducirErrorBD(error) };
    } else {
      const { error } = await supabaseAdmin.from("proveedor").insert(payload);
      if (error) return { ok: false, error: traducirErrorBD(error) };
    }

    revalidatePath("/adquisiciones/proveedores");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// REQUERIMIENTOS DE ADQUISICIÓN (RF-ADQ-07, 09, 16, 18)
// =====================================================================

export async function crearRequerimientoAction(input: {
  tipo: "BIEN" | "SERVICIO";
  descripcion: string;
  id_solicitud?: number | null;
}) {
  try {
    const usuario = await exigirPermisoAccion(["ADQ_COTIZACIONES"]);

    if (!input.descripcion?.trim()) {
      return { ok: false, error: "La descripción del requerimiento es obligatoria." };
    }

    const nroAdquisicion = await obtenerCorrelativo("ADQ");

    const { data: adqData, error: errAdq } = await supabaseAdmin
      .from("adquisicion")
      .insert({
        nro_adquisicion: nroAdquisicion,
        tipo: input.tipo,
        descripcion: input.descripcion.trim(),
        id_solicitud: input.id_solicitud || null,
        monto_estimado: 0,
        estado: "EN_COTIZACION",
        id_usuario_registra: usuario.id_usuario,
      })
      .select("id_adquisicion, nro_adquisicion")
      .single();

    if (errAdq || !adqData) return { ok: false, error: traducirErrorBD(errAdq) };

    // Si viene de una solicitud de reposición, pasar su estado a EN_PROCESO
    if (input.id_solicitud) {
      await supabaseAdmin
        .from("solicitud_reposicion")
        .update({ estado: "EN_PROCESO" })
        .eq("id_solicitud", input.id_solicitud);
    }

    revalidatePath("/adquisiciones/requerimientos");
    revalidatePath("/inventario/solicitudes");
    return { ok: true, id_adquisicion: adqData.id_adquisicion, nro_adquisicion: adqData.nro_adquisicion };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// COTIZACIONES (RF-ADQ-04, 05, 06)
// =====================================================================

export interface ItemCotizacionInput {
  id_producto?: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export async function registrarCotizacionAction(input: {
  id_adquisicion: number;
  id_proveedor: number;
  nro_cotizacion_prov?: string;
  fecha_cotizacion: string;
  fecha_validez?: string;
  plazo_entrega_dias?: number;
  condiciones_pago?: string;
  observacion?: string;
  items: ItemCotizacionInput[];
}) {
  let idCotizacionCreada: number | null = null;
  try {
    await exigirPermisoAccion(["ADQ_COTIZACIONES"]);

    // Validar estado de la adquisición: solo EN_COTIZACION, REPLANTEADA o SIN_DISPONIBILIDAD
    const { data: adq } = await supabaseAdmin
      .from("adquisicion")
      .select("estado")
      .eq("id_adquisicion", input.id_adquisicion)
      .single();

    if (!adq || !["EN_COTIZACION", "REPLANTEADA", "SIN_DISPONIBILIDAD"].includes(adq.estado)) {
      return {
        ok: false,
        error: `No se pueden registrar cotizaciones en el estado actual (${adq?.estado || "DESCONOCIDO"}).`,
      };
    }

    if (!input.items || input.items.length === 0) {
      return { ok: false, error: "Debe registrar al menos un producto o servicio en la cotización." };
    }

    // 1. Crear cabecera de cotización
    const { data: cotData, error: errCot } = await supabaseAdmin
      .from("cotizacion")
      .insert({
        id_adquisicion: input.id_adquisicion,
        id_proveedor: input.id_proveedor,
        nro_cotizacion_prov: input.nro_cotizacion_prov?.trim() || null,
        fecha_cotizacion: input.fecha_cotizacion,
        fecha_validez: input.fecha_validez || null,
        plazo_entrega_dias: input.plazo_entrega_dias ?? null,
        condiciones_pago: input.condiciones_pago?.trim() || null,
        observacion: input.observacion?.trim() || null,
        monto_total: 0,
        estado: "REGISTRADA",
      })
      .select("id_cotizacion")
      .single();

    if (errCot || !cotData) return { ok: false, error: traducirErrorBD(errCot) };
    idCotizacionCreada = cotData.id_cotizacion;

    // 2. Insertar detalle de cotización (trigger trg_detalle_cotizacion_ai suma el total)
    const detallePayload = input.items.map((it) => ({
      id_cotizacion: cotData.id_cotizacion,
      id_producto: it.id_producto || null,
      descripcion: it.descripcion.trim(),
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
    }));

    const { error: errDet } = await supabaseAdmin
      .from("detalle_cotizacion")
      .insert(detallePayload);

    if (errDet) {
      await supabaseAdmin.from("cotizacion").delete().eq("id_cotizacion", cotData.id_cotizacion);
      return { ok: false, error: traducirErrorBD(errDet) };
    }

    revalidatePath(`/adquisiciones/requerimientos/${input.id_adquisicion}`);
    revalidatePath("/adquisiciones/requerimientos");
    return { ok: true, id_cotizacion: cotData.id_cotizacion };
  } catch (error) {
    if (idCotizacionCreada) {
      await supabaseAdmin.from("cotizacion").delete().eq("id_cotizacion", idCotizacionCreada);
    }
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// SELECCIÓN Y DECISIÓN DE COTIZACIÓN (RF-ADQ-06, 07)
// =====================================================================

export async function seleccionarCotizacionAction(input: {
  id_adquisicion: number;
  id_cotizacion: number;
  motivo: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["ADQ_DECIDIR"]);

    if (!input.motivo?.trim()) {
      return { ok: false, error: "El motivo de selección de la cotización es obligatorio." };
    }

    // 1. Obtener monto total de la cotización elegida
    const { data: cot } = await supabaseAdmin
      .from("cotizacion")
      .select("monto_total")
      .eq("id_cotizacion", input.id_cotizacion)
      .single();

    if (!cot) return { ok: false, error: "Cotización no encontrada." };

    // 2. Marcar la cotización como SELECCIONADA y las demás como DESCARTADAS
    await supabaseAdmin
      .from("cotizacion")
      .update({ estado: "DESCARTADA" })
      .eq("id_adquisicion", input.id_adquisicion);

    await supabaseAdmin
      .from("cotizacion")
      .update({ estado: "SELECCIONADA" })
      .eq("id_cotizacion", input.id_cotizacion);

    // 3. Actualizar monto_estimado en adquisicion
    await supabaseAdmin
      .from("adquisicion")
      .update({ monto_estimado: cot.monto_total })
      .eq("id_adquisicion", input.id_adquisicion);

    // 4. Registrar trazabilidad en decision_adquisicion
    await supabaseAdmin.from("decision_adquisicion").insert({
      id_adquisicion: input.id_adquisicion,
      unidad: "ADQUISICIONES",
      decision: "SELECCION_COTIZACION",
      id_cotizacion: input.id_cotizacion,
      motivo: input.motivo.trim(),
      id_usuario: usuario.id_usuario,
    });

    revalidatePath(`/adquisiciones/requerimientos/${input.id_adquisicion}`);
    revalidatePath("/adquisiciones/requerimientos");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// SOLICITUD DE VERIFICACIÓN PRESUPUESTAL (RF-ADQ-08 / RF-ADM-03)
// =====================================================================

export async function solicitarVerificacionAction(id_adquisicion: number) {
  try {
    const usuario = await exigirPermisoAccion(["ADQ_COTIZACIONES"]);

    // Obtener adquisición y su cotización seleccionada
    const { data: adq } = await supabaseAdmin
      .from("adquisicion")
      .select("id_adquisicion, monto_estimado, estado")
      .eq("id_adquisicion", id_adquisicion)
      .single();

    if (!adq) return { ok: false, error: "Requerimiento no encontrado." };

    const { data: cotSeleccionada } = await supabaseAdmin
      .from("cotizacion")
      .select("id_cotizacion, monto_total")
      .eq("id_adquisicion", id_adquisicion)
      .eq("estado", "SELECCIONADA")
      .maybeSingle();

    if (!cotSeleccionada) {
      return {
        ok: false,
        error: "Debe seleccionar una cotización ganadora antes de solicitar verificación presupuestal.",
      };
    }

    // Obtener presupuesto del periodo anual abierto
    const { data: presAbierto } = await supabaseAdmin
      .from("presupuesto")
      .select("id_presupuesto, anio")
      .eq("estado", "ABIERTO")
      .order("anio", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!presAbierto) {
      return { ok: false, error: "No existe un periodo presupuestal ABIERTO en el sistema." };
    }

    // Insertar en verificacion_presupuestal (trigger trg_verificacion_ai pasa la adq a EN_VERIFICACION)
    const { error: errVerif } = await supabaseAdmin
      .from("verificacion_presupuestal")
      .insert({
        id_adquisicion,
        id_presupuesto: presAbierto.id_presupuesto,
        monto_solicitado: adq.monto_estimado || cotSeleccionada.monto_total,
        id_usuario_solicita: usuario.id_usuario,
        resultado: "PENDIENTE",
      });

    if (errVerif) return { ok: false, error: traducirErrorBD(errVerif) };

    revalidatePath(`/adquisiciones/requerimientos/${id_adquisicion}`);
    revalidatePath("/adquisiciones/requerimientos");
    revalidatePath("/finanzas/verificaciones");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// REPLANTEAMIENTO DE ADQUISICIÓN (RF-ADQ-17, Opción A aprobada)
// =====================================================================

export async function registrarReplanteamientoAction(input: {
  id_adquisicion: number;
  monto_propuesto: number;
  motivo: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["ADQ_DECIDIR"]);

    const { data: adq } = await supabaseAdmin
      .from("adquisicion")
      .select("estado, monto_estimado")
      .eq("id_adquisicion", input.id_adquisicion)
      .single();

    if (!adq || adq.estado !== "SIN_DISPONIBILIDAD") {
      return {
        ok: false,
        error: "Solo se puede replantear una adquisición que se encuentre en estado SIN_DISPONIBILIDAD.",
      };
    }

    if (!input.monto_propuesto || input.monto_propuesto <= 0) {
      return { ok: false, error: "El monto propuesto debe ser mayor a cero." };
    }
    if (!input.motivo?.trim()) {
      return { ok: false, error: "El motivo del replanteamiento es obligatorio." };
    }

    // Obtener última verificación
    const { data: ultVerif } = await supabaseAdmin
      .from("verificacion_presupuestal")
      .select("id_verificacion")
      .eq("id_adquisicion", input.id_adquisicion)
      .order("id_verificacion", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Insertar en replanteamiento (trigger trg_replanteamiento_ai actualiza monto_estimado y estado a REPLANTEADA)
    const { error: errRep } = await supabaseAdmin.from("replanteamiento").insert({
      id_adquisicion: input.id_adquisicion,
      id_verificacion: ultVerif?.id_verificacion || null,
      monto_anterior: adq.monto_estimado,
      monto_propuesto: input.monto_propuesto,
      motivo: input.motivo.trim(),
      id_usuario: usuario.id_usuario,
    });

    if (errRep) return { ok: false, error: traducirErrorBD(errRep) };

    revalidatePath(`/adquisiciones/requerimientos/${input.id_adquisicion}`);
    revalidatePath("/adquisiciones/requerimientos");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// RECHAZAR / POSPONER ADQUISICIÓN (RF-ADQ-18)
// =====================================================================

export async function decidirAdquisicionAction(input: {
  id_adquisicion: number;
  decision: "RECHAZADA" | "POSPUESTA";
  motivo: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["ADQ_DECIDIR"]);

    if (!input.motivo?.trim()) {
      return { ok: false, error: "El motivo de la decisión es obligatorio." };
    }

    // Actualizar estado de adquisición
    const { error: errAdq } = await supabaseAdmin
      .from("adquisicion")
      .update({ estado: input.decision })
      .eq("id_adquisicion", input.id_adquisicion);

    if (errAdq) return { ok: false, error: traducirErrorBD(errAdq) };

    // Si tiene solicitud de reposición vinculada, actualizarla también
    const { data: adq } = await supabaseAdmin
      .from("adquisicion")
      .select("id_solicitud")
      .eq("id_adquisicion", input.id_adquisicion)
      .single();

    if (adq?.id_solicitud) {
      await supabaseAdmin
        .from("solicitud_reposicion")
        .update({ estado: input.decision })
        .eq("id_solicitud", adq.id_solicitud);
    }

    // Registrar en decision_adquisicion
    await supabaseAdmin.from("decision_adquisicion").insert({
      id_adquisicion: input.id_adquisicion,
      unidad: "ADQUISICIONES",
      decision: input.decision,
      motivo: input.motivo.trim(),
      id_usuario: usuario.id_usuario,
    });

    revalidatePath(`/adquisiciones/requerimientos/${input.id_adquisicion}`);
    revalidatePath("/adquisiciones/requerimientos");
    revalidatePath("/inventario/solicitudes");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// EMISIÓN DE ÓRDENES DE COMPRA Y SERVICIO (RF-ADQ-10, 11, 12, 13)
// =====================================================================

export interface ItemOrdenInput {
  id_producto?: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export async function emitirOrdenAction(input: {
  id_adquisicion: number;
  id_cotizacion?: number;
  fecha_entrega_pactada?: string;
  condiciones?: string;
  items: ItemOrdenInput[];
}) {
  let idOrdenCreada: number | null = null;
  try {
    const usuario = await exigirPermisoAccion(["ADQ_ORDENES"]);

    // 1. Obtener adquisición y verificar estado
    const { data: adq } = await supabaseAdmin
      .from("adquisicion")
      .select("id_adquisicion, tipo, estado, monto_estimado")
      .eq("id_adquisicion", input.id_adquisicion)
      .single();

    if (!adq || !["AUTORIZADA", "CON_ORDEN"].includes(adq.estado)) {
      return {
        ok: false,
        error: "Solo se puede emitir una orden para adquisiciones debidamente AUTORIZADAS presupuestalmente.",
      };
    }

    // 2. Obtener cotización ganadora y su proveedor
    const { data: cot } = await supabaseAdmin
      .from("cotizacion")
      .select("id_cotizacion, id_proveedor, plazo_entrega_dias, condiciones_pago")
      .eq("id_adquisicion", input.id_adquisicion)
      .eq("estado", "SELECCIONADA")
      .maybeSingle();

    if (!cot) {
      return { ok: false, error: "No se encontró una cotización seleccionada para este requerimiento." };
    }

    // 3. Validar que el total de la orden no supere el monto autorizado (Regla Sección 8)
    const totalOrden = input.items.reduce(
      (acc, it) => acc + it.cantidad * it.precio_unitario,
      0
    );

    if (totalOrden > Number(adq.monto_estimado)) {
      return {
        ok: false,
        error: `El total de la orden (S/ ${totalOrden.toFixed(2)}) supera el monto presupuestal autorizado (S/ ${Number(adq.monto_estimado).toFixed(2)}).`,
      };
    }

    // 4. Correlativo OC-00000X o OS-00000X
    const prefijo = adq.tipo === "BIEN" ? "OC" : "OS";
    const nroOrden = await obtenerCorrelativo(prefijo);

    // 5. Insertar orden (trigger trg_orden_bi valida y trg_orden_ai actualiza adq a CON_ORDEN)
    const { data: ordenData, error: errOrden } = await supabaseAdmin
      .from("orden")
      .insert({
        nro_orden: nroOrden,
        tipo: adq.tipo === "BIEN" ? "COMPRA" : "SERVICIO",
        id_adquisicion: input.id_adquisicion,
        id_proveedor: cot.id_proveedor,
        id_cotizacion: cot.id_cotizacion,
        fecha_entrega_pactada: input.fecha_entrega_pactada || null,
        condiciones: input.condiciones?.trim() || cot.condiciones_pago || null,
        monto_total: 0,
        estado: "EMITIDA",
        id_usuario: usuario.id_usuario,
      })
      .select("id_orden, nro_orden")
      .single();

    if (errOrden || !ordenData) return { ok: false, error: traducirErrorBD(errOrden) };
    idOrdenCreada = ordenData.id_orden;

    // 6. Insertar detalle_orden (trigger trg_detalle_orden_ai suma el total)
    const detallePayload = input.items.map((it) => ({
      id_orden: ordenData.id_orden,
      id_producto: it.id_producto || null,
      descripcion: it.descripcion.trim(),
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
    }));

    const { error: errDet } = await supabaseAdmin
      .from("detalle_orden")
      .insert(detallePayload);

    if (errDet) {
      await supabaseAdmin.from("orden").delete().eq("id_orden", ordenData.id_orden);
      return { ok: false, error: traducirErrorBD(errDet) };
    }

    revalidatePath("/adquisiciones/ordenes");
    revalidatePath(`/adquisiciones/requerimientos/${input.id_adquisicion}`);
    revalidatePath("/adquisiciones/requerimientos");
    return { ok: true, nro_orden: ordenData.nro_orden, id_orden: ordenData.id_orden };
  } catch (error) {
    if (idOrdenCreada) {
      await supabaseAdmin.from("orden").delete().eq("id_orden", idOrdenCreada);
    }
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// ESTADOS DE ÓRDENES, COORDINACIÓN Y CONFORMIDAD (RF-ADQ-14, 15)
// =====================================================================

export async function cambiarEstadoOrdenAction(input: {
  id_orden: number;
  nuevo_estado: "ENVIADA" | "EN_TRANSITO" | "CONFORME" | "ANULADA";
}) {
  try {
    await exigirPermisoAccion(["ADQ_ORDENES"]);

    // Si se desea anular (Opción B aprobada): verificar que no tenga recepciones
    if (input.nuevo_estado === "ANULADA") {
      const { data: recs } = await supabaseAdmin
        .from("recepcion")
        .select("id_recepcion")
        .eq("id_orden", input.id_orden)
        .limit(1);

      if (recs && recs.length > 0) {
        return {
          ok: false,
          error: "No se puede anular una orden que ya cuenta con recepciones registradas en almacén.",
        };
      }
    }

    const { data: orden, error: errUpdate } = await supabaseAdmin
      .from("orden")
      .update({ estado: input.nuevo_estado })
      .eq("id_orden", input.id_orden)
      .select("id_orden, id_adquisicion, tipo, estado")
      .single();

    if (errUpdate || !orden) return { ok: false, error: traducirErrorBD(errUpdate) };

    // Si es servicio y pasa a CONFORME: cerrar la adquisición como FINALIZADA
    if (orden.tipo === "SERVICIO" && input.nuevo_estado === "CONFORME") {
      await supabaseAdmin
        .from("adquisicion")
        .update({ estado: "FINALIZADA" })
        .eq("id_adquisicion", orden.id_adquisicion);
    }

    revalidatePath("/adquisiciones/ordenes");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

export async function registrarCoordinacionEntregaAction(input: {
  id_orden: number;
  fecha_entrega_programada: string;
  lugar_entrega?: string;
  contacto_proveedor?: string;
  observacion?: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["ADQ_ORDENES"]);

    if (!input.fecha_entrega_programada) {
      return { ok: false, error: "La fecha de entrega programada es obligatoria." };
    }

    const { error: errCoord } = await supabaseAdmin
      .from("coordinacion_entrega")
      .insert({
        id_orden: input.id_orden,
        fecha_entrega_programada: input.fecha_entrega_programada,
        lugar_entrega: input.lugar_entrega?.trim() || "Almacén Central",
        contacto_proveedor: input.contacto_proveedor?.trim() || null,
        observacion: input.observacion?.trim() || null,
        id_usuario: usuario.id_usuario,
      });

    if (errCoord) return { ok: false, error: traducirErrorBD(errCoord) };

    // Pasar orden a ENVIADA o EN_TRANSITO automáticamente si estaba en EMITIDA
    await supabaseAdmin
      .from("orden")
      .update({ estado: "ENVIADA" })
      .eq("id_orden", input.id_orden)
      .eq("estado", "EMITIDA");

    revalidatePath("/adquisiciones/ordenes");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}
