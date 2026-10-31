"use client";

import React from "react";
import { Typography, Space } from "antd";
import { COLORES_ERP } from "@/lib/tema";

interface Props {
  titulo: string;
  subtitulo?: string;
  extra?: React.ReactNode;
}

export default function EncabezadoPagina({ titulo, subtitulo, extra }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div>
        <Typography.Title
          level={3}
          style={{ margin: 0, color: COLORES_ERP.azulProfundo, fontWeight: 700 }}
        >
          {titulo}
        </Typography.Title>
        {subtitulo && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {subtitulo}
          </Typography.Text>
        )}
      </div>
      {extra && (
        <Space wrap className="no-print">
          {extra}
        </Space>
      )}
    </div>
  );
}
