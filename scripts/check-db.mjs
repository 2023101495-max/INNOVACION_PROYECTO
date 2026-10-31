import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan DATABASE_URL o SESSION_SECRET en .env.local.");
  process.exit(1);
}

const TABLAS_ESPERADAS = [
  "unidad_organica", "rol", "permiso", "rol_permiso", "usuario",
  "categoria", "marca", "producto", "alerta_stock", "solicitud_reposicion",
  "detalle_solicitud_reposicion", "venta", "detalle_venta", "proveedor",
  "adquisicion", "cotizacion", "detalle_cotizacion", "decision_adquisicion",
  "presupuesto", "verificacion_presupuestal", "movimiento_presupuestal",
  "replanteamiento", "orden", "detalle_orden", "coordinacion_entrega",
  "recepcion", "detalle_recepcion", "movimiento_inventario"
];

const VISTAS_ESPERADAS = [
  "v_ventas_detalle", "v_ventas_consolidado_diario", "v_ventas_por_producto",
  "v_inventario_consolidado", "v_productos_bajo_minimo", "v_historial_movimientos",
  "v_solicitudes_pendientes", "v_comparativo_cotizaciones", "v_historial_adquisiciones",
  "v_situacion_presupuestal", "v_historial_verificaciones", "v_adquisiciones_presupuesto",
  "v_permisos_usuario"
];

async function contarFilas(tabla) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}?select=count`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(`No se pudo consultar ${tabla}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data[0]?.count ?? 0;
}

async function verificarBD() {
  try {
    console.log("🔌 Conectando a Supabase con URL pública + Secret Key...");

    let tablasOk = 0;
    for (const t of TABLAS_ESPERADAS) {
      await contarFilas(t);
      tablasOk++;
    }

    let vistasOk = 0;
    for (const v of VISTAS_ESPERADAS) {
      await contarFilas(v);
      vistasOk++;
    }

    const total_usuarios = await contarFilas("usuario");
    const total_productos = await contarFilas("producto");
    const total_ventas = await contarFilas("venta");
    const total_adquisiciones = await contarFilas("adquisicion");
    const total_ordenes = await contarFilas("orden");
    const total_alertas = await contarFilas("alerta_stock");

    console.log("=====================================================");
    console.log("✅ CONEXIÓN EXITOSA A SUPABASE (ERP TecnoCel)");
    console.log("=====================================================");
    console.log(`• Tablas verificadas      : ${tablasOk} / 28`);
    console.log(`• Vistas verificadas      : ${vistasOk} / 13`);
    console.log(`• Filas en usuario        : ${total_usuarios}`);
    console.log(`• Filas en producto       : ${total_productos}`);
    console.log(`• Filas en venta          : ${total_ventas}`);
    console.log(`• Filas en adquisicion    : ${total_adquisiciones}`);
    console.log(`• Filas en orden          : ${total_ordenes}`);
    console.log(`• Filas en alerta_stock   : ${total_alertas}`);
    console.log("=====================================================");
  } catch (err) {
    console.error("❌ Error al verificar la base de datos:", err.message || err);
    process.exitCode = 1;
  }
}

verificarBD();
