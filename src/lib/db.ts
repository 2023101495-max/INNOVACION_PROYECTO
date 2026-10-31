import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseSecretKey =
  process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined;
};

export const supabaseAdmin: SupabaseClient =
  globalForSupabase.supabaseAdmin ??
  createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}

/**
 * Obtiene el siguiente correlativo oficial desde la función fn_correlativo de PostgreSQL
 * ('V' | 'SR' | 'ADQ' | 'OC' | 'OS' | 'RC') -> V-000001, SR-000001, etc.
 */
export async function obtenerCorrelativo(
  prefijo: "V" | "SR" | "ADQ" | "OC" | "OS" | "RC"
): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("fn_correlativo", {
    p_prefijo: prefijo,
  });
  if (error || !data) {
    throw new Error(
      error?.message || `No se pudo generar el correlativo para ${prefijo}`
    );
  }
  return String(data);
}

/**
 * Traduce errores de base de datos o triggers de PostgreSQL/Supabase a un mensaje claro en español
 * para mostrar al usuario final sin exponer detalles técnicos internos.
 */
export function traducirErrorBD(error: unknown): string {
  if (!error) return "Ocurrió un error desconocido.";

  const errObj = error as { message?: string; code?: string; details?: string };
  const msg = errObj.message || String(error);

  // Errores lanzados explícitamente por nuestros triggers con RAISE EXCEPTION (código P0001)
  if (
    errObj.code === "P0001" ||
    msg.includes("supera el stock disponible") ||
    msg.includes("no está activo para la venta") ||
    msg.includes("Stock insuficiente") ||
    msg.includes("Solo se emite orden") ||
    msg.includes("líneas de servicio no se reciben") ||
    msg.includes("supera la cantidad ordenada") ||
    msg.includes("presupuesto del periodo está cerrado") ||
    msg.includes("reducción supera el saldo disponible") ||
    msg.includes("No existe disponibilidad presupuestal") ||
    msg.includes("liberación supera el monto comprometido") ||
    msg.includes("verificación ya fue evaluada") ||
    msg.includes("No se puede autorizar: no existe disponibilidad")
  ) {
    return msg.replace(/^ERROR:\s*/i, "");
  }

  // Violación de clave única (UNIQUE constraint)
  if (errObj.code === "23505" || msg.includes("duplicate key value")) {
    if (msg.includes("producto_codigo_key")) {
      return "Ya existe un producto registrado con ese código.";
    }
    if (msg.includes("proveedor_ruc_key")) {
      return "Ya existe un proveedor registrado con ese número de RUC.";
    }
    if (msg.includes("uq_cot_adq_prov")) {
      return "Este proveedor ya tiene una cotización registrada para este requerimiento.";
    }
    if (msg.includes("uq_venta_producto")) {
      return "El producto está duplicado en el detalle de la venta.";
    }
    if (msg.includes("uq_solrep_producto")) {
      return "El producto está duplicado en la solicitud de reposición.";
    }
    if (msg.includes("presupuesto_anio_key")) {
      return "Ya existe un presupuesto registrado para ese año.";
    }
    if (msg.includes("categoria_nombre_key")) {
      return "Ya existe una categoría con ese nombre.";
    }
    if (msg.includes("marca_nombre_key")) {
      return "Ya existe una marca con ese nombre.";
    }
    return "Ya existe un registro con esos mismos datos únicos.";
  }

  // Violación de restricción CHECK
  if (errObj.code === "23514") {
    return "Uno de los valores ingresados no cumple con las reglas de validación (verifique montos y cantidades mayores a cero).";
  }

  return msg;
}
