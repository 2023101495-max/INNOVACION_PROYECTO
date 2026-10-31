"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Typography,
  Spin,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import { formatearMoneda, formatearFechaHora, dayjs } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import { obtenerDetalleVentaAction } from "@/app/actions/ventas";

interface VentaItem {
  id_venta: number;
  nro_venta: string;
  fecha_hora: string;
  total: number;
  observacion: string;
  id_usuario: number;
  vendedor: string;
  username: string;
}

interface VendedorItem {
  id_usuario: number;
  username: string;
  nombres: string;
  apellidos: string;
}

export default function HistorialVentasClient({
  ventasIniciales,
  vendedores,
}: {
  ventasIniciales: VentaItem[];
  vendedores: VendedorItem[];
}) {
  const [ventas] = useState<VentaItem[]>(ventasIniciales);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState<string | null>(null);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(
    null
  );

  // Modal de detalle
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<any>(null);

  // Filtrado reactivo en cliente (RF-VEN-12)
  const ventasFiltradas = ventas.filter((v) => {
    // Filtro texto (N° venta o producto u observación)
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const matchNro = v.nro_venta.toLowerCase().includes(q);
      const matchObs = v.observacion.toLowerCase().includes(q);
      if (!matchNro && !matchObs) return false;
    }

    // Filtro vendedor
    if (filtroVendedor && v.username !== filtroVendedor) {
      return false;
    }

    // Filtro fechas
    if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
      const fVenta = dayjs(v.fecha_hora);
      const inicio = rangoFechas[0].startOf("day");
      const fin = rangoFechas[1].endOf("day");
      if (fVenta.isBefore(inicio) || fVenta.isAfter(fin)) {
        return false;
      }
    }

    return true;
  });

  const handleVerDetalle = async (idVenta: number) => {
    setModalAbierto(true);
    setCargandoDetalle(true);
    const res = await obtenerDetalleVentaAction(idVenta);
    if (res.ok) {
      setDetalleVenta(res.venta);
    }
    setCargandoDetalle(false);
  };

  const totalFiltrado = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);

  return (
    <div>
      <EncabezadoPagina
        titulo="Historial de Ventas"
        subtitulo="Consulta y trazabilidad de todas las operaciones de venta registradas (RF-VEN-11, 12)"
      />

      {/* Barra de Filtros (RF-VEN-12: fecha, usuario, texto) */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} lg={6}>
            <Input
              placeholder="Buscar por N° Venta..."
              prefix={<SearchOutlined />}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} lg={6}>
            <Select
              placeholder="Filtrar por Vendedor"
              allowClear
              style={{ width: "100%" }}
              value={filtroVendedor}
              onChange={(val) => setFiltroVendedor(val)}
              options={vendedores.map((u) => ({
                value: u.username,
                label: `${u.nombres} ${u.apellidos} (${u.username})`,
              }))}
            />
          </Col>
          <Col xs={24} sm={8} lg={8}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Desde", "Hasta"]}
              value={rangoFechas as any}
              onChange={(fechas) => setRangoFechas(fechas as any)}
            />
          </Col>
          <Col xs={24} sm={24} lg={4} style={{ textAlign: "right" }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFiltroTexto("");
                setFiltroVendedor(null);
                setRangoFechas(null);
              }}
            >
              Limpiar
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Resumen del filtro */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Mostrando <b>{ventasFiltradas.length}</b> ventas encontradas
        </span>
        <Tag color="cyan" style={{ fontSize: 13, padding: "3px 10px", fontWeight: 700 }}>
          Monto Total: {formatearMoneda(totalFiltrado)}
        </Tag>
      </div>

      {/* Tabla de Historial */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_venta"
          dataSource={ventasFiltradas}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "N° Venta",
              dataIndex: "nro_venta",
              key: "nro_venta",
              width: 120,
              render: (nro: string) => (
                <Tag color="blue" style={{ fontWeight: 700 }}>
                  {nro}
                </Tag>
              ),
            },
            {
              title: "Fecha y Hora",
              dataIndex: "fecha_hora",
              key: "fecha_hora",
              width: 160,
              render: (f: string) => formatearFechaHora(f),
            },
            {
              title: "Vendedor",
              dataIndex: "vendedor",
              key: "vendedor",
              render: (nom: string, r: VentaItem) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{nom}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Usuario: {r.username}</div>
                </div>
              ),
            },
            {
              title: "Observación",
              dataIndex: "observacion",
              key: "observacion",
              render: (obs: string) => obs || <span style={{ color: "#94a3b8" }}>—</span>,
            },
            {
              title: "Total",
              dataIndex: "total",
              key: "total",
              width: 130,
              align: "right",
              render: (t: number) => (
                <span
                  style={{
                    color: COLORES_ERP.verdeAcento,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {formatearMoneda(t)}
                </span>
              ),
            },
            {
              title: "Acción",
              key: "accion",
              width: 110,
              align: "center",
              render: (_: unknown, r: VentaItem) => (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleVerDetalle(r.id_venta)}
                >
                  Detalle
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal de Detalle Imprimible */}
      <Modal
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        width={620}
        footer={[
          <Button
            key="imprimir"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Imprimir Comprobante
          </Button>,
          <Button key="cerrar" onClick={() => setModalAbierto(false)}>
            Cerrar
          </Button>,
        ]}
      >
        {cargandoDetalle ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : detalleVenta ? (
          <div className="printable-card" style={{ padding: "8px 4px" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Typography.Title level={3} style={{ margin: 0, color: COLORES_ERP.azulProfundo }}>
                ERP TecnoCel
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Comercializadora de Productos Tecnológicos · RUC: 20601234561
              </Typography.Text>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORES_ERP.azulProfundo, marginTop: 4 }}>
                COMPROBANTE DE VENTA: {detalleVenta.nro_venta}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13,
                border: "1px solid #e2e8f0",
              }}
            >
              <div>
                <div>
                  <b>Fecha:</b> {formatearFechaHora(detalleVenta.fecha_hora)}
                </div>
                {detalleVenta.observacion && (
                  <div>
                    <b>Observación:</b> {detalleVenta.observacion}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div>
                  <b>Vendedor:</b> {detalleVenta.usuario?.nombres} {detalleVenta.usuario?.apellidos}
                </div>
                <div>
                  <b>Usuario:</b> {detalleVenta.usuario?.username}
                </div>
              </div>
            </div>

            <Table
              size="small"
              pagination={false}
              rowKey="id_detalle_venta"
              dataSource={detalleVenta.detalle_venta || []}
              columns={[
                {
                  title: "Código",
                  dataIndex: ["producto", "codigo"],
                  key: "codigo",
                  width: 90,
                },
                {
                  title: "Producto",
                  dataIndex: ["producto", "nombre"],
                  key: "prod",
                },
                {
                  title: "Cant.",
                  dataIndex: "cantidad",
                  key: "cant",
                  width: 60,
                  align: "center",
                },
                {
                  title: "P. Unitario",
                  dataIndex: "precio_unitario",
                  key: "pu",
                  width: 100,
                  align: "right",
                  render: (val: number) => formatearMoneda(val),
                },
                {
                  title: "Importe",
                  dataIndex: "importe",
                  key: "imp",
                  width: 110,
                  align: "right",
                  render: (val: number) => (
                    <span style={{ fontWeight: 700 }}>{formatearMoneda(val)}</span>
                  ),
                },
              ]}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16,
                paddingTop: 12,
                borderTop: "2px solid #cbd5e1",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 14, marginRight: 12 }}>TOTAL VENTA:</span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: COLORES_ERP.verdeAcento,
                  }}
                >
                  {formatearMoneda(detalleVenta.total)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
