"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tabs,
  Typography,
  Alert,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  StopOutlined,
  SwapOutlined,
  HistoryOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import { evaluarVerificacionAction } from "@/app/actions/finanzas";

interface PendienteUI {
  id_verificacion: number;
  id_adquisicion: number;
  nro_adquisicion: string;
  tipo_adq: string;
  descripcion_adq: string;
  monto_solicitado: number;
  fecha_solicitud: string;
  solicitante: string;
  saldo_disponible_actual: number;
  tiene_disponibilidad: boolean;
  anio_presupuesto: number;
}

export default function VerificacionesClient({
  puedeEvaluar,
  pendientes,
  historial,
  presupuestoActual,
}: {
  puedeEvaluar: boolean;
  pendientes: PendienteUI[];
  historial: any[];
  presupuestoActual: any | null;
}) {
  const router = useRouter();
  const [modalEvaluarAbierto, setModalEvaluarAbierto] = useState(false);
  const [verifSeleccionada, setVerifSeleccionada] = useState<PendienteUI | null>(null);
  const [decision, setDecision] = useState<"AUTORIZADA" | "REPLANTEAR" | "RECHAZADA" | "POSPUESTA">(
    "AUTORIZADA"
  );
  const [observacion, setObservacion] = useState("");
  const [evaluando, setEvaluando] = useState(false);

  const abrirModalEvaluar = (v: PendienteUI) => {
    setVerifSeleccionada(v);
    setDecision(v.tiene_disponibilidad ? "AUTORIZADA" : "REPLANTEAR");
    setObservacion(
      v.tiene_disponibilidad
        ? "Existe disponibilidad presupuestal suficiente; se autoriza la adquisición."
        : "El monto solicitado supera el saldo presupuestal disponible; se solicita replantear cantidades o montos."
    );
    setModalEvaluarAbierto(true);
  };

  const handleConfirmarEvaluacion = async () => {
    if (!verifSeleccionada) return;
    setEvaluando(true);

    const res = await evaluarVerificacionAction({
      id_verificacion: verifSeleccionada.id_verificacion,
      decision,
      observacion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar la evaluación.");
      setEvaluando(false);
      return;
    }

    message.success(
      decision === "AUTORIZADA"
        ? "Adquisición autorizada exitosamente. Se ha comprometido el saldo en el presupuesto."
        : `Decisión "${decision}" registrada exitosamente.`
    );

    setModalEvaluarAbierto(false);
    setEvaluando(false);
    router.refresh();
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Verificación Presupuestal"
        subtitulo="Control de disponibilidad presupuestal y autorización de compromisos de gasto (RF-ADQ-08, RF-ADM-03 a 08, 10)"
      />

      {/* Tarjeta de Resumen Presupuestal Vigente */}
      {presupuestoActual && (
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} lg={6}>
              <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
                Presupuesto Periodo {presupuestoActual.anio}:
              </span>
              <b style={{ fontSize: 16, color: COLORES_ERP.azulProfundo }}>
                {formatearMoneda(presupuestoActual.monto_asignado)}
              </b>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
                Monto Comprometido:
              </span>
              <b style={{ fontSize: 16, color: COLORES_ERP.azulInfo }}>
                {formatearMoneda(presupuestoActual.monto_comprometido)} ({presupuestoActual.porcentaje_ejecucion}%)
              </b>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
                Saldo Disponible Actualmente:
              </span>
              <b style={{ fontSize: 20, color: COLORES_ERP.verdeAcento }}>
                {formatearMoneda(presupuestoActual.monto_disponible)}
              </b>
            </Col>
            <Col xs={24} sm={24} lg={6} style={{ textAlign: "right" }}>
              <Tag
                color={pendientes.length > 0 ? "orange" : "green"}
                style={{ fontSize: 13, padding: "4px 12px", fontWeight: 700 }}
              >
                {pendientes.length} solicitud{pendientes.length !== 1 ? "es" : ""} por evaluar
              </Tag>
            </Col>
          </Row>
        </Card>
      )}

      <Tabs
        defaultActiveKey="pendientes"
        items={[
          {
            key: "pendientes",
            label: (
              <span>
                <ClockCircleOutlined /> Bandeja de Solicitudes Pendientes ({pendientes.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_verificacion"
                  dataSource={pendientes}
                  pagination={false}
                  locale={{ emptyText: "No hay solicitudes de verificación presupuestal pendientes de evaluación." }}
                  columns={[
                    {
                      title: "N° Requerimiento",
                      dataIndex: "nro_adquisicion",
                      key: "nro_adq",
                      width: 140,
                      render: (nro: string, r: PendienteUI) => (
                        <Link href={`/adquisiciones/requerimientos/${r.id_adquisicion}`}>
                          <Tag color="geekblue" style={{ fontWeight: 700 }}>
                            {nro}
                          </Tag>
                        </Link>
                      ),
                    },
                    {
                      title: "Descripción",
                      dataIndex: "descripcion_adq",
                      key: "desc",
                      render: (d: string, r: PendienteUI) => (
                        <div>
                          <div style={{ fontWeight: 600, color: COLORES_ERP.azulProfundo }}>{d}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            Solicitante: {r.solicitante} · {formatearFechaHora(r.fecha_solicitud)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Monto Solicitado",
                      dataIndex: "monto_solicitado",
                      key: "monto",
                      width: 140,
                      align: "right",
                      render: (m: number) => (
                        <b style={{ fontSize: 14, color: COLORES_ERP.azulProfundo }}>
                          {formatearMoneda(m)}
                        </b>
                      ),
                    },
                    {
                      title: "Saldo Disponible",
                      dataIndex: "saldo_disponible_actual",
                      key: "disp",
                      width: 140,
                      align: "right",
                      render: (s: number) => formatearMoneda(s),
                    },
                    {
                      title: "Disponibilidad (RF-ADM-04)",
                      key: "disp_flag",
                      width: 175,
                      align: "center",
                      render: (_: unknown, r: PendienteUI) => (
                        <EtiquetaEstado
                          estado={r.tiene_disponibilidad ? "CON_DISPONIBILIDAD" : "SIN_DISPONIBILIDAD"}
                        />
                      ),
                    },
                    {
                      title: "Acción",
                      key: "accion",
                      width: 130,
                      align: "center",
                      render: (_: unknown, r: PendienteUI) =>
                        puedeEvaluar ? (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => abrirModalEvaluar(r)}
                          >
                            Evaluar
                          </Button>
                        ) : (
                          <Tag color="default">Solo lectura</Tag>
                        ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "historial",
            label: (
              <span>
                <HistoryOutlined /> Historial de Verificaciones Evaluadas ({historial.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_verificacion"
                  dataSource={historial}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "N°",
                      dataIndex: "id_verificacion",
                      key: "id",
                      width: 60,
                    },
                    {
                      title: "Requerimiento",
                      dataIndex: "nro_adquisicion",
                      key: "nro",
                      width: 130,
                      render: (n: string) => <Tag color="geekblue">{n}</Tag>,
                    },
                    {
                      title: "Fecha Solicitud",
                      dataIndex: "fecha_solicitud",
                      key: "f_sol",
                      width: 145,
                      render: (f: string) => formatearFechaHora(f),
                    },
                    {
                      title: "Monto Solicitado",
                      dataIndex: "monto_solicitado",
                      key: "monto",
                      width: 130,
                      align: "right",
                      render: (m: number) => <b>{formatearMoneda(m)}</b>,
                    },
                    {
                      title: "Saldo Evaluado",
                      dataIndex: "disponible_al_evaluar",
                      key: "disp",
                      width: 130,
                      align: "right",
                      render: (s: number | null) => (s !== null ? formatearMoneda(s) : "—"),
                    },
                    {
                      title: "Disponibilidad",
                      dataIndex: "resultado",
                      key: "res",
                      width: 155,
                      align: "center",
                      render: (r: string) => <EtiquetaEstado estado={r} />,
                    },
                    {
                      title: "Decisión",
                      dataIndex: "decision",
                      key: "dec",
                      width: 140,
                      align: "center",
                      render: (d: string | null) => (d ? <EtiquetaEstado estado={d} /> : "PENDIENTE"),
                    },
                    {
                      title: "Evaluado por",
                      dataIndex: "evaluado_por",
                      key: "eval",
                      width: 130,
                    },
                    {
                      title: "Observación",
                      dataIndex: "observacion",
                      key: "obs",
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal Evaluar Solicitud (RF-ADM-04 a 09) */}
      <Modal
        title={`Evaluar Disponibilidad Presupuestal — ${verifSeleccionada?.nro_adquisicion}`}
        open={modalEvaluarAbierto}
        onCancel={() => setModalEvaluarAbierto(false)}
        footer={null}
        width={560}
      >
        {verifSeleccionada && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                background: verifSeleccionada.tiene_disponibilidad ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${
                  verifSeleccionada.tiene_disponibilidad ? "#bbf7d0" : "#fecaca"
                }`,
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Monto Solicitado:</span>
                <b>{formatearMoneda(verifSeleccionada.monto_solicitado)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Saldo Presupuestal Disponible:</span>
                <b>{formatearMoneda(verifSeleccionada.saldo_disponible_actual)}</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  borderTop: "1px dashed #cbd5e1",
                }}
              >
                <span>Determinación Automática (RF-ADM-04):</span>
                <EtiquetaEstado
                  estado={
                    verifSeleccionada.tiene_disponibilidad
                      ? "CON_DISPONIBILIDAD"
                      : "SIN_DISPONIBILIDAD"
                  }
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Decisión de Administración y Finanzas (RF-ADM-06, 08, 09):
              </span>
              <Select
                style={{ width: "100%" }}
                value={decision}
                onChange={(val) => setDecision(val)}
                options={[
                  {
                    value: "AUTORIZADA",
                    label: "AUTORIZADA (Comprometer saldo presupuestal)",
                    disabled: !verifSeleccionada.tiene_disponibilidad,
                  },
                  {
                    value: "REPLANTEAR",
                    label: "REPLANTEAR (Solicitar a Adquisiciones reducir cantidades o monto)",
                  },
                  {
                    value: "POSPUESTA",
                    label: "POSPUESTA (Postergar para evaluación en un siguiente periodo)",
                  },
                  {
                    value: "RECHAZADA",
                    label: "RECHAZADA (Denegar la adquisición)",
                  },
                ]}
              />
              {!verifSeleccionada.tiene_disponibilidad && (
                <div style={{ fontSize: 11, color: COLORES_ERP.rojoError, marginTop: 4 }}>
                  * No se puede autorizar porque no existe disponibilidad presupuestal suficiente.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Observación / Justificación:
              </span>
              <Input.TextArea
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Justificación del resultado de la verificación..."
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => setModalEvaluarAbierto(false)}>Cancelar</Button>
                <Button
                  type="primary"
                  loading={evaluando}
                  onClick={handleConfirmarEvaluacion}
                >
                  Registrar Decisión
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
