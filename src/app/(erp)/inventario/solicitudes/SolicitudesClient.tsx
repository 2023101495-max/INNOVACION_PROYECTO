"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Alert,
  Select,
  message,
} from "antd";
import {
  PlusOutlined,
  AlertOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import {
  crearSolicitudReposicionAction,
  ItemSolicitudInput,
} from "@/app/actions/inventario";

interface ItemSolicitudUI {
  id_detalle_solicitud?: number;
  id_producto: number;
  codigo: string;
  nombre: string;
  stock_actual_ref: number;
  stock_minimo_ref: number;
  cantidad_solicitada: number;
}

interface SolicitudUI {
  id_solicitud: number;
  nro_solicitud: string;
  fecha_solicitud: string;
  estado: string;
  observacion: string;
  solicitante: string;
  items: ItemSolicitudUI[];
}

export default function SolicitudesClient({
  puedeSolicitar,
  puedeAtender,
  solicitudesIniciales,
  productosBajoMinimo,
  todosProductos,
}: {
  puedeSolicitar: boolean;
  puedeAtender: boolean;
  solicitudesIniciales: SolicitudUI[];
  productosBajoMinimo: any[];
  todosProductos: any[];
}) {
  const [solicitudes, setSolicitudes] = useState<SolicitudUI[]>(solicitudesIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemsPropuestos, setItemsPropuestos] = useState<ItemSolicitudUI[]>([]);
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [productoAgregarId, setProductoAgregarId] = useState<number | null>(null);

  const abrirModalNuevaSolicitud = () => {
    // Proponer automáticamente los productos bajo mínimo (RF-INV-10)
    const iniciales: ItemSolicitudUI[] = productosBajoMinimo.map((p) => ({
      id_producto: p.id_producto,
      codigo: p.codigo,
      nombre: p.nombre,
      stock_actual_ref: p.stock_actual,
      stock_minimo_ref: p.stock_minimo,
      cantidad_solicitada: Math.max(1, p.faltante_al_minimo || 5),
    }));

    setItemsPropuestos(iniciales);
    setObservacion("Reposición de productos bajo stock mínimo detectados por almacén");
    setModalAbierto(true);
  };

  const cambiarCantidadItem = (id_producto: number, cantidad: number | null) => {
    const c = cantidad ?? 1;
    if (c <= 0) return;
    setItemsPropuestos((prev) =>
      prev.map((it) => (it.id_producto === id_producto ? { ...it, cantidad_solicitada: c } : it))
    );
  };

  const eliminarItemPropuesto = (id_producto: number) => {
    setItemsPropuestos((prev) => prev.filter((it) => it.id_producto !== id_producto));
  };

  const handleAgregarOtroProducto = () => {
    if (!productoAgregarId) return;
    const yaExiste = itemsPropuestos.some((i) => i.id_producto === productoAgregarId);
    if (yaExiste) {
      message.warning("Ese producto ya está incluido en la lista.");
      return;
    }
    const prod = todosProductos.find((p) => p.id_producto === productoAgregarId);
    if (!prod) return;

    setItemsPropuestos((prev) => [
      ...prev,
      {
        id_producto: prod.id_producto,
        codigo: prod.codigo,
        nombre: prod.nombre,
        stock_actual_ref: prod.stock_actual,
        stock_minimo_ref: prod.stock_minimo,
        cantidad_solicitada: 5,
      },
    ]);
    setProductoAgregarId(null);
  };

  const handleGuardarSolicitud = async () => {
    if (itemsPropuestos.length === 0) {
      message.error("Debe incluir al menos un producto a solicitar.");
      return;
    }

    setGuardando(true);
    const payload: ItemSolicitudInput[] = itemsPropuestos.map((i) => ({
      id_producto: i.id_producto,
      stock_actual_ref: i.stock_actual_ref,
      stock_minimo_ref: i.stock_minimo_ref,
      cantidad_solicitada: i.cantidad_solicitada,
    }));

    const res = await crearSolicitudReposicionAction(payload, observacion);
    if (!res.ok) {
      message.error(res.error || "No se pudo crear la solicitud.");
      setGuardando(false);
      return;
    }

    message.success(`Solicitud ${res.nro_solicitud} registrada con éxito.`);

    const nuevaSol: SolicitudUI = {
      id_solicitud: Date.now(),
      nro_solicitud: res.nro_solicitud || "SR-000000",
      fecha_solicitud: new Date().toISOString(),
      estado: "PENDIENTE",
      observacion,
      solicitante: "Mi Usuario",
      items: [...itemsPropuestos],
    };

    setSolicitudes((prev) => [nuevaSol, ...prev]);
    setModalAbierto(false);
    setGuardando(false);
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Solicitudes de Reposición de Inventario"
        subtitulo="Generación de requerimientos de abastecimiento cuando el stock cae por debajo del mínimo (RF-INV-10, RF-ADQ-01, 02)"
        extra={
          puedeSolicitar && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={abrirModalNuevaSolicitud}
            >
              Nueva Solicitud de Reposición
            </Button>
          )
        }
      />

      {/* Banner si hay productos bajo mínimo sin atender */}
      {productosBajoMinimo.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            <span>
              Existen <b>{productosBajoMinimo.length} productos</b> por debajo del stock mínimo.
            </span>
          }
          description="Puede generar una solicitud de reposición para que la Unidad de Adquisiciones inicie la cotización con proveedores."
          action={
            puedeSolicitar ? (
              <Button size="small" type="primary" onClick={abrirModalNuevaSolicitud}>
                Generar Solicitud Ahora
              </Button>
            ) : null
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Tabla de Solicitudes */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_solicitud"
          dataSource={solicitudes}
          pagination={{ pageSize: 8 }}
          expandable={{
            expandedRowRender: (record: SolicitudUI) => (
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 6 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: COLORES_ERP.azulProfundo }}>
                  Productos Solicitados para Reposición:
                </div>
                <Table
                  size="small"
                  rowKey="id_producto"
                  pagination={false}
                  dataSource={record.items}
                  columns={[
                    {
                      title: "Código",
                      dataIndex: "codigo",
                      key: "codigo",
                      width: 100,
                      render: (c: string) => <Tag color="blue">{c}</Tag>,
                    },
                    { title: "Producto", dataIndex: "nombre", key: "nombre" },
                    {
                      title: "Stock al Solicitar",
                      dataIndex: "stock_actual_ref",
                      key: "stock_ref",
                      width: 140,
                      align: "center",
                      render: (s: number, it: ItemSolicitudUI) => (
                        <span style={{ color: COLORES_ERP.rojoError, fontWeight: 700 }}>
                          {s} / Mín: {it.stock_minimo_ref}
                        </span>
                      ),
                    },
                    {
                      title: "Cantidad Solicitada",
                      dataIndex: "cantidad_solicitada",
                      key: "cant_sol",
                      width: 140,
                      align: "center",
                      render: (c: number) => (
                        <Tag color="green" style={{ fontWeight: 700, fontSize: 13 }}>
                          +{c} unidades
                        </Tag>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          }}
          columns={[
            {
              title: "N° Solicitud",
              dataIndex: "nro_solicitud",
              key: "nro_solicitud",
              width: 140,
              render: (nro: string) => (
                <Tag color="geekblue" style={{ fontWeight: 700 }}>
                  {nro}
                </Tag>
              ),
            },
            {
              title: "Fecha",
              dataIndex: "fecha_solicitud",
              key: "fecha_solicitud",
              width: 155,
              render: (f: string) => formatearFechaHora(f),
            },
            {
              title: "Solicitante",
              dataIndex: "solicitante",
              key: "solicitante",
              width: 180,
            },
            {
              title: "Observación",
              dataIndex: "observacion",
              key: "observacion",
              render: (obs: string) => obs || <span style={{ color: "#94a3b8" }}>—</span>,
            },
            {
              title: "Estado",
              dataIndex: "estado",
              key: "estado",
              width: 130,
              align: "center",
              render: (st: string) => <EtiquetaEstado estado={st} />,
            },
            {
              title: "Acción",
              key: "accion",
              width: 160,
              align: "center",
              render: (_: unknown, r: SolicitudUI) =>
                puedeAtender && r.estado === "PENDIENTE" ? (
                  <Link href="/adquisiciones/requerimientos">
                    <Button type="primary" size="small" icon={<AuditOutlined />}>
                      Atender en Adq.
                    </Button>
                  </Link>
                ) : (
                  <Tag color="default">
                    {r.items.length} producto{r.items.length !== 1 ? "s" : ""}
                  </Tag>
                ),
            },
          ]}
        />
      </Card>

      {/* Modal Nueva Solicitud (Propone automáticamente productos bajo mínimo) */}
      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: COLORES_ERP.verdeAcento }} />
            <span>Generar Solicitud de Reposición (RF-INV-10)</span>
          </Space>
        }
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginTop: 12 }}>
          <p style={{ color: "#475569", fontSize: 13, marginBottom: 12 }}>
            El sistema ha detectado y pre-seleccionado los productos cuyo stock actual es menor al
            stock mínimo configurado:
          </p>

          <Table
            size="small"
            pagination={false}
            rowKey="id_producto"
            dataSource={itemsPropuestos}
            locale={{ emptyText: "No hay productos en la lista." }}
            columns={[
              {
                title: "Código",
                dataIndex: "codigo",
                key: "codigo",
                width: 90,
                render: (c: string) => <Tag color="blue">{c}</Tag>,
              },
              { title: "Producto", dataIndex: "nombre", key: "nombre" },
              {
                title: "Stock Actual / Mín",
                key: "stock_actual",
                width: 130,
                align: "center",
                render: (_: unknown, it: ItemSolicitudUI) => (
                  <span style={{ color: COLORES_ERP.rojoError, fontWeight: 600 }}>
                    {it.stock_actual_ref} / {it.stock_minimo_ref}
                  </span>
                ),
              },
              {
                title: "Cant. a Solicitar",
                key: "cant",
                width: 120,
                align: "center",
                render: (_: unknown, it: ItemSolicitudUI) => (
                  <InputNumber
                    min={1}
                    value={it.cantidad_solicitada}
                    size="small"
                    onChange={(val) => cambiarCantidadItem(it.id_producto, val)}
                  />
                ),
              },
              {
                title: "",
                key: "del",
                width: 45,
                align: "center",
                render: (_: unknown, it: ItemSolicitudUI) => (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => eliminarItemPropuesto(it.id_producto)}
                  />
                ),
              },
            ]}
          />

          {/* Opción de agregar otro producto manualmente si se desea */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              padding: "10px",
              background: "#f8fafc",
              borderRadius: 6,
            }}
          >
            <Select
              showSearch
              placeholder="Agregar otro producto a la solicitud..."
              style={{ flex: 1 }}
              value={productoAgregarId}
              onChange={(val) => setProductoAgregarId(val)}
              optionFilterProp="label"
              options={todosProductos.map((p) => ({
                value: p.id_producto,
                label: `[${p.codigo}] ${p.nombre} (Stock: ${p.stock_actual})`,
              }))}
            />
            <Button
              icon={<PlusOutlined />}
              disabled={!productoAgregarId}
              onClick={handleAgregarOtroProducto}
            >
              Agregar
            </Button>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Motivo / Observación de la reposición:
            </span>
            <Input.TextArea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Observación..."
              maxLength={250}
            />
          </div>

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button
                type="primary"
                loading={guardando}
                disabled={itemsPropuestos.length === 0}
                onClick={handleGuardarSolicitud}
              >
                Emitir Solicitud de Reposición
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
}
