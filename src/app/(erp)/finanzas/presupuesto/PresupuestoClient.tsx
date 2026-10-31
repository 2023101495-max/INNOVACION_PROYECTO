"use client";

import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Tabs,
  Typography,
  message,
} from "antd";
import {
  DollarOutlined,
  PlusOutlined,
  MinusOutlined,
  CalendarOutlined,
  LockOutlined,
  HistoryOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import {
  asignarPresupuestoAction,
  reducirPresupuestoAction,
  crearPeriodoPresupuestalAction,
  cerrarPeriodoPresupuestalAction,
} from "@/app/actions/finanzas";

interface PresupuestoUI {
  anio: number;
  descripcion: string;
  monto_asignado: number;
  monto_comprometido: number;
  monto_disponible: number;
  porcentaje_ejecucion: number;
  estado: string;
}

interface MovimientoPresUI {
  id_mov_presupuestal: number;
  id_presupuesto: number;
  tipo: string;
  monto: number;
  disponible_anterior: number | null;
  disponible_posterior: number | null;
  descripcion: string;
  fecha_hora: string;
  usuario: string;
}

interface AdqPresupuestoUI {
  nro_adquisicion: string;
  descripcion: string;
  estado: string;
  monto_estimado: number;
  nro_verificaciones: number;
  veces_autorizada: number;
  monto_comprometido: number;
}

export default function PresupuestoClient({
  puedeEditar,
  presupuestos,
  movimientos,
  adquisicionesPresupuesto,
}: {
  puedeEditar: boolean;
  presupuestos: PresupuestoUI[];
  movimientos: MovimientoPresUI[];
  adquisicionesPresupuesto: AdqPresupuestoUI[];
}) {
  const [presupuestoSeleccionadoAnio, setPresupuestoSeleccionadoAnio] = useState<number>(
    presupuestos[0]?.anio || 2026
  );

  const presActual =
    presupuestos.find((p) => p.anio === presupuestoSeleccionadoAnio) || presupuestos[0];

  // Modales
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [modalReducirAbierto, setModalReducirAbierto] = useState(false);
  const [modalNuevoPeriodoAbierto, setModalNuevoPeriodoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formAsignar] = Form.useForm();
  const [formReducir] = Form.useForm();
  const [formPeriodo] = Form.useForm();

  const handleAsignar = async (values: any) => {
    setGuardando(true);
    const res = await asignarPresupuestoAction({
      id_presupuesto: 1, // ID del periodo activo
      monto: values.monto,
      descripcion: values.descripcion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo asignar presupuesto.");
      setGuardando(false);
      return;
    }

    message.success("Presupuesto asignado exitosamente.");
    setModalAsignarAbierto(false);
    formAsignar.resetFields();
    setGuardando(false);
    window.location.reload();
  };

  const handleReducir = async (values: any) => {
    setGuardando(true);
    const res = await reducirPresupuestoAction({
      id_presupuesto: 1,
      monto: values.monto,
      descripcion: values.descripcion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo reducir presupuesto.");
      setGuardando(false);
      return;
    }

    message.success("Reducción presupuestal registrada exitosamente.");
    setModalReducirAbierto(false);
    formReducir.resetFields();
    setGuardando(false);
    window.location.reload();
  };

  const handleCrearPeriodo = async (values: any) => {
    setGuardando(true);
    const res = await crearPeriodoPresupuestalAction({
      anio: values.anio,
      descripcion: values.descripcion,
      monto_inicial: values.monto_inicial,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo crear el periodo presupuestal.");
      setGuardando(false);
      return;
    }

    message.success(`Periodo presupuestal ${values.anio} creado exitosamente.`);
    setModalNuevoPeriodoAbierto(false);
    formPeriodo.resetFields();
    setGuardando(false);
    window.location.reload();
  };

  const handleCerrarPeriodo = () => {
    Modal.confirm({
      title: `Cerrar Periodo Presupuestal ${presActual?.anio}`,
      content:
        "¿Está seguro de cerrar este periodo presupuestal? Una vez cerrado, no se podrán realizar nuevas asignaciones ni compromisos en este año.",
      okText: "Cerrar Periodo",
      okType: "danger",
      onOk: async () => {
        const res = await cerrarPeriodoPresupuestalAction(1);
        if (!res.ok) {
          message.error(res.error || "No se pudo cerrar el periodo.");
          return;
        }
        message.success("Periodo presupuestal cerrado.");
        window.location.reload();
      },
    });
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Presupuesto Anual y Trazabilidad"
        subtitulo="Gestión de asignaciones anuales, compromisos de gasto y saldo presupuestal (RF-ADM-01, 02, 09, 11)"
        extra={
          puedeEditar && (
            <Space wrap>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setModalAsignarAbierto(true)}
              >
                Asignar Presupuesto
              </Button>
              <Button
                icon={<MinusOutlined />}
                onClick={() => setModalReducirAbierto(true)}
              >
                Reducir Presupuesto
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => setModalNuevoPeriodoAbierto(true)}
              >
                Nuevo Periodo
              </Button>
              {presActual?.estado === "ABIERTO" && (
                <Button danger icon={<LockOutlined />} onClick={handleCerrarPeriodo}>
                  Cerrar Periodo
                </Button>
              )}
            </Space>
          )
        }
      />

      {/* Tarjetas del Presupuesto Seleccionado */}
      {presActual && (
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title={`Monto Asignado (${presActual.anio})`}
                value={presActual.monto_asignado}
                formatter={(val) => formatearMoneda(Number(val))}
                valueStyle={{ color: COLORES_ERP.azulProfundo, fontWeight: 800 }}
                prefix={<DollarOutlined />}
              />
              <div style={{ marginTop: 6 }}>
                <EtiquetaEstado estado={presActual.estado} />
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Monto Comprometido"
                value={presActual.monto_comprometido}
                formatter={(val) => formatearMoneda(Number(val))}
                valueStyle={{ color: COLORES_ERP.azulInfo, fontWeight: 700 }}
              />
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Ejecución del presupuesto:
                </span>
                <Progress
                  percent={Number(presActual.porcentaje_ejecucion)}
                  strokeColor={
                    presActual.porcentaje_ejecucion > 90
                      ? COLORES_ERP.rojoError
                      : COLORES_ERP.verdeAcento
                  }
                  size="small"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Saldo Disponible Actual"
                value={presActual.monto_disponible}
                formatter={(val) => formatearMoneda(Number(val))}
                valueStyle={{ color: COLORES_ERP.verdeAcento, fontWeight: 800 }}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                Disponible para nuevas adquisiciones
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: "#f8fafc",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>Descripción del Periodo:</div>
                <div style={{ fontWeight: 600, color: COLORES_ERP.azulProfundo }}>
                  {presActual.descripcion}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Tabs de Información: Movimientos Presupuestales y Adquisiciones */}
      <Tabs
        defaultActiveKey="movimientos"
        items={[
          {
            key: "movimientos",
            label: (
              <span>
                <HistoryOutlined /> Movimientos Presupuestales ({movimientos.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_mov_presupuestal"
                  dataSource={movimientos}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Fecha y Hora",
                      dataIndex: "fecha_hora",
                      key: "fecha",
                      width: 155,
                      render: (f: string) => formatearFechaHora(f),
                    },
                    {
                      title: "Tipo de Movimiento",
                      dataIndex: "tipo",
                      key: "tipo",
                      width: 140,
                      align: "center",
                      render: (t: string) => <EtiquetaEstado estado={t} />,
                    },
                    {
                      title: "Monto",
                      dataIndex: "monto",
                      key: "monto",
                      width: 130,
                      align: "right",
                      render: (m: number, r: MovimientoPresUI) => (
                        <b
                          style={{
                            color:
                              r.tipo === "ASIGNACION"
                                ? COLORES_ERP.verdeAcento
                                : r.tipo === "COMPROMISO"
                                ? COLORES_ERP.azulInfo
                                : COLORES_ERP.rojoError,
                          }}
                        >
                          {formatearMoneda(m)}
                        </b>
                      ),
                    },
                    {
                      title: "Disponible Anterior",
                      dataIndex: "disponible_anterior",
                      key: "ant",
                      width: 140,
                      align: "right",
                      render: (d: number | null) => (d !== null ? formatearMoneda(d) : "—"),
                    },
                    {
                      title: "Disponible Posterior",
                      dataIndex: "disponible_posterior",
                      key: "post",
                      width: 140,
                      align: "right",
                      render: (d: number | null) =>
                        d !== null ? <b>{formatearMoneda(d)}</b> : "—",
                    },
                    {
                      title: "Descripción / Justificación",
                      dataIndex: "descripcion",
                      key: "desc",
                    },
                    {
                      title: "Usuario",
                      dataIndex: "usuario",
                      key: "user",
                      width: 160,
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "adquisiciones",
            label: (
              <span>
                <AuditOutlined /> Situación Presupuestal de Adquisiciones (
                {adquisicionesPresupuesto.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="nro_adquisicion"
                  dataSource={adquisicionesPresupuesto}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "N° Requerimiento",
                      dataIndex: "nro_adquisicion",
                      key: "nro",
                      width: 140,
                      render: (n: string) => <Tag color="geekblue">{n}</Tag>,
                    },
                    {
                      title: "Descripción",
                      dataIndex: "descripcion",
                      key: "desc",
                    },
                    {
                      title: "Monto Estimado",
                      dataIndex: "monto_estimado",
                      key: "estimado",
                      width: 130,
                      align: "right",
                      render: (m: number) => formatearMoneda(m),
                    },
                    {
                      title: "N° Verificaciones",
                      dataIndex: "nro_verificaciones",
                      key: "n_verif",
                      width: 130,
                      align: "center",
                      render: (c: number) => <Tag color="default">{c} veces</Tag>,
                    },
                    {
                      title: "Veces Autorizada",
                      dataIndex: "veces_autorizada",
                      key: "v_aut",
                      width: 130,
                      align: "center",
                      render: (c: number) => (
                        <Tag color={c > 0 ? "green" : "orange"}>{c}</Tag>
                      ),
                    },
                    {
                      title: "Monto Comprometido",
                      dataIndex: "monto_comprometido",
                      key: "comp",
                      width: 150,
                      align: "right",
                      render: (m: number) => (
                        <b style={{ color: COLORES_ERP.verdeAcento }}>{formatearMoneda(m)}</b>
                      ),
                    },
                    {
                      title: "Estado Actual",
                      dataIndex: "estado",
                      key: "st",
                      width: 140,
                      align: "center",
                      render: (st: string) => <EtiquetaEstado estado={st} />,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal Asignar Presupuesto (RF-ADM-01) */}
      <Modal
        title="Asignar Presupuesto Adicional"
        open={modalAsignarAbierto}
        onCancel={() => setModalAsignarAbierto(false)}
        footer={null}
        width={480}
      >
        <Form form={formAsignar} layout="vertical" onFinish={handleAsignar} style={{ marginTop: 16 }}>
          <Form.Item
            name="monto"
            label="Monto a Asignar (S/)"
            rules={[{ required: true, message: "Ingrese el monto" }]}
          >
            <InputNumber
              min={1}
              step={500}
              precision={2}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Motivo / Justificación"
            rules={[{ required: true, message: "Ingrese el motivo" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ej. Ampliación presupuestal aprobada por Gerencia General..."
            />
          </Form.Item>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalAsignarAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardando}>
                Registrar Asignación
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal Reducir Presupuesto */}
      <Modal
        title="Reducir Presupuesto"
        open={modalReducirAbierto}
        onCancel={() => setModalReducirAbierto(false)}
        footer={null}
        width={480}
      >
        <Form form={formReducir} layout="vertical" onFinish={handleReducir} style={{ marginTop: 16 }}>
          <Form.Item
            name="monto"
            label="Monto a Reducir (S/)"
            rules={[{ required: true, message: "Ingrese el monto" }]}
          >
            <InputNumber
              min={1}
              step={500}
              precision={2}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Motivo / Justificación"
            rules={[{ required: true, message: "Ingrese el motivo" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ej. Reajuste de presupuesto por reducción de metas..."
            />
          </Form.Item>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalReducirAbierto(false)}>Cancelar</Button>
              <Button type="primary" danger htmlType="submit" loading={guardando}>
                Registrar Reducción
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal Nuevo Periodo Presupuestal */}
      <Modal
        title="Crear Nuevo Periodo Presupuestal"
        open={modalNuevoPeriodoAbierto}
        onCancel={() => setModalNuevoPeriodoAbierto(false)}
        footer={null}
        width={480}
      >
        <Form
          form={formPeriodo}
          layout="vertical"
          onFinish={handleCrearPeriodo}
          initialValues={{ anio: 2027, monto_inicial: 50000 }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="anio"
            label="Año del Periodo"
            rules={[{ required: true, message: "Ingrese el año" }]}
          >
            <InputNumber min={2020} max={2100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input placeholder="Presupuesto de adquisiciones..." />
          </Form.Item>
          <Form.Item name="monto_inicial" label="Monto Inicial Asignado (S/)">
            <InputNumber min={0} step={1000} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalNuevoPeriodoAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardando}>
                Crear Periodo
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
