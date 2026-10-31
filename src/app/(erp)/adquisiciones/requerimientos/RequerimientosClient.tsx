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
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  AuditOutlined,
  ToolOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import { crearRequerimientoAction } from "@/app/actions/adquisiciones";

interface AdquisicionUI {
  id_adquisicion: number;
  nro_adquisicion: string;
  tipo: "BIEN" | "SERVICIO";
  descripcion: string;
  monto_estimado: number;
  estado: string;
  fecha_registro: string;
  nro_solicitud: string | null;
  id_solicitud: number | null;
  registrado_por: string;
}

interface SolicitudPendienteUI {
  id_solicitud: number;
  nro_solicitud: string;
  observacion: string;
  fecha_solicitud: string;
}

export default function RequerimientosClient({
  puedeCrear,
  adquisicionesIniciales,
  solicitudesPendientes,
}: {
  puedeCrear: boolean;
  adquisicionesIniciales: AdquisicionUI[];
  solicitudesPendientes: SolicitudPendienteUI[];
}) {
  const router = useRouter();
  const [adquisiciones, setAdquisiciones] = useState<AdquisicionUI[]>(adquisicionesIniciales);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);

  // Modales
  const [modalServicioAbierto, setModalServicioAbierto] = useState(false);
  const [modalAtenderAbierto, setModalAtenderAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formServicio] = Form.useForm();
  const [formAtender] = Form.useForm();

  const adquisicionesFiltradas = adquisiciones.filter((a) => {
    if (filtroTipo && a.tipo !== filtroTipo) return false;
    if (filtroEstado && a.estado !== filtroEstado) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const matchNro = a.nro_adquisicion.toLowerCase().includes(q);
      const matchDesc = a.descripcion.toLowerCase().includes(q);
      const matchSol = a.nro_solicitud?.toLowerCase().includes(q);
      if (!matchNro && !matchDesc && !matchSol) return false;
    }
    return true;
  });

  const handleCrearServicio = async (values: { descripcion: string }) => {
    setGuardando(true);
    const res = await crearRequerimientoAction({
      tipo: "SERVICIO",
      descripcion: values.descripcion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo crear el requerimiento de servicio.");
      setGuardando(false);
      return;
    }

    message.success("Requerimiento de servicio creado exitosamente.");
    setModalServicioAbierto(false);
    formServicio.resetFields();
    setGuardando(false);

    if (res.id_adquisicion) {
      router.push(`/adquisiciones/requerimientos/${res.id_adquisicion}`);
    }
  };

  const handleAtenderSolicitud = async (values: { id_solicitud: number; descripcion: string }) => {
    setGuardando(true);
    const sol = solicitudesPendientes.find((s) => s.id_solicitud === values.id_solicitud);
    const desc = values.descripcion || `Adquisición por reposición de stock (${sol?.nro_solicitud})`;

    const res = await crearRequerimientoAction({
      tipo: "BIEN",
      descripcion: desc,
      id_solicitud: values.id_solicitud,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo crear el requerimiento.");
      setGuardando(false);
      return;
    }

    message.success("Requerimiento de compra creado a partir de la reposición.");
    setModalAtenderAbierto(false);
    formAtender.resetFields();
    setGuardando(false);

    if (res.id_adquisicion) {
      router.push(`/adquisiciones/requerimientos/${res.id_adquisicion}`);
    }
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Requerimientos de Adquisición"
        subtitulo="Gestión de adquisiciones de bienes y servicios, cotizaciones de proveedores y estado presupuestal (RF-ADQ-07, 09, 16, 18)"
        extra={
          puedeCrear && (
            <Space>
              <Button
                type="default"
                icon={<ToolOutlined />}
                onClick={() => setModalServicioAbierto(true)}
              >
                + Requerimiento de Servicio
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalAtenderAbierto(true)}
              >
                Atender Solicitud de Reposición
              </Button>
            </Space>
          )
        }
      />

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} lg={8}>
            <Input
              placeholder="Buscar por N° ADQ, descripción o solicitud..."
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
                { value: "BIEN", label: "BIEN" },
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
                { value: "EN_COTIZACION", label: "EN COTIZACIÓN" },
                { value: "EN_VERIFICACION", label: "EN VERIFICACIÓN" },
                { value: "AUTORIZADA", label: "AUTORIZADA" },
                { value: "SIN_DISPONIBILIDAD", label: "SIN DISPONIBILIDAD" },
                { value: "REPLANTEADA", label: "REPLANTEADA" },
                { value: "CON_ORDEN", label: "CON ORDEN" },
                { value: "FINALIZADA", label: "FINALIZADA" },
                { value: "POSPUESTA", label: "POSPUESTA" },
                { value: "RECHAZADA", label: "RECHAZADA" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla de Requerimientos */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_adquisicion"
          dataSource={adquisicionesFiltradas}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "N° Requerimiento",
              dataIndex: "nro_adquisicion",
              key: "nro_adquisicion",
              width: 145,
              render: (nro: string) => (
                <Tag color="geekblue" style={{ fontWeight: 700 }}>
                  {nro}
                </Tag>
              ),
            },
            {
              title: "Tipo",
              dataIndex: "tipo",
              key: "tipo",
              width: 100,
              align: "center",
              render: (t: string) => <EtiquetaEstado estado={t} />,
            },
            {
              title: "Descripción",
              dataIndex: "descripcion",
              key: "descripcion",
              render: (d: string, r: AdquisicionUI) => (
                <div>
                  <div style={{ fontWeight: 600, color: COLORES_ERP.azulProfundo }}>{d}</div>
                  {r.nro_solicitud && (
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Solicitud origen: <Tag color="orange">{r.nro_solicitud}</Tag>
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: "Monto Estimado",
              dataIndex: "monto_estimado",
              key: "monto_estimado",
              width: 130,
              align: "right",
              render: (m: number) => (
                <span style={{ fontWeight: 700, color: m > 0 ? COLORES_ERP.azulProfundo : "#94a3b8" }}>
                  {m > 0 ? formatearMoneda(m) : "Por cotizar"}
                </span>
              ),
            },
            {
              title: "Estado",
              dataIndex: "estado",
              key: "estado",
              width: 160,
              align: "center",
              render: (st: string) => <EtiquetaEstado estado={st} />,
            },
            {
              title: "Fecha",
              dataIndex: "fecha_registro",
              key: "fecha_registro",
              width: 145,
              render: (f: string) => formatearFechaHora(f),
            },
            {
              title: "Acción",
              key: "accion",
              width: 120,
              align: "center",
              render: (_: unknown, r: AdquisicionUI) => (
                <Link href={`/adquisiciones/requerimientos/${r.id_adquisicion}`}>
                  <Button type="primary" size="small" icon={<EyeOutlined />}>
                    Gestionar
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Requerimiento de Servicio (RF-ADQ-11) */}
      <Modal
        title="Crear Requerimiento de Servicio"
        open={modalServicioAbierto}
        onCancel={() => setModalServicioAbierto(false)}
        footer={null}
        width={500}
      >
        <Form
          form={formServicio}
          layout="vertical"
          onFinish={handleCrearServicio}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="descripcion"
            label="Descripción del Servicio Requerido"
            rules={[{ required: true, message: "Ingrese la descripción del servicio" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ej. Servicio de acondicionamiento de estanterías del almacén / Mantenimiento de redes..."
            />
          </Form.Item>
          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Space>
              <Button onClick={() => setModalServicioAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardando}>
                Crear Requerimiento de Servicio
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal Atender Solicitud de Reposición (RF-ADQ-01, 02) */}
      <Modal
        title="Atender Solicitud de Reposición de Almacén"
        open={modalAtenderAbierto}
        onCancel={() => setModalAtenderAbierto(false)}
        footer={null}
        width={580}
      >
        <Form
          form={formAtender}
          layout="vertical"
          onFinish={handleAtenderSolicitud}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="id_solicitud"
            label="Solicitud de Reposición Pendiente"
            rules={[{ required: true, message: "Seleccione una solicitud" }]}
          >
            <Select
              placeholder="Seleccionar solicitud..."
              options={solicitudesPendientes.map((s) => ({
                value: s.id_solicitud,
                label: `${s.nro_solicitud} — ${s.observacion} (${formatearFechaHora(s.fecha_solicitud)})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="descripcion" label="Descripción de la Adquisición (opcional)">
            <Input.TextArea
              rows={2}
              placeholder="Dejar en blanco para autogenerar según la solicitud..."
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Space>
              <Button onClick={() => setModalAtenderAbierto(false)}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={guardando}
                disabled={solicitudesPendientes.length === 0}
              >
                Generar Requerimiento de Compra
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
