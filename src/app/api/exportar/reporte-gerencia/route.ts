import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/db";
import { verificarTokenSesion, COOKIE_SESION } from "@/lib/sesion";
import { tienePermiso } from "@/lib/permisos";
import { formatearFechaHora } from "@/lib/formato";

export async function GET(req: NextRequest) {
  try {
    // 1. Validar autenticación y permiso GER_REPORTES
    const token = req.cookies.get(COOKIE_SESION)?.value;
    const sesion = token ? await verificarTokenSesion(token) : null;

    if (!sesion || !tienePermiso(sesion, "GER_REPORTES")) {
      return new NextResponse("No autorizado para exportar reportes de Gerencia.", {
        status: 403,
      });
    }

    // 2. Consultar datos de las vistas del script SQL
    const [{ data: ventasDiarias }, { data: ventasProducto }, { data: inventario }, { data: adquisiciones }, { data: presupuesto }] =
      await Promise.all([
        supabaseAdmin.from("v_ventas_consolidado_diario").select("*").order("fecha", { ascending: false }),
        supabaseAdmin.from("v_ventas_por_producto").select("*").order("monto_vendido", { ascending: false }),
        supabaseAdmin.from("v_inventario_consolidado").select("*").order("producto", { ascending: true }),
        supabaseAdmin.from("v_historial_adquisiciones").select("*").order("fecha_registro", { ascending: false }),
        supabaseAdmin.from("v_situacion_presupuestal").select("*").order("anio", { ascending: false }),
      ]);

    // 3. Crear el libro Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ERP TecnoCel — Gerencia General";
    workbook.created = new Date();

    const estiloHeader = {
      font: { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF132D46" }, // Azul profundo del ERP
      },
      alignment: { vertical: "middle" as const, horizontal: "center" as const },
    };

    // -------------------------------------------------------------
    // HOJA 1: RESUMEN Y VENTAS DIARIAS
    // -------------------------------------------------------------
    const wsVentasDia = workbook.addWorksheet("Ventas por Día");
    wsVentasDia.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "N° Transacciones", key: "nro_ventas", width: 18 },
      { header: "Unidades Vendidas", key: "unidades_vendidas", width: 18 },
      { header: "Monto Vendido (S/)", key: "monto_vendido", width: 22 },
    ];
    wsVentasDia.getRow(1).eachCell((cell) => Object.assign(cell, estiloHeader));

    (ventasDiarias || []).forEach((r) => {
      wsVentasDia.addRow({
        fecha: r.fecha,
        nro_ventas: Number(r.nro_ventas),
        unidades_vendidas: Number(r.unidades_vendidas),
        monto_vendido: Number(r.monto_vendido),
      });
    });
    wsVentasDia.getColumn("monto_vendido").numFmt = '"S/ "#,##0.00';

    // -------------------------------------------------------------
    // HOJA 2: VENTAS POR PRODUCTO
    // -------------------------------------------------------------
    const wsVentasProd = workbook.addWorksheet("Ventas por Producto");
    wsVentasProd.columns = [
      { header: "Código", key: "codigo", width: 14 },
      { header: "Producto", key: "producto", width: 35 },
      { header: "Categoría", key: "categoria", width: 22 },
      { header: "Unidades Vendidas", key: "unidades_vendidas", width: 18 },
      { header: "Monto Vendido (S/)", key: "monto_vendido", width: 22 },
    ];
    wsVentasProd.getRow(1).eachCell((cell) => Object.assign(cell, estiloHeader));

    (ventasProducto || []).forEach((r) => {
      wsVentasProd.addRow({
        codigo: r.codigo,
        producto: r.producto,
        categoria: r.categoria,
        unidades_vendidas: Number(r.unidades_vendidas),
        monto_vendido: Number(r.monto_vendido),
      });
    });
    wsVentasProd.getColumn("monto_vendido").numFmt = '"S/ "#,##0.00';

    // -------------------------------------------------------------
    // HOJA 3: INVENTARIO CONSOLIDADO
    // -------------------------------------------------------------
    const wsInv = workbook.addWorksheet("Inventario Consolidado");
    wsInv.columns = [
      { header: "Código", key: "codigo", width: 14 },
      { header: "Producto", key: "producto", width: 35 },
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Marca", key: "marca", width: 16 },
      { header: "P. Venta (S/)", key: "precio_venta", width: 16 },
      { header: "Stock Actual", key: "stock_actual", width: 14 },
      { header: "Stock Mínimo", key: "stock_minimo", width: 14 },
      { header: "Valorizado Venta (S/)", key: "valor_inventario_venta", width: 24 },
      { header: "Situación", key: "situacion", width: 22 },
    ];
    wsInv.getRow(1).eachCell((cell) => Object.assign(cell, estiloHeader));

    (inventario || []).forEach((r) => {
      wsInv.addRow({
        codigo: r.codigo,
        producto: r.producto,
        categoria: r.categoria,
        marca: r.marca,
        precio_venta: Number(r.precio_venta),
        stock_actual: Number(r.stock_actual),
        stock_minimo: Number(r.stock_minimo),
        valor_inventario_venta: Number(r.valor_inventario_venta),
        situacion: r.situacion,
      });
    });
    wsInv.getColumn("precio_venta").numFmt = '"S/ "#,##0.00';
    wsInv.getColumn("valor_inventario_venta").numFmt = '"S/ "#,##0.00';

    // -------------------------------------------------------------
    // HOJA 4: ADQUISICIONES
    // -------------------------------------------------------------
    const wsAdq = workbook.addWorksheet("Adquisiciones");
    wsAdq.columns = [
      { header: "N° Adquisición", key: "nro_adquisicion", width: 16 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Descripción", key: "descripcion", width: 38 },
      { header: "Fecha Registro", key: "fecha_registro", width: 18 },
      { header: "Monto Estimado (S/)", key: "monto_estimado", width: 20 },
      { header: "Estado Adquisición", key: "estado_adquisicion", width: 20 },
      { header: "N° Orden", key: "nro_orden", width: 16 },
      { header: "Proveedor", key: "proveedor", width: 32 },
      { header: "Monto Orden (S/)", key: "monto_orden", width: 18 },
      { header: "Estado Orden", key: "estado_orden", width: 16 },
    ];
    wsAdq.getRow(1).eachCell((cell) => Object.assign(cell, estiloHeader));

    (adquisiciones || []).forEach((r) => {
      wsAdq.addRow({
        nro_adquisicion: r.nro_adquisicion,
        tipo: r.tipo,
        descripcion: r.descripcion,
        fecha_registro: r.fecha_registro ? r.fecha_registro.substring(0, 10) : "",
        monto_estimado: Number(r.monto_estimado || 0),
        estado_adquisicion: r.estado_adquisicion,
        nro_orden: r.nro_orden || "—",
        proveedor: r.proveedor || "—",
        monto_orden: r.monto_orden ? Number(r.monto_orden) : 0,
        estado_orden: r.estado_orden || "—",
      });
    });
    wsAdq.getColumn("monto_estimado").numFmt = '"S/ "#,##0.00';
    wsAdq.getColumn("monto_orden").numFmt = '"S/ "#,##0.00';

    // -------------------------------------------------------------
    // HOJA 5: PRESUPUESTO
    // -------------------------------------------------------------
    const wsPres = workbook.addWorksheet("Situación Presupuestal");
    wsPres.columns = [
      { header: "Año", key: "anio", width: 10 },
      { header: "Descripción", key: "descripcion", width: 35 },
      { header: "Asignado (S/)", key: "monto_asignado", width: 20 },
      { header: "Comprometido (S/)", key: "monto_comprometido", width: 20 },
      { header: "Disponible (S/)", key: "monto_disponible", width: 20 },
      { header: "% Ejecución", key: "porcentaje_ejecucion", width: 15 },
      { header: "Estado", key: "estado", width: 14 },
    ];
    wsPres.getRow(1).eachCell((cell) => Object.assign(cell, estiloHeader));

    (presupuesto || []).forEach((r) => {
      wsPres.addRow({
        anio: r.anio,
        descripcion: r.descripcion,
        monto_asignado: Number(r.monto_asignado),
        monto_comprometido: Number(r.monto_comprometido),
        monto_disponible: Number(r.monto_disponible),
        porcentaje_ejecucion: `${r.porcentaje_ejecucion}%`,
        estado: r.estado,
      });
    });
    wsPres.getColumn("monto_asignado").numFmt = '"S/ "#,##0.00';
    wsPres.getColumn("monto_comprometido").numFmt = '"S/ "#,##0.00';
    wsPres.getColumn("monto_disponible").numFmt = '"S/ "#,##0.00';

    // Generar buffer binario
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Reporte_Gerencial_ERP_TecnoCel_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error al generar reporte Excel:", error);
    return new NextResponse("Error al generar reporte Excel.", { status: 500 });
  }
}
