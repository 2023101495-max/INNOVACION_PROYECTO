"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, obtenerCorrelativo, traducirErrorBD } from "@/lib/db";
import { exigirPermisoAccion } from "@/lib/sesion";

export interface ProductoInput {
  id_producto?: number;
  codigo: string;
  nombre: string;
  modelo?: string;
  descripcion?: string;
  id_categoria: number;
  id_marca: number;
  precio_venta: number;
  stock_minimo: number;
  stock_inicial?: number; // solo al crear
  estado?: "ACTIVO" | "INACTIVO";
}

/**
 * Guarda o edita un producto (RF-INV-01, 02, 03, 04).
 * Si es nuevo y se especifica stock_inicial > 0, inserta el movimiento INVENTARIO_INICIAL.
 */
export async function guardarProductoAction(input: ProductoInput) {
  try {
    const usuario = await exigirPermisoAccion(["INV_PRODUCTOS"]);

    const codigo = input.codigo.trim().toUpperCase();
    const nombre = input.nombre.trim();
    const modelo = input.modelo?.trim() || null;
    const descripcion = input.descripcion?.trim() || null;
    const precio_venta = Number(input.precio_venta);
    const stock_minimo = Number(input.stock_minimo);
    const id_categoria = Number(input.id_categoria);
    const id_marca = Number(input.id_marca);

    if (!codigo || !nombre) {
      return { ok: false, error: "El código y el nombre del producto son obligatorios." };
    }
    if (precio_venta < 0 || stock_minimo < 0) {
      return { ok: false, error: "El precio de venta y el stock mínimo no pueden ser negativos." };
    }

    if (input.id_producto) {
      // Edición de producto existente
      const { error: errUpdate } = await supabaseAdmin
        .from("producto")
        .update({
          codigo,
          nombre,
          modelo,
          descripcion,
          id_categoria,
          id_marca,
          precio_venta,
          stock_minimo,
          estado: input.estado || "ACTIVO",
        })
        .eq("id_producto", input.id_producto);

      if (errUpdate) return { ok: false, error: traducirErrorBD(errUpdate) };
    } else {
      // Registro de producto nuevo
      const { data: prodData, error: errInsert } = await supabaseAdmin
        .from("producto")
        .insert({
          codigo,
          nombre,
          modelo,
          descripcion,
          id_categoria,
          id_marca,
          precio_venta,
          stock_actual: 0,
          stock_minimo,
          estado: "ACTIVO",
        })
        .select("id_producto")
        .single();

      if (errInsert || !prodData) return { ok: false, error: traducirErrorBD(errInsert) };

      // Si se ingresó stock inicial > 0, registrar movimiento de inventario inicial
      const stockInicial = Number(input.stock_inicial || 0);
      if (stockInicial > 0) {
        const { error: errMov } = await supabaseAdmin
          .from("movimiento_inventario")
          .insert({
            id_producto: prodData.id_producto,
            tipo: "ENTRADA",
            origen: "INVENTARIO_INICIAL",
            cantidad: stockInicial,
            id_usuario: usuario.id_usuario,
            observacion: "Inventario inicial al registrar producto",
          });

        if (errMov) return { ok: false, error: traducirErrorBD(errMov) };
      }
    }

    revalidatePath("/inventario/productos");
    revalidatePath("/inventario/movimientos");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

/**
 * Crea una nueva categoría rápida (Decisión #4)
 */
export async function crearCategoriaAction(nombre: string, descripcion?: string) {
  try {
    await exigirPermisoAccion(["INV_PRODUCTOS"]);
    const nombreClean = nombre.trim();
    if (!nombreClean) return { ok: false, error: "El nombre de la categoría es obligatorio." };

    const { data, error } = await supabaseAdmin
      .from("categoria")
      .insert({ nombre: nombreClean, descripcion: descripcion?.trim() || null })
      .select("id_categoria, nombre")
      .single();

    if (error) return { ok: false, error: traducirErrorBD(error) };
    revalidatePath("/inventario/productos");
    return { ok: true, categoria: data };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

/**
 * Crea una nueva marca rápida (Decisión #4)
 */
export async function crearMarcaAction(nombre: string) {
  try {
    await exigirPermisoAccion(["INV_PRODUCTOS"]);
    const nombreClean = nombre.trim();
    if (!nombreClean) return { ok: false, error: "El nombre de la marca es obligatorio." };

    const { data, error } = await supabaseAdmin
      .from("marca")
      .insert({ nombre: nombreClean })
      .select("id_marca, nombre")
      .single();

    if (error) return { ok: false, error: traducirErrorBD(error) };
    revalidatePath("/inventario/productos");
    return { ok: true, marca: data };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

/**
 * Registra un movimiento de almacén manual (entrada o salida por ajuste u otro motivo) (RF-INV-06, 07).
 */
export async function registrarMovimientoManualAction(input: {
  id_producto: number;
  tipo: "ENTRADA" | "SALIDA";
  origen: "AJUSTE" | "OTRO";
  cantidad: number;
  observacion: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["INV_MOVIMIENTOS"]);

    const cantidad = Number(input.cantidad);
    if (!cantidad || cantidad <= 0) {
      return { ok: false, error: "La cantidad debe ser mayor a cero." };
    }
    if (!input.observacion?.trim()) {
      return { ok: false, error: "La observación o motivo del movimiento es obligatoria." };
    }

    const { error } = await supabaseAdmin.from("movimiento_inventario").insert({
      id_producto: input.id_producto,
      tipo: input.tipo,
      origen: input.origen,
      cantidad,
      id_usuario: usuario.id_usuario,
      observacion: input.observacion.trim(),
    });

    if (error) return { ok: false, error: traducirErrorBD(error) };

    revalidatePath("/inventario/movimientos");
    revalidatePath("/inventario/productos");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

export interface ItemSolicitudInput {
  id_producto: number;
  stock_actual_ref: number;
  stock_minimo_ref: number;
  cantidad_solicitada: number;
}

/**
 * Crea una solicitud de reposición de inventario (RF-INV-10, RF-ADQ-01).
 */
export async function crearSolicitudReposicionAction(
  items: ItemSolicitudInput[],
  observacion?: string
) {
  let idSolicitudCreada: number | null = null;
  try {
    const usuario = await exigirPermisoAccion(["INV_SOLICITAR_REPOS"]);

    if (!items || items.length === 0) {
      return { ok: false, error: "Debe incluir al menos un producto a reponer." };
    }

    for (const it of items) {
      if (!it.cantidad_solicitada || it.cantidad_solicitada <= 0) {
        return { ok: false, error: "Las cantidades solicitadas deben ser mayores a cero." };
      }
    }

    const nroSolicitud = await obtenerCorrelativo("SR");

    const { data: solData, error: errSol } = await supabaseAdmin
      .from("solicitud_reposicion")
      .insert({
        nro_solicitud: nroSolicitud,
        id_usuario_solicita: usuario.id_usuario,
        estado: "PENDIENTE",
        observacion: observacion?.trim() || "Reposición de productos bajo stock mínimo",
      })
      .select("id_solicitud, nro_solicitud")
      .single();

    if (errSol || !solData) return { ok: false, error: traducirErrorBD(errSol) };
    idSolicitudCreada = solData.id_solicitud;

    const detalle = items.map((it) => ({
      id_solicitud: solData.id_solicitud,
      id_producto: it.id_producto,
      stock_actual_ref: it.stock_actual_ref,
      stock_minimo_ref: it.stock_minimo_ref,
      cantidad_solicitada: it.cantidad_solicitada,
    }));

    const { error: errDet } = await supabaseAdmin
      .from("detalle_solicitud_reposicion")
      .insert(detalle);

    if (errDet) {
      await supabaseAdmin
        .from("solicitud_reposicion")
        .delete()
        .eq("id_solicitud", solData.id_solicitud);
      return { ok: false, error: traducirErrorBD(errDet) };
    }

    revalidatePath("/inventario/solicitudes");
    revalidatePath("/inicio");
    return { ok: true, nro_solicitud: solData.nro_solicitud };
  } catch (error) {
    if (idSolicitudCreada) {
      await supabaseAdmin
        .from("solicitud_reposicion")
        .delete()
        .eq("id_solicitud", idSolicitudCreada);
    }
    return { ok: false, error: traducirErrorBD(error) };
  }
}

export interface ItemRecepcionInput {
  id_detalle_orden: number;
  cantidad_recibida: number;
  observacion?: string;
}

/**
 * Registra la recepción de productos contra una orden de compra (RF-INV-11, 12).
 * El trigger trg_detalle_recepcion_bi valida que no supere lo ordenado,
 * y trg_detalle_recepcion_ai aumenta el stock y actualiza orden.estado.
 * Si la orden queda RECIBIDA, finaliza la adquisición y marca la reposición ATENDIDA.
 */
export async function registrarRecepcionAction(input: {
  id_orden: number;
  guia_remision?: string;
  observacion?: string;
  items: ItemRecepcionInput[];
}) {
  let idRecepcionCreada: number | null = null;
  try {
    const usuario = await exigirPermisoAccion(["INV_RECEPCION"]);

    const itemsRecibir = input.items.filter((i) => i.cantidad_recibida > 0);
    if (itemsRecibir.length === 0) {
      return { ok: false, error: "Debe ingresar una cantidad mayor a cero para al menos un producto." };
    }

    const nroRecepcion = await obtenerCorrelativo("RC");

    const { data: recData, error: errRec } = await supabaseAdmin
      .from("recepcion")
      .insert({
        nro_recepcion: nroRecepcion,
        id_orden: input.id_orden,
        guia_remision: input.guia_remision?.trim() || null,
        observacion: input.observacion?.trim() || null,
        id_usuario: usuario.id_usuario,
      })
      .select("id_recepcion, nro_recepcion")
      .single();

    if (errRec || !recData) return { ok: false, error: traducirErrorBD(errRec) };
    idRecepcionCreada = recData.id_recepcion;

    const detalle = itemsRecibir.map((item) => ({
      id_recepcion: recData.id_recepcion,
      id_detalle_orden: item.id_detalle_orden,
      cantidad_recibida: item.cantidad_recibida,
      observacion: item.observacion?.trim() || null,
    }));

    const { error: errDet } = await supabaseAdmin
      .from("detalle_recepcion")
      .insert(detalle);

    if (errDet) {
      await supabaseAdmin.from("recepcion").delete().eq("id_recepcion", recData.id_recepcion);
      return { ok: false, error: traducirErrorBD(errDet) };
    }

    // Consultar el nuevo estado de la orden para verificar si se completó la recepción
    const { data: ordenActualizada } = await supabaseAdmin
      .from("orden")
      .select("id_orden, estado, id_adquisicion")
      .eq("id_orden", input.id_orden)
      .single();

    if (ordenActualizada && ordenActualizada.estado === "RECIBIDA") {
      // Regla de aplicación (Sección 8):
      // Al recibir completamente una orden de compra, la adquisición pasa a FINALIZADA
      // y su solicitud de reposición a ATENDIDA.
      await supabaseAdmin
        .from("adquisicion")
        .update({ estado: "FINALIZADA" })
        .eq("id_adquisicion", ordenActualizada.id_adquisicion);

      const { data: adqData } = await supabaseAdmin
        .from("adquisicion")
        .select("id_solicitud")
        .eq("id_adquisicion", ordenActualizada.id_adquisicion)
        .single();

      if (adqData?.id_solicitud) {
        await supabaseAdmin
          .from("solicitud_reposicion")
          .update({ estado: "ATENDIDA" })
          .eq("id_solicitud", adqData.id_solicitud);
      }
    }

    revalidatePath("/inventario/recepcion");
    revalidatePath("/inventario/movimientos");
    revalidatePath("/inventario/productos");
    revalidatePath("/adquisiciones/ordenes");
    revalidatePath("/inicio");

    return {
      ok: true,
      nro_recepcion: recData.nro_recepcion,
      estado_orden: ordenActualizada?.estado,
    };
  } catch (error) {
    if (idRecepcionCreada) {
      await supabaseAdmin.from("recepcion").delete().eq("id_recepcion", idRecepcionCreada);
    }
    return { ok: false, error: traducirErrorBD(error) };
  }
}
