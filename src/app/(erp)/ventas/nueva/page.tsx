import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import NuevaVentaClient from "./NuevaVentaClient";

export default async function NuevaVentaPage() {
  const usuario = await exigirPermisoPagina(["VEN_REGISTRAR"]);

  // Obtener catálogo de productos activos con su categoría y marca para el POS
  const { data: productos } = await supabaseAdmin
    .from("producto")
    .select(
      `
      id_producto,
      codigo,
      nombre,
      modelo,
      precio_venta,
      stock_actual,
      stock_minimo,
      categoria:categoria (nombre),
      marca:marca (nombre)
    `
    )
    .eq("estado", "ACTIVO")
    .order("nombre", { ascending: true });

  const productosAdaptados = (productos || []).map((p) => {
    const cat = Array.isArray(p.categoria) ? p.categoria[0] : p.categoria;
    const mar = Array.isArray(p.marca) ? p.marca[0] : p.marca;
    return {
      id_producto: p.id_producto,
      codigo: p.codigo,
      nombre: p.nombre,
      modelo: p.modelo || "",
      precio_venta: Number(p.precio_venta),
      stock_actual: Number(p.stock_actual),
      stock_minimo: Number(p.stock_minimo),
      categoria: cat?.nombre || "",
      marca: mar?.nombre || "",
    };
  });

  return <NuevaVentaClient usuario={usuario} productosIniciales={productosAdaptados} />;
}
