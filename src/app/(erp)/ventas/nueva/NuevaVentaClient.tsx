"use client";

import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Table,
  Button,
  InputNumber,
  Typography,
  Space,
  Tag,
  Divider,
  Modal,
  Alert,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { UsuarioSesion } from "@/lib/permisos";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import { formatearMoneda, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import { registrarVentaAction } from "@/app/actions/ventas";

interface ProductoCatalogo {
  id_producto: number;
  codigo: string;
  nombre: string;
  modelo: string;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  categoria: string;
  marca: string;
}

interface ItemCarrito {
  id_producto: number;
  codigo: string;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
  cantidad: number;
  importe: number;
}

export default function NuevaVentaClient({
  usuario,
  productosIniciales,
}: {
  usuario: UsuarioSesion;
  productosIniciales: ProductoCatalogo[];
}) {
  const [productos, setProductos] = useState<ProductoCatalogo[]>(productosIniciales);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [observacion, setObservacion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorVenta, setErrorVenta] = useState<string | null>(null);

  // Estado para el modal de comprobante de venta exitosa
  const [ventaCompletada, setVentaCompletada] = useState<{
    nro_venta: string;
    total: number;
    items: ItemCarrito[];
    fecha: Date;
    observacion?: string;
  } | null>(null);

  // Filtrado de productos en catálogo
  const productosFiltrados = productos.filter((p) => {
    const q = filtroTexto.toLowerCase();
    return (
      p.codigo.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.marca.toLowerCase().includes(q)
    );
  });

  const agregarAlCarrito = (prod: ProductoCatalogo) => {
    if (prod.stock_actual <= 0) {
      message.error(`El producto "${prod.nombre}" no tiene stock disponible.`);
      return;
    }

    setCarrito((prev) => {
      const index = prev.findIndex((i) => i.id_producto === prod.id_producto);
      if (index >= 0) {
        const itemActual = prev[index];
        if (itemActual.cantidad + 1 > prod.stock_actual) {
          message.warning(
            `No puede agregar más de ${prod.stock_actual} unidades (stock disponible).`
          );
          return prev;
        }
        const nuevo = [...prev];
        nuevo[index] = {
          ...itemActual,
          cantidad: itemActual.cantidad + 1,
          importe: (itemActual.cantidad + 1) * itemActual.precio_venta,
        };
        return nuevo;
      }

      return [
        ...prev,
        {
          id_producto: prod.id_producto,
          codigo: prod.codigo,
          nombre: prod.nombre,
          precio_venta: prod.precio_venta,
          stock_actual: prod.stock_actual,
          cantidad: 1,
          importe: prod.precio_venta,
        },
      ];
    });
  };

  const cambiarCantidad = (id_producto: number, cantidad: number | null) => {
    const cant = cantidad ?? 1;
    if (cant <= 0) return;

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id_producto === id_producto) {
          if (cant > item.stock_actual) {
            message.warning(
              `La cantidad (${cant}) supera el stock disponible (${item.stock_actual}).`
            );
            return item;
          }
          return {
            ...item,
            cantidad: cant,
            importe: cant * item.precio_venta,
          };
        }
        return item;
      })
    );
  };

  const eliminarDelCarrito = (id_producto: number) => {
    setCarrito((prev) => prev.filter((i) => i.id_producto !== id_producto));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setObservacion("");
    setErrorVenta(null);
  };

  const totalVenta = carrito.reduce((acc, it) => acc + it.importe, 0);

  const handleRegistrarVenta = async () => {
    if (carrito.length === 0) {
      message.error("El carrito está vacío.");
      return;
    }

    setProcesando(true);
    setErrorVenta(null);

    const itemsPayload = carrito.map((i) => ({
      id_producto: i.id_producto,
      cantidad: i.cantidad,
      precio_unitario: i.precio_venta,
      nombre: i.nombre,
      codigo: i.codigo,
    }));

    const res = await registrarVentaAction(itemsPayload, observacion);

    if (!res.ok) {
      setErrorVenta(res.error || "No se pudo registrar la venta.");
      setProcesando(false);
      return;
    }

    // Actualizar catálogo local reduciendo el stock
    setProductos((prev) =>
      prev.map((p) => {
        const itemVendido = carrito.find((c) => c.id_producto === p.id_producto);
        if (itemVendido) {
          return { ...p, stock_actual: p.stock_actual - itemVendido.cantidad };
        }
        return p;
      })
    );

    // Guardar para el modal de comprobante
    setVentaCompletada({
      nro_venta: res.nro_venta || "V-000000",
      total: res.total ?? totalVenta,
      items: [...carrito],
      fecha: new Date(),
      observacion: observacion || undefined,
    });

    limpiarCarrito();
    setProcesando(false);
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Punto de Venta (POS) — Nueva Venta"
        subtitulo="Seleccione los productos del catálogo, configure las cantidades y registre la venta (RF-VEN-01 a 10)"
      />

      {errorVenta && (
        <Alert
          type="error"
          showIcon
          closable
          message="No se pudo registrar la venta"
          description={errorVenta}
          onClose={() => setErrorVenta(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Catálogo de Productos */}
        <Col xs={24} lg={13}>
          <Card
            title={
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <span>Catálogo de Productos Disponibles</span>
                <Input
                  placeholder="Buscar por código, nombre o marca..."
                  prefix={<SearchOutlined />}
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  style={{ width: 260 }}
                  allowClear
                />
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table
              size="middle"
              rowKey="id_producto"
              dataSource={productosFiltrados}
              pagination={{ pageSize: 7, showSizeChanger: false }}
              columns={[
                {
                  title: "Código",
                  dataIndex: "codigo",
                  key: "codigo",
                  width: 95,
                  render: (cod: string) => <Tag color="blue">{cod}</Tag>,
                },
                {
                  title: "Producto",
                  key: "nombre",
                  render: (_: unknown, r: ProductoCatalogo) => (
                    <div>
                      <div style={{ fontWeight: 600, color: COLORES_ERP.azulProfundo }}>
                        {r.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {r.categoria} · {r.marca} {r.modelo ? `(${r.modelo})` : ""}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Precio",
                  dataIndex: "precio_venta",
                  key: "precio_venta",
                  width: 105,
                  align: "right",
                  render: (p: number) => (
                    <span style={{ fontWeight: 600 }}>{formatearMoneda(p)}</span>
                  ),
                },
                {
                  title: "Stock",
                  dataIndex: "stock_actual",
                  key: "stock_actual",
                  width: 95,
                  align: "center",
                  render: (stock: number, r: ProductoCatalogo) => (
                    <Tag
                      color={
                        stock === 0
                          ? "red"
                          : stock < r.stock_minimo
                          ? "orange"
                          : "green"
                      }
                      style={{ fontWeight: 700 }}
                    >
                      {stock} unids.
                    </Tag>
                  ),
                },
                {
                  title: "Acción",
                  key: "accion",
                  width: 85,
                  align: "center",
                  render: (_: unknown, r: ProductoCatalogo) => (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      disabled={r.stock_actual <= 0}
                      onClick={() => agregarAlCarrito(r)}
                    >
                      Agregar
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Carrito de Compra y Registro */}
        <Col xs={24} lg={11}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: COLORES_ERP.verdeAcento }} />
                <span>Carrito de Venta ({carrito.length} productos)</span>
              </Space>
            }
            extra={
              carrito.length > 0 && (
                <Button
                  size="small"
                  danger
                  icon={<ClearOutlined />}
                  onClick={limpiarCarrito}
                >
                  Vaciar
                </Button>
              )
            }
          >
            <Table
              size="small"
              rowKey="id_producto"
              dataSource={carrito}
              pagination={false}
              locale={{ emptyText: "El carrito está vacío. Agregue productos del catálogo." }}
              columns={[
                {
                  title: "Producto",
                  dataIndex: "nombre",
                  key: "nombre",
                  render: (nombre: string, it: ItemCarrito) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{nombre}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Disp: {it.stock_actual} | {formatearMoneda(it.precio_venta)} c/u
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Cant.",
                  key: "cantidad",
                  width: 95,
                  render: (_: unknown, it: ItemCarrito) => (
                    <InputNumber
                      min={1}
                      max={it.stock_actual}
                      value={it.cantidad}
                      size="small"
                      onChange={(val) => cambiarCantidad(it.id_producto, val)}
                    />
                  ),
                },
                {
                  title: "Importe",
                  dataIndex: "importe",
                  key: "importe",
                  width: 100,
                  align: "right",
                  render: (imp: number) => (
                    <span style={{ fontWeight: 700 }}>{formatearMoneda(imp)}</span>
                  ),
                },
                {
                  title: "",
                  key: "eliminar",
                  width: 45,
                  align: "center",
                  render: (_: unknown, it: ItemCarrito) => (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => eliminarDelCarrito(it.id_producto)}
                    />
                  ),
                },
              ]}
            />

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Observación (opcional):
              </Typography.Text>
              <Input.TextArea
                rows={2}
                placeholder="Observación de la venta..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                maxLength={250}
              />
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: "14px 18px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                  Total a Cobrar (RF-VEN-07):
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: "#64748b" }}>
                  Vendedor: {usuario.nombres} ({usuario.username})
                </Typography.Text>
              </div>
              <Typography.Title
                level={2}
                style={{
                  margin: 0,
                  color: COLORES_ERP.verdeAcento,
                  fontWeight: 800,
                }}
              >
                {formatearMoneda(totalVenta)}
              </Typography.Title>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<CheckCircleOutlined />}
              disabled={carrito.length === 0}
              loading={procesando}
              onClick={handleRegistrarVenta}
              style={{ height: 48, fontSize: 16 }}
            >
              Registrar Venta
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Modal con Comprobante Imprimible de Venta (RF-VEN-11, 12) */}
      <Modal
        open={!!ventaCompletada}
        onCancel={() => setVentaCompletada(null)}
        footer={[
          <Button
            key="imprimir"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Imprimir Comprobante
          </Button>,
          <Button
            key="cerrar"
            type="primary"
            onClick={() => setVentaCompletada(null)}
          >
            Nueva Venta
          </Button>,
        ]}
        width={580}
      >
        {ventaCompletada && (
          <div className="printable-card" style={{ padding: "10px 6px" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <Typography.Title level={3} style={{ margin: 0, color: COLORES_ERP.azulProfundo }}>
                ERP TecnoCel
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Comercializadora de Productos Tecnológicos
              </Typography.Text>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                COMPROBANTE DE VENTA INTERNA
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "#f1f5f9",
                padding: "10px 14px",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div>
                <div>
                  <b>N° Venta:</b>{" "}
                  <span style={{ color: COLORES_ERP.verdeAcento, fontWeight: 700 }}>
                    {ventaCompletada.nro_venta}
                  </span>
                </div>
                <div>
                  <b>Fecha/Hora:</b> {formatearFechaHora(ventaCompletada.fecha)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>
                  <b>Vendedor:</b> {usuario.nombres} {usuario.apellidos}
                </div>
                <div>
                  <b>Usuario:</b> {usuario.username}
                </div>
              </div>
            </div>

            <Table
              size="small"
              pagination={false}
              rowKey="id_producto"
              dataSource={ventaCompletada.items}
              columns={[
                { title: "Cant.", dataIndex: "cantidad", key: "cant", width: 55, align: "center" },
                { title: "Descripción", dataIndex: "nombre", key: "desc" },
                {
                  title: "P. Unit.",
                  dataIndex: "precio_venta",
                  key: "p_unit",
                  width: 95,
                  align: "right",
                  render: (p: number) => formatearMoneda(p),
                },
                {
                  title: "Importe",
                  dataIndex: "importe",
                  key: "imp",
                  width: 105,
                  align: "right",
                  render: (i: number) => (
                    <span style={{ fontWeight: 700 }}>{formatearMoneda(i)}</span>
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
                borderTop: "2px solid #e2e8f0",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 14, marginRight: 12 }}>TOTAL VENTA:</span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: COLORES_ERP.azulProfundo,
                  }}
                >
                  {formatearMoneda(ventaCompletada.total)}
                </span>
              </div>
            </div>

            {ventaCompletada.observacion && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                <b>Observación:</b> {ventaCompletada.observacion}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
