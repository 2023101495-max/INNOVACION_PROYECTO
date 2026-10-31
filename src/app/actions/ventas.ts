"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, obtenerCorrelativo, traducirErrorBD } from "@/lib/db";
import { exigirPermisoAccion } from "@/lib/sesion";

export interface ItemVentaInput {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  nombre?: string;
  codigo?: string;
}

export interface ResultadoRegistroVenta {
  ok: boolean;
  nro_venta?: string;
  id_venta?: number;
  total?: number;
  error?: string;
}

/**
 * Registra una nueva venta con sus ítems (RF-VEN-01 a RF-VEN-10).
 * Valida el permiso VEN_REGISTRAR en el servidor.
 * El trigger trg_detalle_venta_bi valida el stock y el trigger trg_detalle_venta_ai
 * descuenta el inventario y calcula el total.
 */
export async function registrarVentaAction(
  items: ItemVentaInput[],
  observacion?: string
): Promise<ResultadoRegistroVenta> {
  let idVentaCreada: number | null = null;
  try {
    const usuario = await exigirPermisoAccion(["VEN_REGISTRAR"]);

    if (!items || items.length === 0) {
      return { ok: false, error: "Debe agregar al menos un producto a la venta." };
    }

    // Validar cantidades positivas
    for (const item of items) {
      if (!item.cantidad || item.cantidad <= 0) {
        return { ok: false, error: "La cantidad de cada producto debe ser mayor a cero." };
      }
    }

    // 1. Obtener correlativo oficial 'V-00000X'
    const nroVenta = await obtenerCorrelativo("V");

    // 2. Insertar cabecera de venta
    const { data: ventaData, error: errVenta } = await supabaseAdmin
      .from("venta")
      .insert({
        nro_venta: nroVenta,
        id_usuario: usuario.id_usuario,
        observacion: observacion?.trim() || null,
        total: 0,
      })
      .select("id_venta, nro_venta, total")
      .single();

    if (errVenta || !ventaData) {
      return { ok: false, error: traducirErrorBD(errVenta) };
    }

    idVentaCreada = ventaData.id_venta;

    // 3. Insertar detalle de venta (los triggers validan stock y descuentan inventario)
    const detallePayload = items.map((item) => ({
      id_venta: ventaData.id_venta,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }));

    const { error: errDetalle } = await supabaseAdmin
      .from("detalle_venta")
      .insert(detallePayload);

    if (errDetalle) {
      // Compensar / revertir eliminando la cabecera si falló el detalle (ej. stock insuficiente)
      await supabaseAdmin.from("venta").delete().eq("id_venta", ventaData.id_venta);
      return { ok: false, error: traducirErrorBD(errDetalle) };
    }

    // 4. Obtener total final calculado por los triggers
    const { data: ventaFinal } = await supabaseAdmin
      .from("venta")
      .select("total")
      .eq("id_venta", ventaData.id_venta)
      .single();

    revalidatePath("/ventas/nueva");
    revalidatePath("/ventas/historial");
    revalidatePath("/inventario/productos");
    revalidatePath("/inventario/movimientos");
    revalidatePath("/inicio");

    return {
      ok: true,
      nro_venta: ventaData.nro_venta,
      id_venta: ventaData.id_venta,
      total: Number(ventaFinal?.total ?? 0),
    };
  } catch (error) {
    if (idVentaCreada) {
      await supabaseAdmin.from("venta").delete().eq("id_venta", idVentaCreada);
    }
    return { ok: false, error: traducirErrorBD(error) };
  }
}

/**
 * Obtiene el detalle completo de una venta para el modal / comprobante imprimible.
 */
export async function obtenerDetalleVentaAction(idVenta: number) {
  try {
    await exigirPermisoAccion(["VEN_CONSULTAR", "GER_REPORTES", "VEN_REGISTRAR"]);

    const { data: venta, error: errVenta } = await supabaseAdmin
      .from("venta")
      .select(
        `
        id_venta,
        nro_venta,
        fecha_hora,
        total,
        observacion,
        usuario:usuario (
          username,
          nombres,
          apellidos
        ),
        detalle_venta (
          id_detalle_venta,
          cantidad,
          precio_unitario,
          importe,
          producto (
            id_producto,
            codigo,
            nombre,
            modelo
          )
        )
      `
      )
      .eq("id_venta", idVenta)
      .single();

    if (errVenta || !venta) {
      return { ok: false, error: traducirErrorBD(errVenta) };
    }

    return { ok: true, venta };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}
