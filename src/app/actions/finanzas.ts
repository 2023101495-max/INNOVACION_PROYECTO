"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, traducirErrorBD } from "@/lib/db";
import { exigirPermisoAccion } from "@/lib/sesion";

// =====================================================================
// EVALUACIÓN DE VERIFICACIÓN PRESUPUESTAL (RF-ADM-04, 05, 06, 07, 08)
// =====================================================================

export async function evaluarVerificacionAction(input: {
  id_verificacion: number;
  decision: "AUTORIZADA" | "REPLANTEAR" | "RECHAZADA" | "POSPUESTA";
  observacion?: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["FIN_VERIFICAR"]);

    // Actualizar la verificación presupuestal
    // Los triggers de PostgreSQL en Supabase:
    // 1. trg_verificacion_bu: verifica disponibilidad en tiempo real, bloquea autorizar sin saldo
    // 2. trg_verificacion_au: si AUTORIZADA genera COMPROMISO en movimiento_presupuestal,
    //    actualiza adquisicion.estado y registra la decisión en decision_adquisicion.
    const { data: verif, error } = await supabaseAdmin
      .from("verificacion_presupuestal")
      .update({
        decision: input.decision,
        observacion: input.observacion?.trim() || null,
        id_usuario_evalua: usuario.id_usuario,
        fecha_evaluacion: new Date().toISOString(),
      })
      .eq("id_verificacion", input.id_verificacion)
      .select("id_verificacion, id_adquisicion, resultado, decision")
      .single();

    if (error) return { ok: false, error: traducirErrorBD(error) };

    revalidatePath("/finanzas/verificaciones");
    revalidatePath("/finanzas/presupuesto");
    revalidatePath("/adquisiciones/requerimientos");
    revalidatePath("/inicio");

    return {
      ok: true,
      resultado: verif?.resultado,
      decision: verif?.decision,
    };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

// =====================================================================
// GESTIÓN DE PRESUPUESTO ANUAL (RF-ADM-01, 02)
// =====================================================================

export async function asignarPresupuestoAction(input: {
  id_presupuesto: number;
  monto: number;
  descripcion: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["FIN_PRESUPUESTO"]);

    const monto = Number(input.monto);
    if (!monto || monto <= 0) {
      return { ok: false, error: "El monto a asignar debe ser mayor a cero." };
    }
    if (!input.descripcion?.trim()) {
      return { ok: false, error: "La descripción o justificación de la asignación es obligatoria." };
    }

    // El trigger trg_mov_presupuestal_bi incrementa monto_asignado en la tabla presupuesto
    const { error } = await supabaseAdmin.from("movimiento_presupuestal").insert({
      id_presupuesto: input.id_presupuesto,
      tipo: "ASIGNACION",
      monto,
      descripcion: input.descripcion.trim(),
      id_usuario: usuario.id_usuario,
    });

    if (error) return { ok: false, error: traducirErrorBD(error) };

    revalidatePath("/finanzas/presupuesto");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

export async function reducirPresupuestoAction(input: {
  id_presupuesto: number;
  monto: number;
  descripcion: string;
}) {
  try {
    const usuario = await exigirPermisoAccion(["FIN_PRESUPUESTO"]);

    const monto = Number(input.monto);
    if (!monto || monto <= 0) {
      return { ok: false, error: "El monto a reducir debe ser mayor a cero." };
    }
    if (!input.descripcion?.trim()) {
      return { ok: false, error: "La descripción o justificación de la reducción es obligatoria." };
    }

    // El trigger trg_mov_presupuestal_bi reduce monto_asignado y valida que no supere el disponible
    const { error } = await supabaseAdmin.from("movimiento_presupuestal").insert({
      id_presupuesto: input.id_presupuesto,
      tipo: "REDUCCION",
      monto,
      descripcion: input.descripcion.trim(),
      id_usuario: usuario.id_usuario,
    });

    if (error) return { ok: false, error: traducirErrorBD(error) };

    revalidatePath("/finanzas/presupuesto");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

export async function crearPeriodoPresupuestalAction(input: {
  anio: number;
  descripcion?: string;
  monto_inicial?: number;
}) {
  try {
    const usuario = await exigirPermisoAccion(["FIN_PRESUPUESTO"]);

    const anio = Number(input.anio);
    if (!anio || anio < 2000 || anio > 2100) {
      return { ok: false, error: "Ingrese un año válido entre 2000 y 2100." };
    }

    // Crear registro en presupuesto
    const { data: presData, error: errPres } = await supabaseAdmin
      .from("presupuesto")
      .insert({
        anio,
        descripcion: input.descripcion?.trim() || `Presupuesto de adquisiciones ${anio}`,
        monto_asignado: 0,
        monto_comprometido: 0,
        estado: "ABIERTO",
      })
      .select("id_presupuesto")
      .single();

    if (errPres || !presData) return { ok: false, error: traducirErrorBD(errPres) };

    // Si se especificó monto inicial > 0, registrar movimiento de ASIGNACION inicial
    const montoInicial = Number(input.monto_inicial || 0);
    if (montoInicial > 0) {
      const { error: errMov } = await supabaseAdmin
        .from("movimiento_presupuestal")
        .insert({
          id_presupuesto: presData.id_presupuesto,
          tipo: "ASIGNACION",
          monto: montoInicial,
          descripcion: `Asignación inicial aprobada para el periodo ${anio}`,
          id_usuario: usuario.id_usuario,
        });

      if (errMov) return { ok: false, error: traducirErrorBD(errMov) };
    }

    revalidatePath("/finanzas/presupuesto");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}

export async function cerrarPeriodoPresupuestalAction(id_presupuesto: number) {
  try {
    await exigirPermisoAccion(["FIN_PRESUPUESTO"]);

    const { error } = await supabaseAdmin
      .from("presupuesto")
      .update({ estado: "CERRADO" })
      .eq("id_presupuesto", id_presupuesto);

    if (error) return { ok: false, error: traducirErrorBD(error) };

    revalidatePath("/finanzas/presupuesto");
    revalidatePath("/inicio");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: traducirErrorBD(error) };
  }
}
