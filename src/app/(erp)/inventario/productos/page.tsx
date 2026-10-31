import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import { tienePermiso } from "@/lib/permisos";
import ProductosClient from "./ProductosClient";

export default async function ProductosPage() {
  const usuario = await exigirPermisoPagina(["INV_CONSULTAR", "INV_PRODUCTOS"]);
  const puedeEditar = tienePermiso(usuario, "INV_PRODUCTOS");

  // Consultar todos los productos con categorías y marcas
  const { data: productos } = await supabaseAdmin
    .from("producto")
    .select(
      `
      id_producto,
      codigo,
      nombre,
      modelo,
      descripcion,
      id_categoria,
      id_marca,
      precio_venta,
      stock_actual,
      stock_minimo,
      estado,
      categoria:categoria (id_categoria, nombre),
      marca:marca (id_marca, nombre)
    `
    )
    .order("nombre", { ascending: true });

  const { data: categorias } = await supabaseAdmin
    .from("categoria")
    .select("id_categoria, nombre")
    .order("nombre", { ascending: true });

  const { data: marcas } = await supabaseAdmin
    .from("marca")
    .select("id_marca, nombre")
    .order("nombre", { ascending: true });

  const productosAdaptados = (productos || []).map((p) => {
    const cat = Array.isArray(p.categoria) ? p.categoria[0] : p.categoria;
    const mar = Array.isArray(p.marca) ? p.marca[0] : p.marca;
    return {
      id_producto: p.id_producto,
      codigo: p.codigo,
      nombre: p.nombre,
      modelo: p.modelo || "",
      descripcion: p.descripcion || "",
      id_categoria: p.id_categoria,
      id_marca: p.id_marca,
      categoria: cat?.nombre || "",
      marca: mar?.nombre || "",
      precio_venta: Number(p.precio_venta),
      stock_actual: Number(p.stock_actual),
      stock_minimo: Number(p.stock_minimo),
      estado: p.estado as "ACTIVO" | "INACTIVO",
      bajo_minimo: p.stock_actual < p.stock_minimo,
    };
  });

  return (
    <ProductosClient
      puedeEditar={puedeEditar}
      productosIniciales={productosAdaptados}
      categoriasIniciales={categorias || []}
      marcasIniciales={marcas || []}
    />
  );
}
