import React from "react";
import { exigirPermisoPagina } from "@/lib/sesion";
import { supabaseAdmin } from "@/lib/db";
import ProveedoresClient from "./ProveedoresClient";

export default async function ProveedoresPage() {
  await exigirPermisoPagina(["ADQ_PROVEEDORES"]);

  const { data: proveedores } = await supabaseAdmin
    .from("proveedor")
    .select("*")
    .order("razon_social", { ascending: true });

  return <ProveedoresClient proveedoresIniciales={proveedores || []} />;
}
