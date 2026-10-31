import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import HistorialVentasClient from "./HistorialVentasClient";

export default async function HistorialVentasPage() {
  await exigirPermisoPagina(["VEN_CONSULTAR", "GER_REPORTES"]);

  // Consultar todas las ventas con sus datos de vendedor
  const { data: ventas } = await supabaseAdmin
    .from("venta")
    .select(
      `
      id_venta,
      nro_venta,
      fecha_hora,
      total,
      observacion,
      id_usuario,
      usuario:usuario (
        username,
        nombres,
        apellidos
      )
    `
    )
    .order("fecha_hora", { ascending: false });

  // Lista de vendedores únicos para el filtro
  const { data: usuariosVendedores } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario, username, nombres, apellidos")
    .order("nombres", { ascending: true });

  const ventasAdaptadas = (ventas || []).map((v) => {
    const usr = Array.isArray(v.usuario) ? v.usuario[0] : v.usuario;
    return {
      id_venta: v.id_venta,
      nro_venta: v.nro_venta,
      fecha_hora: v.fecha_hora,
      total: Number(v.total),
      observacion: v.observacion || "",
      id_usuario: v.id_usuario,
      vendedor: usr ? `${usr.nombres} ${usr.apellidos}` : "Desconocido",
      username: usr?.username || "",
    };
  });

  return (
    <HistorialVentasClient
      ventasIniciales={ventasAdaptadas}
      vendedores={usuariosVendedores || []}
    />
  );
}
