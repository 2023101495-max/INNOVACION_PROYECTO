import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CodigoPermiso, UsuarioSesion, tieneAlgunPermiso } from "./permisos";

export const COOKIE_SESION = "erp_tecnocel_session";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET || "erp_tecnocel_ucss_nueva_cajamarca_2026_secret_key_jwt";
  return new TextEncoder().encode(secret);
}

/**
 * Crea un token JWT firmado con HS256 válido por 12 horas.
 */
export async function crearTokenSesion(usuario: UsuarioSesion): Promise<string> {
  return new SignJWT({ ...usuario })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecretKey());
}

/**
 * Verifica un token JWT y devuelve el UsuarioSesion o null si expiró / es inválido.
 */
export async function verificarTokenSesion(token: string): Promise<UsuarioSesion | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as UsuarioSesion;
  } catch {
    return null;
  }
}

/**
 * Obtiene el usuario autenticado actual desde la cookie httpOnly.
 */
export async function obtenerSesion(): Promise<UsuarioSesion | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESION)?.value;
  if (!token) return null;
  return verificarTokenSesion(token);
}

/**
 * Exige en un Server Component que el usuario esté autenticado y tenga al menos uno de los permisos indicados.
 * Si no está logueado, redirige a /login.
 * Si no tiene permiso, redirige a /inicio?denegado=1 (para mostrar aviso según sección 7).
 */
export async function exigirPermisoPagina(
  permisosRequeridos: CodigoPermiso[] = []
): Promise<UsuarioSesion> {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }
  if (permisosRequeridos.length > 0 && !tieneAlgunPermiso(sesion, permisosRequeridos)) {
    redirect("/inicio?denegado=1");
  }
  return sesion;
}

/**
 * Exige en una Server Action ("use server") que el usuario esté autenticado y tenga al menos uno de los permisos requeridos (RF-GGE-06).
 * Lanza un error claro si no cumple.
 */
export async function exigirPermisoAccion(
  permisosRequeridos: CodigoPermiso[]
): Promise<UsuarioSesion> {
  const sesion = await obtenerSesion();
  if (!sesion) {
    throw new Error("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
  }
  if (permisosRequeridos.length > 0 && !tieneAlgunPermiso(sesion, permisosRequeridos)) {
    throw new Error(
      `Acceso denegado: Su rol (${sesion.rol}) no tiene el permiso requerido (${permisosRequeridos.join(
        " o "
      )}) para realizar esta operación.`
    );
  }
  return sesion;
}
