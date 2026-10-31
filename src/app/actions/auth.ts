"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin, traducirErrorBD } from "@/lib/db";
import { CodigoPermiso, UsuarioSesion } from "@/lib/permisos";
import { COOKIE_SESION, crearTokenSesion } from "@/lib/sesion";

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

export async function iniciarSesionAction(
  username: string,
  password: string
): Promise<ResultadoAccion> {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        ok: false,
        error: "Falta configurar DATABASE_URL en el archivo .env.local.",
      };
    }

    const userClean = username.trim().toLowerCase();
    if (!userClean || !password) {
      return { ok: false, error: "Ingrese su nombre de usuario y contraseña." };
    }

    const { data: usuarioRow, error: errUser } = await supabaseAdmin
      .from("usuario")
      .select(
        `
        id_usuario,
        username,
        nombres,
        apellidos,
        correo,
        password_hash,
        estado,
        id_rol,
        rol:rol (
          id_rol,
          nombre,
          id_unidad,
          unidad_organica:unidad_organica (
            id_unidad,
            nombre,
            es_unidad_organica
          )
        )
      `
      )
      .ilike("username", userClean)
      .maybeSingle();

    if (errUser) {
      return { ok: false, error: traducirErrorBD(errUser) };
    }

    if (!usuarioRow) {
      return { ok: false, error: "Usuario o contraseña incorrectos." };
    }

    if (usuarioRow.estado !== "ACTIVO") {
      return { ok: false, error: "La cuenta de usuario se encuentra INACTIVA." };
    }

    const passwordValido = await bcrypt.compare(password, usuarioRow.password_hash);
    if (!passwordValido) {
      return { ok: false, error: "Usuario o contraseña incorrectos." };
    }

    // Consultar permisos efectivos usando la vista v_permisos_usuario (RF-GGE-06)
    const { data: filasPermisos, error: errPerm } = await supabaseAdmin
      .from("v_permisos_usuario")
      .select("permiso")
      .eq("username", usuarioRow.username);

    if (errPerm) {
      return { ok: false, error: traducirErrorBD(errPerm) };
    }

    const permisos = (filasPermisos || []).map((f) => f.permiso as CodigoPermiso);

    const rolObj = Array.isArray(usuarioRow.rol) ? usuarioRow.rol[0] : usuarioRow.rol;
    const unidadObj = Array.isArray(rolObj?.unidad_organica)
      ? rolObj?.unidad_organica[0]
      : rolObj?.unidad_organica;

    const sesion: UsuarioSesion = {
      id_usuario: Number(usuarioRow.id_usuario),
      username: String(usuarioRow.username),
      nombres: String(usuarioRow.nombres),
      apellidos: String(usuarioRow.apellidos),
      correo: String(usuarioRow.correo),
      id_rol: Number(rolObj?.id_rol ?? usuarioRow.id_rol),
      rol: String(rolObj?.nombre ?? ""),
      id_unidad: Number(unidadObj?.id_unidad ?? 0),
      unidad: String(unidadObj?.nombre ?? ""),
      es_unidad_organica: Boolean(unidadObj?.es_unidad_organica),
      permisos,
    };

    const token = await crearTokenSesion(sesion);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 horas
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: traducirErrorBD(err) };
  }
}

export async function cerrarSesionAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESION);
  redirect("/login");
}
