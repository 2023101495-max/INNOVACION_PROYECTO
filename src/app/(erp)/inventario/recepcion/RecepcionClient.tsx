"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  InputNumber,
  Row,
  Col,
  Tabs,
  Typography,
  Alert,
  message,
} from "antd";
import {
  InboxOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearFecha, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import { registrarRecepcionAction } from "@/app/actions/inventario";

interface ItemOrdenRecepcion {
  id_detalle_orden: number;
  id_producto: number;
  codigo: string;
  nombre: string;
  cantidad_ordenada: number;
  cantidad_previa: number;
  cantidad_pendiente: number;
  precio_unitario: number;
}

interface OrdenRecepcion {
  id_orden: number;
  nro_orden: string;
  fecha_emision: string;
  fecha_entrega_pactada: string | null;
  estado: string;
  condiciones: string;
  proveedor: string;
  ruc: string;
  items: ItemOrdenRecepcion[];
}

interface HistorialRecepcionUI {
  id_recepcion: number;
  nro_recepcion: string;
  fecha_recepcion: string;
  guia_remision: string;
  nro_orden: string;
  proveedor: string;
  almacenero: string;
  observacion: string;
}

export default function RecepcionClient({
  ordenesPendientes,
  historialRecepciones,
}: {
  ordenesPendientes: OrdenRecepcion[];
  historialRecepciones: HistorialRecepcionUI[];
}) {
  const [ordenes, setOrdenes] = useState<OrdenRecepcion[]>(ordenesPendientes);
  const [historial, setHistorial] = useState<HistorialRecepcionUI[]>(historialRecepciones);

  // Orden seleccionada para recepción
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<number | null>(
    ordenes[0]?.id_orden || null
  );

  // Cantidades ingresadas por el almacenero: { [id_detalle_orden]: cantidad }
  const [cantidadesRecibir, setCantidadesRecibir] = useState<Record<number, number>>({});
  const [guiaRemision, setGuiaRemision] = useState("");
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const ordenActual = ordenes.find((o) => o.id_orden === ordenSeleccionadaId);

  // Pre-llenar cantidades con lo pendiente al cambiar de orden
  const handleSeleccionarOrden = (id: number) => {
    setOrdenSeleccionadaId(id);
    const ord = ordenes.find((o) => o.id_orden === id);
    if (ord) {
      const inicial: Record<number, number> = {};
      ord.items.forEach((it) => {
        inicial[it.id_detalle_orden] = it.cantidad_pendiente;
      });
      setCantidadesRecibir(inicial);
    }
  };

  const handleCambiarCantidad = (idDetalle: number, val: number | null) => {
    setCantidadesRecibir((prev) => ({
      ...prev,
      [idDetalle]: val ?? 0,
    }));
  };

  const handleRegistrarRecepcion = async () => {
    if (!ordenActual) return;

    const itemsPayload = ordenActual.items.map((it) => ({
      id_detalle_orden: it.id_detalle_orden,
      cantidad_recibida: cantidadesRecibir[it.id_detalle_orden] || 0,
    }));

    const totalRecibir = itemsPayload.reduce((acc, i) => acc + i.cantidad_recibida, 0);
    if (totalRecibir <= 0) {
      message.error("Debe ingresar una cantidad mayor a cero para al menos un producto.");
      return;
    }

    setGuardando(true);
    const res = await registrarRecepcionAction({
      id_orden: ordenActual.id_orden,
      guia_remision: guiaRemision,
      observacion,
      items: itemsPayload,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar la recepción.");
      setGuardando(false);
      return;
    }

    message.success(
      `Recepción ${res.nro_recepcion} registrada exitosamente. El stock en almacén ha sido incrementado.`
    );

    // Agregar al historial local
    const nuevoHistorial: HistorialRecepcionUI = {
      id_recepcion: Date.now(),
      nro_recepcion: res.nro_recepcion || "RC-000000",
      fecha_recepcion: new Date().toISOString(),
      guia_remision: guiaRemision || "—",
      nro_orden: ordenActual.nro_orden,
      proveedor: ordenActual.proveedor,
      almacenero: "Almacenero",
      observacion: observacion || "—",
    };
    setHistorial((prev) => [nuevoHistorial, ...prev]);

    // Actualizar pendientes
    if (res.estado_orden === "RECIBIDA") {
      // Remover orden de la lista de pendientes
      setOrdenes((prev) => prev.filter((o) => o.id_orden !== ordenActual.id_orden));
      setOrdenSeleccionadaId(null);
    } else {
      // Actualizar cantidades pendientes de la orden
      setOrdenes((prev) =>
        prev.map((o) => {
          if (o.id_orden === ordenActual.id_orden) {
            return {
              ...o,
              estado: res.estado_orden || "RECIBIDA_PARCIAL",
              items: o.items.map((it) => {
                const rec = cantidadesRecibir[it.id_detalle_orden] || 0;
                return {
                  ...it,
                  cantidad_previa: it.cantidad_previa + rec,
                  cantidad_pendiente: Math.max(0, it.cantidad_pendiente - rec),
                };
              }),
            };
          }
          return o;
        })
      );
    }

    setGuiaRemision("");
    setObservacion("");
    setGuardando(false);
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Recepción de Mercadería"
        subtitulo="Ingreso físico de productos a almacén contra órdenes de compra emitidas (RF-INV-11, 12)"
      />

      <Tabs
        defaultActiveKey="recepcionar"
        items={[
          {
            key: "recepcionar",
            label: (
              <span>
                <InboxOutlined /> Recepcionar Orden de Compra
              </span>
            ),
            children: (
              <div>
                {ordenes.length === 0 ? (
                  <Alert
                    type="success"
                    showIcon
                    message="No hay órdenes de compra pendientes de recibir"
                    description="Todas las órdenes de compra emitidas han sido recibidas y el inventario se encuentra al día."
                    style={{ marginBottom: 20 }}
                  />
                ) : (
                  <Row gutter={[16, 16]}>
                    {/* Selector y datos de la Orden */}
                    <Col xs={24} lg={8}>
                      <Card title="Seleccionar Orden de Compra">
                        <div style={{ marginBottom: 16 }}>
                          <span style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>
                            Órdenes de Compra en Tránsito / Emitidas:
                          </span>
                          <Select
                            style={{ width: "100%" }}
                            value={ordenSeleccionadaId}
                            onChange={handleSeleccionarOrden}
                            options={ordenes.map((o) => ({
                              value: o.id_orden,
                              label: `${o.nro_orden} — ${o.proveedor} (${o.estado})`,
                            }))}
                          />
                        </div>

                        {ordenActual && (
                          <div
                            style={{
                              background: "#f8fafc",
                              padding: 14,
                              borderRadius: 8,
                              border: "1px solid #e2e8f0",
                              fontSize: 13,
                            }}
                          >
                            <div style={{ marginBottom: 6 }}>
                              <b>Proveedor:</b> {ordenActual.proveedor}
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <b>RUC:</b> {ordenActual.ruc}
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <b>Fecha Emisión:</b> {formatearFechaHora(ordenActual.fecha_emision)}
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <b>Fecha Entrega Pactada:</b>{" "}
                              {formatearFecha(ordenActual.fecha_entrega_pactada)}
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <b>Estado Actual:</b> <EtiquetaEstado estado={ordenActual.estado} />
                            </div>
                            {ordenActual.condiciones && (
                              <div>
                                <b>Condiciones:</b> {ordenActual.condiciones}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ marginTop: 16 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                            N° Guía de Remisión del Proveedor (RF-INV-11):
                          </span>
                          <Input
                            placeholder="Ej. T001-004512"
                            prefix={<BarcodeOutlined />}
                            value={guiaRemision}
                            onChange={(e) => setGuiaRemision(e.target.value)}
                          />
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                            Observación de la recepción:
                          </span>
                          <Input.TextArea
                            rows={2}
                            placeholder="Ej. Primer despacho recibido conforme en almacén central..."
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                          />
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          block
                          icon={<CheckCircleOutlined />}
                          loading={guardando}
                          disabled={!ordenActual}
                          onClick={handleRegistrarRecepcion}
                          style={{ marginTop: 20 }}
                        >
                          Confirmar Recepción de Productos
                        </Button>
                      </Card>
                    </Col>

                    {/* Tabla de Productos de la Orden para Recepción */}
                    <Col xs={24} lg={16}>
                      <Card
                        title={
                          <span>
                            Productos de la Orden {ordenActual ? ordenActual.nro_orden : ""} (
                            {ordenActual?.items.length || 0} ítems)
                          </span>
                        }
                        styles={{ body: { padding: 0 } }}
                      >
                        <Table
                          size="middle"
                          rowKey="id_detalle_orden"
                          pagination={false}
                          dataSource={ordenActual?.items || []}
                          columns={[
                            {
                              title: "Código",
                              dataIndex: "codigo",
                              key: "codigo",
                              width: 95,
                              render: (c: string) => <Tag color="blue">{c}</Tag>,
                            },
                            {
                              title: "Producto",
                              dataIndex: "nombre",
                              key: "nombre",
                              render: (nom: string) => <b style={{ color: COLORES_ERP.azulProfundo }}>{nom}</b>,
                            },
                            {
                              title: "Ordenado",
                              dataIndex: "cantidad_ordenada",
                              key: "cant_ord",
                              width: 90,
                              align: "center",
                            },
                            {
                              title: "Ya Recibido",
                              dataIndex: "cantidad_previa",
                              key: "cant_prev",
                              width: 95,
                              align: "center",
                              render: (c: number) => <Tag color={c > 0 ? "cyan" : "default"}>{c}</Tag>,
                            },
                            {
                              title: "Pendiente",
                              dataIndex: "cantidad_pendiente",
                              key: "cant_pend",
                              width: 90,
                              align: "center",
                              render: (c: number) => (
                                <span style={{ color: c > 0 ? COLORES_ERP.rojoError : COLORES_ERP.verdeAcento, fontWeight: 700 }}>
                                  {c}
                                </span>
                              ),
                            },
                            {
                              title: "A Recibir Hoy",
                              key: "a_recibir",
                              width: 130,
                              align: "center",
                              render: (_: unknown, it: ItemOrdenRecepcion) => (
                                <InputNumber
                                  min={0}
                                  max={it.cantidad_pendiente}
                                  value={cantidadesRecibir[it.id_detalle_orden] ?? it.cantidad_pendiente}
                                  onChange={(val) => handleCambiarCantidad(it.id_detalle_orden, val)}
                                  disabled={it.cantidad_pendiente === 0}
                                />
                              ),
                            },
                          ]}
                        />
                      </Card>
                    </Col>
                  </Row>
                )}
              </div>
            ),
          },
          {
            key: "historial",
            label: (
              <span>
                <FileDoneOutlined /> Historial de Recepciones
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_recepcion"
                  dataSource={historial}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "N° Recepción",
                      dataIndex: "nro_recepcion",
                      key: "nro_recepcion",
                      width: 130,
                      render: (n: string) => <Tag color="green" style={{ fontWeight: 700 }}>{n}</Tag>,
                    },
                    {
                      title: "Fecha",
                      dataIndex: "fecha_recepcion",
                      key: "fecha_recepcion",
                      width: 155,
                      render: (f: string) => formatearFechaHora(f),
                    },
                    {
                      title: "Guía de Remisión",
                      dataIndex: "guia_remision",
                      key: "guia_remision",
                      width: 150,
                      render: (g: string) => <b>{g}</b>,
                    },
                    {
                      title: "N° Orden",
                      dataIndex: "nro_orden",
                      key: "nro_orden",
                      width: 130,
                      render: (o: string) => <Tag color="geekblue">{o}</Tag>,
                    },
                    {
                      title: "Proveedor",
                      dataIndex: "proveedor",
                      key: "proveedor",
                    },
                    {
                      title: "Almacenero",
                      dataIndex: "almacenero",
                      key: "almacenero",
                      width: 170,
                    },
                    {
                      title: "Observación",
                      dataIndex: "observacion",
                      key: "observacion",
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
