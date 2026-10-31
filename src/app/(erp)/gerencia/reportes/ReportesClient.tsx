"use client";

import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tabs,
  Tag,
  Typography,
  Space,
  message,
} from "antd";
import {
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  FileExcelOutlined,
  RiseOutlined,
  PieChartOutlined,
  BarChartOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda, formatearNumero } from "@/lib/formato";

const { Text, Title } = Typography;

interface ReportesClientProps {
  ventasDiarias: Array<{
    fecha: string;
    nro_ventas: number;
    unidades: number;
    monto: number;
  }>;
  ventasPorProducto: Array<{
    producto: string;
    codigo: string;
    categoria: string;
    unidades: number;
    monto: number;
  }>;
  inventarioConsolidado: any[];
  adquisiciones: any[];
  presupuesto: any;
  adqsPorEstado: Array<{
    estado: string;
    cantidad: number;
  }>;
}

const COLORES_PASTEL = ["#01c38e", "#2d7ff9", "#f5a524", "#e5484d", "#7c3aed", "#132d46"];

export default function ReportesClient({
  ventasDiarias,
  ventasPorProducto,
  inventarioConsolidado,
  adquisiciones,
  presupuesto,
  adqsPorEstado,
}: ReportesClientProps) {
  const [descargandoExcel, setDescargandoExcel] = useState(false);

  // Totales para KPIs
  const totalVendido = ventasDiarias.reduce((acc, v) => acc + v.monto, 0);
  const totalUnidadesVendidas = ventasDiarias.reduce((acc, v) => acc + v.unidades, 0);

  const totalValorInventario = inventarioConsolidado.reduce(
    (acc, item) => acc + Number(item.valor_inventario_compra || 0),
    0
  );
  const totalItemsEnAlerta = inventarioConsolidado.filter(
    (item) => item.alerta_reposicion === true
  ).length;

  const totalOrdenesCompletadas = adquisiciones.filter(
    (a) => a.estado_adquisicion === "FINALIZADA" || a.estado_adquisicion === "RECEPCIONADA"
  ).length;

  const handleDescargarExcel = async () => {
    try {
      setDescargandoExcel(true);
      message.loading({ content: "Generando reporte ejecutivo en Excel...", key: "excel" });

      const resp = await fetch("/api/exportar/reporte-gerencia");
      if (!resp.ok) {
        throw new Error("Error al generar el reporte en Excel");
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_Gerencial_TecnoCel_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success({ content: "Reporte Excel descargado correctamente", key: "excel" });
    } catch (err: any) {
      message.error({
        content: err.message || "No se pudo descargar el Excel",
        key: "excel",
      });
    } finally {
      setDescargandoExcel(false);
    }
  };

  // Datos para gráfico de Presupuesto (Comprometido vs Disponible)
  const datosPresupuesto = presupuesto
    ? [
        {
          name: "Comprometido",
          valor: Number(presupuesto.monto_comprometido || 0),
          color: "#f5a524",
        },
        {
          name: "Disponible",
          valor: Number(presupuesto.saldo_disponible || 0),
          color: "#01c38e",
        },
      ]
    : [];

  return (
    <div style={{ paddingBottom: 32 }}>
      <EncabezadoPagina
        titulo="Panel de Reportes Gerenciales y BI"
        subtitulo="Visión consolidada de ventas, inventario valorizado, adquisiciones y ejecución presupuestal"
        extra={
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            size="large"
            loading={descargandoExcel}
            onClick={handleDescargarExcel}
            style={{
              backgroundColor: "#01c38e",
              borderColor: "#01c38e",
              fontWeight: 600,
            }}
          >
            Exportar Excel Consolidado (.xlsx)
          </Button>
        }
      />

      {/* TARJETAS KPI RESUMEN */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #132d46 0%, #1a1e29 100%)",
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.7)" }}>Ventas Totales Registradas</span>}
              value={totalVendido}
              precision={2}
              prefix={<DollarOutlined style={{ color: "#01c38e" }} />}
              formatter={(val) => (
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {formatearMoneda(Number(val))}
                </span>
              )}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {formatearNumero(totalUnidadesVendidas)} unidades vendidas en total
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #132d46 0%, #1a1e29 100%)",
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.7)" }}>Inventario Valorizado (Costo)</span>}
              value={totalValorInventario}
              precision={2}
              prefix={<InboxOutlined style={{ color: "#2d7ff9" }} />}
              formatter={(val) => (
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {formatearMoneda(Number(val))}
                </span>
              )}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {totalItemsEnAlerta > 0 ? (
                <Tag color="error">{totalItemsEnAlerta} productos bajo stock mínimo</Tag>
              ) : (
                <Tag color="success">Stock en niveles óptimos</Tag>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #132d46 0%, #1a1e29 100%)",
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.7)" }}>Saldo Presupuestal Disponible</span>}
              value={presupuesto ? Number(presupuesto.saldo_disponible) : 0}
              precision={2}
              prefix={<PieChartOutlined style={{ color: "#01c38e" }} />}
              formatter={(val) => (
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {formatearMoneda(Number(val))}
                </span>
              )}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Periodo {presupuesto?.periodo || "Actual"} ({presupuesto?.porcentaje_ejecucion || 0}% ejecutado)
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #132d46 0%, #1a1e29 100%)",
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.7)" }}>Adquisiciones en Proceso</span>}
              value={adquisiciones.length}
              prefix={<ShoppingCartOutlined style={{ color: "#f5a524" }} />}
              formatter={(val) => (
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {val} registros
                </span>
              )}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {totalOrdenesCompletadas} completadas / recepcionadas
            </div>
          </Card>
        </Col>
      </Row>

      {/* GRÁFICOS VISUALES CON RECHARTS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Gráfico 1: Evolución de Ventas Diarias */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: "#01c38e" }} />
                <span>Evolución Diaria de Ventas (Soles)</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {ventasDiarias.length > 0 ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={ventasDiarias}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#01c38e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#01c38e" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 11 }}
                      stroke="#8c8c8c"
                    />
                    <YAxis
                      tickFormatter={(v) => `S/ ${v}`}
                      tick={{ fontSize: 11 }}
                      stroke="#8c8c8c"
                    />
                    <Tooltip
                      formatter={(val: any) => [formatearMoneda(Number(val)), "Monto Vendido"]}
                      labelFormatter={(lbl) => `Fecha: ${lbl}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="monto"
                      name="Monto Vendido"
                      stroke="#01c38e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMonto)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#8c8c8c" }}>
                No hay ventas registradas aún para graficar la tendencia.
              </div>
            )}
          </Card>
        </Col>

        {/* Gráfico 2: Situación Presupuestal (Comprometido vs Disponible) */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <PieChartOutlined style={{ color: "#2d7ff9" }} />
                <span>Ejecución Presupuestal ({presupuesto?.periodo || "Actual"})</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {presupuesto ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosPresupuesto}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="valor"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(1)}%`
                      }
                    >
                      {datosPresupuesto.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatearMoneda(Number(val)), "Monto"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#8c8c8c" }}>
                No se encontró presupuesto activo configurado.
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Gráfico 3: Top Productos Más Vendidos */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: "#132d46" }} />
                <span>Top Productos por Monto Facturado</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {ventasPorProducto.length > 0 ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ventasPorProducto.slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 80, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `S/ ${v}`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="producto"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatearMoneda(Number(val)), "Monto"]}
                    />
                    <Bar
                      dataKey="monto"
                      name="Monto Facturado"
                      fill="#132d46"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#8c8c8c" }}>
                Sin ventas por producto para clasificar.
              </div>
            )}
          </Card>
        </Col>

        {/* Gráfico 4: Adquisiciones por Estado */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <FileDoneOutlined style={{ color: "#f5a524" }} />
                <span>Distribución de Adquisiciones por Estado</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {adqsPorEstado.length > 0 ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={adqsPorEstado}
                    margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="estado"
                      tick={{ fontSize: 10, angle: -25, textAnchor: "end" }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="cantidad" name="Requerimientos" fill="#f5a524" radius={[6, 6, 0, 0]}>
                      {adqsPorEstado.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORES_PASTEL[index % COLORES_PASTEL.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#8c8c8c" }}>
                Sin historial de adquisiciones registrado.
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* PESTAÑAS DE TABLAS DE DETALLE AUDITABLE */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Tabs
          defaultActiveKey="ventas"
          items={[
            {
              key: "ventas",
              label: (
                <span>
                  <RiseOutlined /> Ventas Diarias
                </span>
              ),
              children: (
                <Table
                  dataSource={ventasDiarias}
                  rowKey="fecha"
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Fecha",
                      dataIndex: "fecha",
                      key: "fecha",
                      render: (_, r) => <b>{r.fecha}</b>,
                    },
                    {
                      title: "Transacciones (Tickets)",
                      dataIndex: "nro_ventas",
                      key: "nro_ventas",
                      align: "center",
                      render: (val) => formatearNumero(val),
                    },
                    {
                      title: "Unidades Totales",
                      dataIndex: "unidades",
                      key: "unidades",
                      align: "center",
                      render: (val) => formatearNumero(val),
                    },
                    {
                      title: "Monto Facturado",
                      dataIndex: "monto",
                      key: "monto",
                      align: "right",
                      render: (val) => (
                        <span style={{ fontWeight: 600, color: "#01c38e" }}>
                          {formatearMoneda(val)}
                        </span>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "productos",
              label: (
                <span>
                  <ShoppingCartOutlined /> Productos Más Vendidos
                </span>
              ),
              children: (
                <Table
                  dataSource={ventasPorProducto}
                  rowKey="codigo"
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Código",
                      dataIndex: "codigo",
                      key: "codigo",
                      render: (c) => <Tag>{c}</Tag>,
                    },
                    {
                      title: "Producto",
                      dataIndex: "producto",
                      key: "producto",
                      render: (p) => <b>{p}</b>,
                    },
                    {
                      title: "Categoría",
                      dataIndex: "categoria",
                      key: "categoria",
                    },
                    {
                      title: "Unidades",
                      dataIndex: "unidades",
                      key: "unidades",
                      align: "center",
                      render: (u) => formatearNumero(u),
                    },
                    {
                      title: "Monto Facturado",
                      dataIndex: "monto",
                      key: "monto",
                      align: "right",
                      render: (m) => (
                        <span style={{ fontWeight: 600, color: "#132d46" }}>
                          {formatearMoneda(m)}
                        </span>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "inventario",
              label: (
                <span>
                  <InboxOutlined /> Inventario Consolidado
                </span>
              ),
              children: (
                <Table
                  dataSource={inventarioConsolidado}
                  rowKey="id_producto"
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Código",
                      dataIndex: "codigo",
                      key: "codigo",
                      render: (c) => <Tag>{c}</Tag>,
                    },
                    {
                      title: "Producto",
                      dataIndex: "producto",
                      key: "producto",
                      render: (p) => <b>{p}</b>,
                    },
                    {
                      title: "Categoría",
                      dataIndex: "categoria",
                      key: "categoria",
                    },
                    {
                      title: "Stock Actual",
                      dataIndex: "stock_actual",
                      key: "stock_actual",
                      align: "center",
                      render: (st, r) => (
                        <span
                          style={{
                            fontWeight: 700,
                            color: st <= r.stock_minimo ? "#e5484d" : "inherit",
                          }}
                        >
                          {st}
                        </span>
                      ),
                    },
                    {
                      title: "Stock Mínimo",
                      dataIndex: "stock_minimo",
                      key: "stock_minimo",
                      align: "center",
                    },
                    {
                      title: "Costo Ref.",
                      dataIndex: "precio_compra_referencial",
                      key: "precio_compra_referencial",
                      align: "right",
                      render: (val) => formatearMoneda(Number(val || 0)),
                    },
                    {
                      title: "Valor Compra",
                      dataIndex: "valor_inventario_compra",
                      key: "valor_inventario_compra",
                      align: "right",
                      render: (val) => (
                        <span style={{ fontWeight: 600 }}>
                          {formatearMoneda(Number(val || 0))}
                        </span>
                      ),
                    },
                    {
                      title: "Estado Reposición",
                      dataIndex: "alerta_reposicion",
                      key: "alerta_reposicion",
                      align: "center",
                      render: (alerta) =>
                        alerta ? (
                          <Tag color="error">CRÍTICO: Reponer</Tag>
                        ) : (
                          <Tag color="success">Nivel OK</Tag>
                        ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "adquisiciones",
              label: (
                <span>
                  <FileDoneOutlined /> Historial Adquisiciones
                </span>
              ),
              children: (
                <Table
                  dataSource={adquisiciones}
                  rowKey="id_adquisicion"
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "ID",
                      dataIndex: "id_adquisicion",
                      key: "id_adquisicion",
                      render: (id) => <Tag color="blue">REQ-{id}</Tag>,
                    },
                    {
                      title: "Tipo",
                      dataIndex: "tipo_adquisicion",
                      key: "tipo_adquisicion",
                    },
                    {
                      title: "Estado Requerimiento",
                      dataIndex: "estado_adquisicion",
                      key: "estado_adquisicion",
                      render: (st) => <EtiquetaEstado estado={st} />,
                    },
                    {
                      title: "Orden Emitida",
                      dataIndex: "numero_orden",
                      key: "numero_orden",
                      render: (num) => (num ? <b>{num}</b> : <Text type="secondary">—</Text>),
                    },
                    {
                      title: "Proveedor",
                      dataIndex: "proveedor_razon_social",
                      key: "proveedor_razon_social",
                      render: (prov, r) =>
                        prov ? (
                          <div>
                            <div>{prov}</div>
                            <small style={{ color: "#8c8c8c" }}>RUC: {r.proveedor_ruc}</small>
                          </div>
                        ) : (
                          <Text type="secondary">—</Text>
                        ),
                    },
                    {
                      title: "Monto Orden",
                      dataIndex: "total_orden",
                      key: "total_orden",
                      align: "right",
                      render: (val) =>
                        val ? (
                          <span style={{ fontWeight: 600 }}>{formatearMoneda(Number(val))}</span>
                        ) : (
                          <Text type="secondary">—</Text>
                        ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
