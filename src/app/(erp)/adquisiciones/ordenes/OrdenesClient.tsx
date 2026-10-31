"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  DatePicker,
  Row,
  Col,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  PrinterOutlined,
  EyeOutlined,
  CarOutlined,
  CheckOutlined,
  StopOutlined,
  ContainerOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda, formatearFecha, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import {
  cambiarEstadoOrdenAction,
  registrarCoordinacionEntregaAction,
} from "@/app/actions/adquisiciones";

interface OrdenUI {
  id_orden: number;
  nro_orden: string;
  tipo: "COMPRA" | "SERVICIO";
  fecha_emision: string;
  fecha_entrega_pactada: string | null;
  condiciones: string;
  monto_total: number;
  estado: string;
  id_adquisicion: number;
  nro_adquisicion: string;
  descripcion_adq: string;
  proveedor: string;
  ruc_proveedor: string;
  contacto_proveedor: string;
  telefono_proveedor: string;
  direccion_proveedor: string;
  emitido_por: string;
  detalle: any[];
  coordinacion: any | null;
}

export default function OrdenesClient({
  puedeEditar,
  ordenesIniciales,
}: {
  puedeEditar: boolean;
  ordenesIniciales: OrdenUI[];
}) {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenUI[]>(ordenesIniciales);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);

  // Modales
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenUI | null>(null);
  const [modalCoordAbierto, setModalCoordAbierto] = useState(false);
  const [ordenCoord, setOrdenCoord] = useState<OrdenUI | null>(null);
  const [guardandoCoord, setGuardandoCoord] = useState(false);
  const [formCoord] = Form.useForm();

  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtroTipo && o.tipo !== filtroTipo) return false;
    if (filtroEstado && o.estado !== filtroEstado) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const matchNro = o.nro_orden.toLowerCase().includes(q);
      const matchProv = o.proveedor.toLowerCase().includes(q);
      const matchAdq = o.nro_adquisicion.toLowerCase().includes(q);
      if (!matchNro && !matchProv && !matchAdq) return false;
    }
    return true;
  });

  const abrirModalCoordinar = (ord: OrdenUI) => {
    setOrdenCoord(ord);
    formCoord.setFieldsValue({
      lugar_entrega: "Almacén Central TecnoCel",
      contacto_proveedor: ord.contacto_proveedor || "",
    });
    setModalCoordAbierto(true);
  };

  const handleGuardarCoordinacion = async (values: any) => {
    if (!ordenCoord) return;
    setGuardandoCoord(true);

    const res = await registrarCoordinacionEntregaAction({
      id_orden: ordenCoord.id_orden,
      fecha_entrega_programada: values.fecha_entrega_programada.format("YYYY-MM-DD"),
      lugar_entrega: values.lugar_entrega,
      contacto_proveedor: values.contacto_proveedor,
      observacion: values.observacion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar la coordinación.");
      setGuardandoCoord(false);
      return;
    }

    message.success("Coordinación de entrega registrada exitosamente (estado: ENVIADA).");
    setModalCoordAbierto(false);
    setGuardandoCoord(false);
    router.refresh();
  };

  const handleDarConformidadServicio = async (ord: OrdenUI) => {
    Modal.confirm({
      title: `Dar Conformidad al Servicio (${ord.nro_orden})`,
      content:
        "¿Confirma que el servicio se ejecutó satisfactoriamente? La orden quedará en estado CONFORME y el requerimiento de adquisición pasará a FINALIZADA.",
      okText: "Dar Conformidad",
      cancelText: "Cancelar",
      onOk: async () => {
        const res = await cambiarEstadoOrdenAction({
          id_orden: ord.id_orden,
          nuevo_estado: "CONFORME",
        });
        if (!res.ok) {
          message.error(res.error || "No se pudo registrar la conformidad.");
          return;
        }
        message.success("Conformidad del servicio registrada exitosamente.");
        router.refresh();
      },
    });
  };

  const handleAnularOrden = async (ord: OrdenUI) => {
    Modal.confirm({
      title: `Anular Orden (${ord.nro_orden})`,
      content:
        "¿Está seguro de anular esta orden? Solo procederá si no tiene recepciones registradas en almacén.",
      okText: "Anular Orden",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        const res = await cambiarEstadoOrdenAction({
          id_orden: ord.id_orden,
          nuevo_estado: "ANULADA",
        });
        if (!res.ok) {
          message.error(res.error || "No se pudo anular la orden.");
          return;
        }
        message.success("Orden anulada exitosamente.");
        router.refresh();
      },
    });
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Órdenes de Compra y Servicio"
        subtitulo="Emisión, seguimiento logístico y control de conformidad de órdenes (RF-ADQ-10 a 15)"
      />

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} lg={8}>
            <Input
              placeholder="Buscar por N° Orden, proveedor o requerimiento..."
              prefix={<SearchOutlined />}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} lg={4}>
            <Select
              placeholder="Tipo"
              allowClear
              style={{ width: "100%" }}
              value={filtroTipo}
              onChange={(val) => setFiltroTipo(val)}
              options={[
                { value: "COMPRA", label: "COMPRA" },
                { value: "SERVICIO", label: "SERVICIO" },
              ]}
            />
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Select
              placeholder="Todos los estados"
              allowClear
              style={{ width: "100%" }}
              value={filtroEstado}
              onChange={(val) => setFiltroEstado(val)}
              options={[
                { value: "EMITIDA", label: "EMITIDA" },
                { value: "ENVIADA", label: "ENVIADA" },
                { value: "EN_TRANSITO", label: "EN TRÁNSITO" },
                { value: "RECIBIDA_PARCIAL", label: "RECIBIDA PARCIAL" },
                { value: "RECIBIDA", label: "RECIBIDA" },
                { value: "CONFORME", label: "CONFORME" },
                { value: "ANULADA", label: "ANULADA" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla de Órdenes */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_orden"
          dataSource={ordenesFiltradas}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "N° Orden",
              dataIndex: "nro_orden",
              key: "nro_orden",
              width: 140,
              render: (nro: string, r: OrdenUI) => (
                <div>
                  <Tag color={r.tipo === "COMPRA" ? "blue" : "purple"} style={{ fontWeight: 700 }}>
                    {nro}
                  </Tag>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.tipo}</div>
                </div>
              ),
            },
            {
              title: "Proveedor",
              dataIndex: "proveedor",
              key: "proveedor",
              render: (p: string, r: OrdenUI) => (
                <div>
                  <b style={{ color: COLORES_ERP.azulProfundo }}>{p}</b>
                  <div style={{ fontSize: 11, color: "#64748b" }}>RUC: {r.ruc_proveedor}</div>
                </div>
              ),
            },
            {
              title: "Requerimiento",
              dataIndex: "nro_adquisicion",
              key: "nro_adq",
              width: 150,
              render: (n: string, r: OrdenUI) => (
                <Link href={`/adquisiciones/requerimientos/${r.id_adquisicion}`}>
                  <Tag color="geekblue">{n}</Tag>
                </Link>
              ),
            },
            {
              title: "Monto Total",
              dataIndex: "monto_total",
              key: "monto",
              width: 130,
              align: "right",
              render: (m: number) => (
                <b style={{ color: COLORES_ERP.verdeAcento, fontSize: 14 }}>
                  {formatearMoneda(m)}
                </b>
              ),
            },
            {
              title: "Estado",
              dataIndex: "estado",
              key: "estado",
              width: 145,
              align: "center",
              render: (st: string) => <EtiquetaEstado estado={st} />,
            },
            {
              title: "Fecha Emisión",
              dataIndex: "fecha_emision",
              key: "fecha",
              width: 145,
              render: (f: string) => formatearFechaHora(f),
            },
            {
              title: "Acciones",
              key: "acciones",
              width: 220,
              align: "center",
              render: (_: unknown, r: OrdenUI) => (
                <Space size="small" wrap>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setOrdenDetalle(r)}
                  >
                    Ver
                  </Button>

                  {puedeEditar && r.tipo === "COMPRA" && ["EMITIDA", "ENVIADA"].includes(r.estado) && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CarOutlined />}
                      onClick={() => abrirModalCoordinar(r)}
                    >
                      Coordinar
                    </Button>
                  )}

                  {puedeEditar && r.tipo === "SERVICIO" && r.estado !== "CONFORME" && r.estado !== "ANULADA" && (
                    <Button
                      size="small"
                      type="primary"
                      style={{ backgroundColor: COLORES_ERP.verdeAcento }}
                      icon={<CheckOutlined />}
                      onClick={() => handleDarConformidadServicio(r)}
                    >
                      Conformidad
                    </Button>
                  )}

                  {puedeEditar && !["RECIBIDA", "CONFORME", "ANULADA"].includes(r.estado) && (
                    <Button
                      size="small"
                      danger
                      icon={<StopOutlined />}
                      onClick={() => handleAnularOrden(r)}
                    >
                      Anular
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Detalle Imprimible de la Orden (RF-ADQ-10 a 13) */}
      <Modal
        open={!!ordenDetalle}
        onCancel={() => setOrdenDetalle(null)}
        width={680}
        footer={[
          <Button
            key="imprimir"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Imprimir Orden Oficial
          </Button>,
          <Button key="cerrar" onClick={() => setOrdenDetalle(null)}>
            Cerrar
          </Button>,
        ]}
      >
        {ordenDetalle && (
          <div className="printable-card" style={{ padding: "8px 6px" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Typography.Title level={3} style={{ margin: 0, color: COLORES_ERP.azulProfundo }}>
                ERP TecnoCel
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Comercializadora de Celulares y Productos Tecnológicos · RUC: 20601234561
              </Typography.Text>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: COLORES_ERP.azulProfundo,
                  marginTop: 6,
                  letterSpacing: 0.5,
                }}
              >
                ORDEN DE {ordenDetalle.tipo === "COMPRA" ? "COMPRA" : "SERVICIO"} N°{" "}
                {ordenDetalle.nro_orden}
              </div>
            </div>

            {/* Cabecera Proveedor y Datos */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "#f8fafc",
                padding: "12px 16px",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 12.5,
                border: "1px solid #e2e8f0",
              }}
            >
              <div>
                <div>
                  <b>Señores:</b> {ordenDetalle.proveedor}
                </div>
                <div>
                  <b>RUC:</b> {ordenDetalle.ruc_proveedor}
                </div>
                {ordenDetalle.contacto_proveedor && (
                  <div>
                    <b>Contacto:</b> {ordenDetalle.contacto_proveedor}
                  </div>
                )}
                {ordenDetalle.direccion_proveedor && (
                  <div>
                    <b>Dirección:</b> {ordenDetalle.direccion_proveedor}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div>
                  <b>Fecha Emisión:</b> {formatearFechaHora(ordenDetalle.fecha_emision)}
                </div>
                <div>
                  <b>Fecha Entrega Pactada:</b>{" "}
                  {formatearFecha(ordenDetalle.fecha_entrega_pactada)}
                </div>
                <div>
                  <b>Condiciones de Pago:</b> {ordenDetalle.condiciones}
                </div>
                <div>
                  <b>Estado:</b> <EtiquetaEstado estado={ordenDetalle.estado} />
                </div>
              </div>
            </div>

            {/* Coordinación de entrega si existe */}
            {ordenDetalle.coordinacion && (
              <div
                style={{
                  background: "#eff6ff",
                  padding: "8px 12px",
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 12,
                  border: "1px solid #bfdbfe",
                }}
              >
                <b>Coordinación de Entrega (RF-ADQ-15):</b> Programada para el{" "}
                <b>{formatearFecha(ordenDetalle.coordinacion.fecha_entrega_programada)}</b> en{" "}
                <b>{ordenDetalle.coordinacion.lugar_entrega}</b>.
                {ordenDetalle.coordinacion.observacion && (
                  <span> ({ordenDetalle.coordinacion.observacion})</span>
                )}
              </div>
            )}

            {/* Tabla de Productos / Servicios */}
            <Table
              size="small"
              pagination={false}
              rowKey="id_detalle_orden"
              dataSource={ordenDetalle.detalle}
              columns={[
                {
                  title: "Cant.",
                  dataIndex: "cantidad",
                  key: "cant",
                  width: 60,
                  align: "center",
                },
                { title: "Descripción", dataIndex: "descripcion", key: "desc" },
                {
                  title: "P. Unitario",
                  dataIndex: "precio_unitario",
                  key: "pu",
                  width: 110,
                  align: "right",
                  render: (p: number) => formatearMoneda(p),
                },
                {
                  title: "Subtotal",
                  dataIndex: "subtotal",
                  key: "sub",
                  width: 120,
                  align: "right",
                  render: (s: number) => (
                    <span style={{ fontWeight: 700 }}>{formatearMoneda(s)}</span>
                  ),
                },
              ]}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 18,
                paddingTop: 12,
                borderTop: "2px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b" }}>
                <div>Emitido por: {ordenDetalle.emitido_por}</div>
                <div>Requerimiento Origen: {ordenDetalle.nro_adquisicion}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 14, marginRight: 12 }}>MONTO TOTAL:</span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: COLORES_ERP.azulProfundo,
                  }}
                >
                  {formatearMoneda(ordenDetalle.monto_total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Coordinar Entrega (RF-ADQ-15) */}
      <Modal
        title={`Coordinar Entrega de Mercadería — ${ordenCoord?.nro_orden}`}
        open={modalCoordAbierto}
        onCancel={() => setModalCoordAbierto(false)}
        footer={null}
        width={500}
      >
        <Form
          form={formCoord}
          layout="vertical"
          onFinish={handleGuardarCoordinacion}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="fecha_entrega_programada"
            label="Fecha de Entrega Programada"
            rules={[{ required: true, message: "Seleccione la fecha" }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="lugar_entrega" label="Lugar de Entrega">
            <Input placeholder="Almacén Central TecnoCel..." />
          </Form.Item>

          <Form.Item name="contacto_proveedor" label="Contacto del Proveedor / Transportista">
            <Input placeholder="Nombre de quien entregará o despachará..." />
          </Form.Item>

          <Form.Item name="observacion" label="Observación / Condiciones de entrega">
            <Input.TextArea
              rows={2}
              placeholder="Ej. Proveedor indica que los cables llegarán en dos despachos..."
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalCoordAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardandoCoord}>
                Registrar Coordinación
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
