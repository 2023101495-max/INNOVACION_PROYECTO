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
  Form,
  InputNumber,
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  SwapOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearFechaHora, dayjs } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import { registrarMovimientoManualAction } from "@/app/actions/inventario";

interface MovimientoItem {
  id_movimiento: number;
  fecha_hora: string;
  codigo: string;
  producto: string;
  tipo: "ENTRADA" | "SALIDA";
  origen: "INVENTARIO_INICIAL" | "VENTA" | "RECEPCION" | "AJUSTE" | "OTRO";
  cantidad: number;
  stock_anterior: number;
  stock_posterior: number;
  documento_origen: string | null;
  usuario: string;
  observacion: string | null;
}

interface ProductoOpcion {
  id_producto: number;
  codigo: string;
  nombre: string;
  stock_actual: number;
}

export default function MovimientosClient({
  puedeRegistrar,
  movimientosIniciales,
  productos,
}: {
  puedeRegistrar: boolean;
  movimientosIniciales: MovimientoItem[];
  productos: ProductoOpcion[];
}) {
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>(movimientosIniciales);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroOrigen, setFiltroOrigen] = useState<string | null>(null);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(
    null
  );

  // Modal registrar movimiento manual
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm();
  const prodSeleccionadoId = Form.useWatch("id_producto", form);
  const prodSeleccionado = productos.find((p) => p.id_producto === prodSeleccionadoId);

  const movimientosFiltrados = movimientos.filter((m) => {
    if (filtroTipo && m.tipo !== filtroTipo) return false;
    if (filtroOrigen && m.origen !== filtroOrigen) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const matchProd = m.producto.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q);
      const matchDoc = m.documento_origen?.toLowerCase().includes(q);
      const matchUser = m.usuario.toLowerCase().includes(q);
      if (!matchProd && !matchDoc && !matchUser) return false;
    }
    if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
      const fMov = dayjs(m.fecha_hora);
      const inicio = rangoFechas[0].startOf("day");
      const fin = rangoFechas[1].endOf("day");
      if (fMov.isBefore(inicio) || fMov.isAfter(fin)) return false;
    }
    return true;
  });

  const handleRegistrarManual = async (values: any) => {
    setGuardando(true);
    const res = await registrarMovimientoManualAction({
      id_producto: values.id_producto,
      tipo: values.tipo,
      origen: values.origen,
      cantidad: values.cantidad,
      observacion: values.observacion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar el movimiento.");
      setGuardando(false);
      return;
    }

    message.success("Movimiento de almacén registrado con éxito.");

    // Añadir al inicio del listado local
    const p = productos.find((x) => x.id_producto === values.id_producto);
    const anterior = p ? p.stock_actual : 0;
    const posterior = values.tipo === "ENTRADA" ? anterior + values.cantidad : anterior - values.cantidad;

    const nuevoMov: MovimientoItem = {
      id_movimiento: Date.now(),
      fecha_hora: new Date().toISOString(),
      codigo: p?.codigo || "PROD",
      producto: p?.nombre || "Producto",
      tipo: values.tipo,
      origen: values.origen,
      cantidad: values.cantidad,
      stock_anterior: anterior,
      stock_posterior: posterior,
      documento_origen: null,
      usuario: "mi_usuario",
      observacion: values.observacion,
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalAbierto(false);
    form.resetFields();
    setGuardando(false);
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Movimientos de Almacén"
        subtitulo="Historial de entradas y salidas de inventario con su documento de origen y trazabilidad (RF-INV-06, 07, 14, 15)"
        extra={
          puedeRegistrar && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setModalAbierto(true);
              }}
            >
              Registrar Movimiento Manual
            </Button>
          )
        }
      />

      {/* Barra de Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} lg={6}>
            <Input
              placeholder="Buscar por producto, documento, usuario..."
              prefix={<SearchOutlined />}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Select
              placeholder="Tipo"
              allowClear
              style={{ width: "100%" }}
              value={filtroTipo}
              onChange={(val) => setFiltroTipo(val)}
              options={[
                { value: "ENTRADA", label: "ENTRADA" },
                { value: "SALIDA", label: "SALIDA" },
              ]}
            />
          </Col>
          <Col xs={12} sm={8} lg={5}>
            <Select
              placeholder="Origen del movimiento"
              allowClear
              style={{ width: "100%" }}
              value={filtroOrigen}
              onChange={(val) => setFiltroOrigen(val)}
              options={[
                { value: "VENTA", label: "VENTA" },
                { value: "RECEPCION", label: "RECEPCIÓN" },
                { value: "AJUSTE", label: "AJUSTE" },
                { value: "INVENTARIO_INICIAL", label: "INVENTARIO INICIAL" },
                { value: "OTRO", label: "OTRO" },
              ]}
            />
          </Col>
          <Col xs={24} sm={16} lg={6}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Desde", "Hasta"]}
              value={rangoFechas as any}
              onChange={(fechas) => setRangoFechas(fechas as any)}
            />
          </Col>
          <Col xs={24} sm={8} lg={3} style={{ textAlign: "right" }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFiltroTexto("");
                setFiltroTipo(null);
                setFiltroOrigen(null);
                setRangoFechas(null);
              }}
            >
              Limpiar
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Movimientos */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_movimiento"
          dataSource={movimientosFiltrados}
          pagination={{ pageSize: 12 }}
          columns={[
            {
              title: "Fecha y Hora",
              dataIndex: "fecha_hora",
              key: "fecha_hora",
              width: 155,
              render: (f: string) => formatearFechaHora(f),
            },
            {
              title: "Producto",
              key: "producto",
              render: (_: unknown, r: MovimientoItem) => (
                <div>
                  <Tag color="blue" style={{ fontSize: 11, marginBottom: 2 }}>
                    {r.codigo}
                  </Tag>
                  <div style={{ fontWeight: 600 }}>{r.producto}</div>
                </div>
              ),
            },
            {
              title: "Tipo",
              dataIndex: "tipo",
              key: "tipo",
              width: 100,
              align: "center",
              render: (tipo: string) => <EtiquetaEstado estado={tipo} />,
            },
            {
              title: "Origen",
              dataIndex: "origen",
              key: "origen",
              width: 140,
              align: "center",
              render: (orig: string) => (
                <Tag color={orig === "VENTA" ? "orange" : orig === "RECEPCION" ? "cyan" : "default"}>
                  {orig}
                </Tag>
              ),
            },
            {
              title: "Cantidad",
              dataIndex: "cantidad",
              key: "cantidad",
              width: 95,
              align: "center",
              render: (c: number, r: MovimientoItem) => (
                <span
                  style={{
                    fontWeight: 700,
                    color: r.tipo === "ENTRADA" ? COLORES_ERP.verdeAcento : COLORES_ERP.rojoError,
                  }}
                >
                  {r.tipo === "ENTRADA" ? `+${c}` : `-${c}`}
                </span>
              ),
            },
            {
              title: "Stock Antes/Después",
              key: "stock_ant_post",
              width: 140,
              align: "center",
              render: (_: unknown, r: MovimientoItem) => (
                <span>
                  {r.stock_anterior} → <b>{r.stock_posterior}</b>
                </span>
              ),
            },
            {
              title: "Doc. Origen",
              dataIndex: "documento_origen",
              key: "documento_origen",
              width: 120,
              render: (doc: string | null) =>
                doc ? (
                  <Tag color="geekblue" style={{ fontWeight: 600 }}>
                    {doc}
                  </Tag>
                ) : (
                  <span style={{ color: "#94a3b8" }}>—</span>
                ),
            },
            {
              title: "Usuario",
              dataIndex: "usuario",
              key: "usuario",
              width: 110,
            },
            {
              title: "Observación",
              dataIndex: "observacion",
              key: "observacion",
              render: (obs: string | null) => obs || <span style={{ color: "#94a3b8" }}>—</span>,
            },
          ]}
        />
      </Card>

      {/* Modal Registrar Movimiento Manual (RF-INV-06, 07) */}
      <Modal
        title="Registrar Movimiento Manual de Almacén"
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegistrarManual}
          requiredMark={false}
          initialValues={{ tipo: "ENTRADA", origen: "AJUSTE", cantidad: 1 }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="id_producto"
            label="Producto"
            rules={[{ required: true, message: "Seleccione un producto" }]}
          >
            <Select
              showSearch
              placeholder="Buscar y seleccionar producto..."
              optionFilterProp="label"
              options={productos.map((p) => ({
                value: p.id_producto,
                label: `[${p.codigo}] ${p.nombre} (Stock actual: ${p.stock_actual})`,
              }))}
            />
          </Form.Item>

          {prodSeleccionado && (
            <div
              style={{
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 12,
                color: "#475569",
              }}
            >
              Stock disponible actualmente: <b>{prodSeleccionado.stock_actual} unidades</b>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tipo" label="Tipo de Movimiento">
                <Select
                  options={[
                    { value: "ENTRADA", label: "ENTRADA (Aumenta stock)" },
                    { value: "SALIDA", label: "SALIDA (Descuenta stock)" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="origen" label="Motivo / Origen">
                <Select
                  options={[
                    { value: "AJUSTE", label: "AJUSTE (Inventario físico / daño)" },
                    { value: "OTRO", label: "OTRO" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="cantidad"
            label="Cantidad de Unidades"
            rules={[{ required: true, message: "Ingrese una cantidad mayor a cero" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} placeholder="Cantidad" />
          </Form.Item>

          <Form.Item
            name="observacion"
            label="Motivo u Observación detallada"
            rules={[{ required: true, message: "La observación o justificación es obligatoria" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ej. Salida por producto dañado en exhibición / Ingreso por ajuste de inventario físico..."
              maxLength={250}
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Space>
              <Button onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardando}>
                Registrar Movimiento
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
