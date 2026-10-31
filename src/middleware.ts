import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION, verificarTokenSesion } from "@/lib/sesion";
import { MENU_ERP, tieneAlgunPermiso } from "@/lib/permisos";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir recursos estáticos y archivos internos de Next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_SESION)?.value;
  const sesion = token ? await verificarTokenSesion(token) : null;

  // Si entra a la raíz "/", enviarlo a /inicio o /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL(sesion ? "/inicio" : "/login", req.url));
  }

  // Si entra a /login y ya tiene sesión activa, redirigir a /inicio
  if (pathname.startsWith("/login")) {
    if (sesion) {
      return NextResponse.redirect(new URL("/inicio", req.url));
    }
    return NextResponse.next();
  }

  // Cualquier otra ruta requiere sesión activa
  if (!sesion) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verificar permisos por ruta según MENU_ERP
  const itemMenu = MENU_ERP.find(
    (item) => item.ruta !== "/inicio" && pathname.startsWith(item.ruta)
  );

  if (itemMenu && !tieneAlgunPermiso(sesion, itemMenu.permisosRequeridos)) {
    const urlInicio = new URL("/inicio", req.url);
    urlInicio.searchParams.set("denegado", "1");
    urlInicio.searchParams.set("modulo", itemMenu.label);
    return NextResponse.redirect(urlInicio);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
