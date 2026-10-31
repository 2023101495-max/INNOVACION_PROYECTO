"use client";

import React from "react";
import { Tag } from "antd";
import { COLORES_ERP } from "@/lib/tema";

const MAPA_ESTADOS: Record<string, { color: string; texto?: string }> = {
  // Generales / Producto / Usuario / Proveedor
  ACTIVO: { color: COLORES_ERP.verdeAcento, texto: "ACTIVO" },
  INACTIVO: { color: COLORES_ERP.rojoError, texto: "INACTIVO" },
  DISPONIBLE: { color: COLORES_ERP.verdeAcento, texto: "DISPONIBLE" },
  "REQUIERE REPOSICIÓN": { color: COLORES_ERP.rojoError, texto: "REQUIERE REPOSICIÓN" },

  // Alertas y Solicitudes de Reposición
  PENDIENTE: { color: COLORES_ERP.ambarAdvertencia, texto: "PENDIENTE" },
  EN_PROCESO: { color: COLORES_ERP.azulInfo, texto: "EN PROCESO" },
  ATENDIDA: { color: COLORES_ERP.verdeAcento, texto: "ATENDIDA" },
  RECHAZADA: { color: COLORES_ERP.rojoError, texto: "RECHAZADA" },
  POSPUESTA: { color: COLORES_ERP.ambarAdvertencia, texto: "POSPUESTA" },

  // Adquisiciones
  EN_COTIZACION: { color: COLORES_ERP.azulInfo, texto: "EN COTIZACIÓN" },
  EN_VERIFICACION: { color: COLORES_ERP.ambarAdvertencia, texto: "EN VERIFICACIÓN" },
  AUTORIZADA: { color: COLORES_ERP.verdeAcento, texto: "AUTORIZADA" },
  SIN_DISPONIBILIDAD: { color: COLORES_ERP.rojoError, texto: "SIN DISPONIBILIDAD" },
  REPLANTEADA: { color: COLORES_ERP.azulInfo, texto: "REPLANTEADA" },
  CON_ORDEN: { color: COLORES_ERP.azulProfundo, texto: "CON ORDEN" },
  FINALIZADA: { color: COLORES_ERP.verdeAcento, texto: "FINALIZADA" },

  // Cotizaciones
  REGISTRADA: { color: COLORES_ERP.azulInfo, texto: "REGISTRADA" },
  SELECCIONADA: { color: COLORES_ERP.verdeAcento, texto: "SELECCIONADA" },
  DESCARTADA: { color: "#8c8c8c", texto: "DESCARTADA" },

  // Verificación Presupuestal
  CON_DISPONIBILIDAD: { color: COLORES_ERP.verdeAcento, texto: "CON DISPONIBILIDAD" },
  REPLANTEAR: { color: COLORES_ERP.ambarAdvertencia, texto: "REPLANTEAR" },

  // Presupuesto
  ABIERTO: { color: COLORES_ERP.verdeAcento, texto: "ABIERTO" },
  CERRADO: { color: "#595959", texto: "CERRADO" },

  // Órdenes
  EMITIDA: { color: COLORES_ERP.azulInfo, texto: "EMITIDA" },
  ENVIADA: { color: COLORES_ERP.azulProfundo, texto: "ENVIADA" },
  EN_TRANSITO: { color: COLORES_ERP.ambarAdvertencia, texto: "EN TRÁNSITO" },
  RECIBIDA_PARCIAL: { color: COLORES_ERP.ambarAdvertencia, texto: "RECIBIDA PARCIAL" },
  RECIBIDA: { color: COLORES_ERP.verdeAcento, texto: "RECIBIDA" },
  CONFORME: { color: COLORES_ERP.verdeAcento, texto: "CONFORME" },
  ANULADA: { color: COLORES_ERP.rojoError, texto: "ANULADA" },

  // Movimientos de Inventario / Presupuesto
  ENTRADA: { color: COLORES_ERP.verdeAcento, texto: "ENTRADA" },
  SALIDA: { color: COLORES_ERP.rojoError, texto: "SALIDA" },
  ASIGNACION: { color: COLORES_ERP.verdeAcento, texto: "ASIGNACIÓN" },
  COMPROMISO: { color: COLORES_ERP.azulInfo, texto: "COMPROMISO" },
  LIBERACION: { color: COLORES_ERP.ambarAdvertencia, texto: "LIBERACIÓN" },
  REDUCCION: { color: COLORES_ERP.rojoError, texto: "REDUCCIÓN" },
  BIEN: { color: COLORES_ERP.azulInfo, texto: "BIEN" },
  SERVICIO: { color: COLORES_ERP.azulProfundo, texto: "SERVICIO" },
  COMPRA: { color: COLORES_ERP.azulInfo, texto: "ORDEN COMPRA" },
};

export default function EtiquetaEstado({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <span>—</span>;
  const cfg = MAPA_ESTADOS[estado] || { color: COLORES_ERP.azulProfundo, texto: estado };
  return (
    <Tag
      color={cfg.color}
      style={{
        fontWeight: 600,
        borderRadius: 4,
        padding: "1px 8px",
        color: cfg.color === COLORES_ERP.verdeAcento ? COLORES_ERP.fondoOscuro : "#ffffff",
      }}
    >
      {cfg.texto || estado}
    </Tag>
  );
}
