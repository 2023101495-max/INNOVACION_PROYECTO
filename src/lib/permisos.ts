export type CodigoPermiso =
  | "VEN_REGISTRAR"
  | "VEN_CONSULTAR"
  | "INV_PRODUCTOS"
  | "INV_MOVIMIENTOS"
  | "INV_CONSULTAR"
  | "INV_SOLICITAR_REPOS"
  | "INV_RECEPCION"
  | "ADQ_PROVEEDORES"
  | "ADQ_COTIZACIONES"
  | "ADQ_DECIDIR"
  | "ADQ_ORDENES"
  | "ADQ_CONSULTAR"
  | "FIN_PRESUPUESTO"
  | "FIN_VERIFICAR"
  | "FIN_CONSULTAR"
  | "GER_REPORTES";

export interface UsuarioSesion {
  id_usuario: number;
  username: string;
  nombres: string;
  apellidos: string;
  correo: string;
  id_rol: number;
  rol: string;
  id_unidad: number;
  unidad: string;
  es_unidad_organica: boolean;
  permisos: CodigoPermiso[];
}

export interface ItemMenuERP {
  key: string;
  label: string;
  ruta: string;
  modulo: "INICIO" | "VENTAS" | "INVENTARIO" | "ADQUISICIONES" | "FINANZAS" | "GERENCIA";
  /** Si está vacío, todos los usuarios autenticados pueden verlo (ej. Inicio). Si tiene elementos, basta tener al menos uno. */
  permisosRequeridos: CodigoPermiso[];
  iconoNombre: string;
}

/**
 * Definición centralizada de las rutas y pantallas del ERP con sus permisos requeridos según la Sección 8.
 */
export const MENU_ERP: ItemMenuERP[] = [
  {
    key: "inicio",
    label: "Panel Principal",
    ruta: "/inicio",
    modulo: "INICIO",
    permisosRequeridos: [],
    iconoNombre: "DashboardOutlined",
  },
  // MÓDULO DE VENTAS
  {
    key: "ventas-nueva",
    label: "Nueva Venta (POS)",
    ruta: "/ventas/nueva",
    modulo: "VENTAS",
    permisosRequeridos: ["VEN_REGISTRAR"],
    iconoNombre: "ShoppingCartOutlined",
  },
  {
    key: "ventas-historial",
    label: "Historial de Ventas",
    ruta: "/ventas/historial",
    modulo: "VENTAS",
    permisosRequeridos: ["VEN_CONSULTAR", "GER_REPORTES"],
    iconoNombre: "FileTextOutlined",
  },
  // MÓDULO DE INVENTARIO Y ALMACÉN
  {
    key: "inventario-productos",
    label: "Productos y Stock",
    ruta: "/inventario/productos",
    modulo: "INVENTARIO",
    permisosRequeridos: ["INV_CONSULTAR", "INV_PRODUCTOS"],
    iconoNombre: "AppstoreOutlined",
  },
  {
    key: "inventario-movimientos",
    label: "Movimientos de Almacén",
    ruta: "/inventario/movimientos",
    modulo: "INVENTARIO",
    permisosRequeridos: ["INV_CONSULTAR", "INV_MOVIMIENTOS"],
    iconoNombre: "SwapOutlined",
  },
  {
    key: "inventario-solicitudes",
    label: "Solicitudes de Reposición",
    ruta: "/inventario/solicitudes",
    modulo: "INVENTARIO",
    permisosRequeridos: ["INV_SOLICITAR_REPOS", "ADQ_COTIZACIONES"],
    iconoNombre: "AlertOutlined",
  },
  {
    key: "inventario-recepcion",
    label: "Recepción de Compras",
    ruta: "/inventario/recepcion",
    modulo: "INVENTARIO",
    permisosRequeridos: ["INV_RECEPCION"],
    iconoNombre: "InboxOutlined",
  },
  // MÓDULO DE ADQUISICIONES
  {
    key: "adquisiciones-proveedores",
    label: "Proveedores",
    ruta: "/adquisiciones/proveedores",
    modulo: "ADQUISICIONES",
    permisosRequeridos: ["ADQ_PROVEEDORES"],
    iconoNombre: "TeamOutlined",
  },
  {
    key: "adquisiciones-requerimientos",
    label: "Requerimientos y Cotizaciones",
    ruta: "/adquisiciones/requerimientos",
    modulo: "ADQUISICIONES",
    permisosRequeridos: ["ADQ_COTIZACIONES", "ADQ_DECIDIR", "ADQ_ORDENES", "ADQ_CONSULTAR"],
    iconoNombre: "AuditOutlined",
  },
  {
    key: "adquisiciones-ordenes",
    label: "Órdenes de Compra / Servicio",
    ruta: "/adquisiciones/ordenes",
    modulo: "ADQUISICIONES",
    permisosRequeridos: ["ADQ_ORDENES", "ADQ_CONSULTAR"],
    iconoNombre: "ContainerOutlined",
  },
  // MÓDULO DE ADMINISTRACIÓN Y FINANZAS
  {
    key: "finanzas-verificaciones",
    label: "Verificación Presupuestal",
    ruta: "/finanzas/verificaciones",
    modulo: "FINANZAS",
    permisosRequeridos: ["FIN_VERIFICAR", "FIN_CONSULTAR"],
    iconoNombre: "CheckCircleOutlined",
  },
  {
    key: "finanzas-presupuesto",
    label: "Presupuesto Anual",
    ruta: "/finanzas/presupuesto",
    modulo: "FINANZAS",
    permisosRequeridos: ["FIN_CONSULTAR", "FIN_PRESUPUESTO"],
    iconoNombre: "DollarOutlined",
  },
  // GERENCIA GENERAL
  {
    key: "gerencia-reportes",
    label: "Reportes de Gerencia",
    ruta: "/gerencia/reportes",
    modulo: "GERENCIA",
    permisosRequeridos: ["GER_REPORTES"],
    iconoNombre: "BarChartOutlined",
  },
];

/**
 * Verifica si un usuario tiene al menos uno de los permisos indicados.
 */
export function tieneAlgunPermiso(
  usuario: UsuarioSesion | null | undefined,
  permisos: CodigoPermiso[]
): boolean {
  if (!usuario) return false;
  if (permisos.length === 0) return true;
  return permisos.some((p) => usuario.permisos.includes(p));
}

/**
 * Verifica si el usuario tiene un permiso específico.
 */
export function tienePermiso(
  usuario: UsuarioSesion | null | undefined,
  permiso: CodigoPermiso
): boolean {
  if (!usuario) return false;
  return usuario.permisos.includes(permiso);
}

/**
 * Lista de los 10 usuarios de prueba del script SQL para mostrar en el selector rápido del Login.
 */
export const USUARIOS_PRUEBA = [
  { username: "lparedes", nombre: "Lucía Paredes Ruiz", rol: "Vendedor", unidad: "Ventas" },
  { username: "dsalazar", nombre: "Diego Salazar Vega", rol: "Vendedor", unidad: "Ventas" },
  { username: "rmendoza", nombre: "Rosa Mendoza Torres", rol: "Jefe de Ventas", unidad: "Ventas" },
  { username: "chuaman", nombre: "Carlos Huamán Ríos", rol: "Almacenero", unidad: "Inventario y Almacén" },
  { username: "pquispe", nombre: "Patricia Quispe Lozano", rol: "Jefe de Almacén", unidad: "Inventario y Almacén" },
  { username: "jcastillo", nombre: "Jorge Castillo Bravo", rol: "Analista de Adquisiciones", unidad: "Adquisiciones" },
  { username: "mflores", nombre: "Mariela Flores Chávez", rol: "Jefe de Adquisiciones", unidad: "Adquisiciones" },
  { username: "arojas", nombre: "Andrés Rojas Díaz", rol: "Analista de Finanzas", unidad: "Administración y Finanzas" },
  { username: "evargas", nombre: "Elena Vargas Campos", rol: "Jefe de Finanzas", unidad: "Administración y Finanzas" },
  { username: "rgutierrez", nombre: "Ricardo Gutiérrez Soto", rol: "Gerente General", unidad: "Gerencia General" },
] as const;

export const INTEGRANTES_EQUIPO = [
  "Erick Piero Vasquez Silva",
  "Vanessa Llanos Julca",
  "Maryuri Navarro Estrella",
  "Willy Fernandes Hoyos",
  "Harvin Ander Fustamante Calderon",
] as const;
