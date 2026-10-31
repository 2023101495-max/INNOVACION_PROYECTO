"use client";

import React from "react";
import Link from "next/link";
import {
  Alert,
  Card,
  Col,
  Row,
  Space,
  Tag,
  Statistic,
  Button,
  Table,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  AlertOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  AuditOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { UsuarioSesion, MENU_ERP, tieneAlgunPermiso } from "@/lib/permisos";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import { COLORES_ERP } from "@/lib/tema";
import { formatearMoneda } from "@/lib/formato";

interface Props {
  usuario: UsuarioSesion;
  accesoDenegado: boolean;
  modulo?: string;
  indicadores: {
    alertasStock: number;
    solicitudesPendientes: number;
    verificacionesPendientes: number;
    ventasHoyMonto: number;
    ventasHoyCantidad: number;
    ventasTotalMonto: number;
    ventasTotalCantidad: number;
    presupuesto: {
      anio: number;
      monto_asignado: number;
      monto_comprometido: number;
      monto_disponible: number;
      porcentaje_ejecucion: number;
      estado: string;
    } | null;
    productosBajoMinimo: Array<{
      id_producto: number;
      codigo: string;
      nombre: string;
      stock_actual: number;
      stock_minimo: number;
      faltante_al_minimo: number;
    }>;
  };
}

export default function InicioClient({
  usuario,
  accesoDenegado,
  modulo,
  indicadores,
}: Props) {
  const pantallasPermitidas = MENU_ERP.filter(
    (m) => m.ruta !== "/inicio" && tieneAlgunPermiso(usuario, m.permisosRequeridos)
  );

  return (
    <div>
      {accesoDenegado && (
        <Alert
          type="error"
          showIcon
          closable
          message="Acceso restringido por rol (RF-GGE-06)"
          description={`Su rol (${usuario.rol}) no cuenta con los permisos necesarios para acceder a ${
            modulo ? `"${modulo}"` : "la pantalla solicitada"
          }. Ha sido redirigido al Panel Principal.`}
          style={{ marginBottom: 20 }}
        />
      )}

      <EncabezadoPagina
        titulo={`Bienvenido(a), ${usuario.nombres} ${usuario.apellidos}`}
        subtitulo={`Unidad: ${usuario.unidad} · Rol: ${usuario.rol} (${usuario.username})`}
      />

      {/* Tarjetas de Indicadores Principales según Rol (RF-INV-09, RF-GGE-01 a 04) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Alertas de Stock Bajo Mínimo (Visible para Almacén, Ventas y Gerencia) */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              borderLeft: `5px solid ${indicadores.alertasStock > 0 ? COLORES_ERP.rojoError : COLORES_ERP.verdeAcento}`,
            }}
          >
            <Statistic
              title="Alertas de Stock Bajo Mínimo"
              value={indicadores.alertasStock}
              valueStyle={{
                color: indicadores.alertasStock > 0 ? COLORES_ERP.rojoError : COLORES_ERP.verdeAcento,
                fontWeight: 700,
              }}
              prefix={<AlertOutlined />}
              suffix={indicadores.alertasStock > 0 ? "prod." : "ok"}
            />
            <div style={{ marginTop: 8 }}>
              <Link href="/inventario/productos">
                <Button type="link" size="small" style={{ padding: 0 }}>
                  Ver productos bajo mínimo <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
          </Card>
        </Col>

        {/* Ventas Registradas (Ventas y Gerencia) */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, borderLeft: `5px solid ${COLORES_ERP.verdeAcento}` }}
          >
            <Statistic
              title="Ventas Acumuladas"
              value={indicadores.ventasTotalMonto}
              formatter={(val) => formatearMoneda(Number(val))}
              valueStyle={{ color: COLORES_ERP.azulProfundo, fontWeight: 700 }}
              prefix={<ShoppingCartOutlined style={{ color: COLORES_ERP.verdeAcento }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
              Total transacciones: <b>{indicadores.ventasTotalCantidad}</b>
            </div>
          </Card>
        </Col>

        {/* Solicitudes de Reposición y Verificaciones (Almacén, Adquisiciones, Finanzas) */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, borderLeft: `5px solid ${COLORES_ERP.azulInfo}` }}
          >
            <Statistic
              title="Solicitudes Pendientes"
              value={indicadores.solicitudesPendientes}
              valueStyle={{ color: COLORES_ERP.azulInfo, fontWeight: 700 }}
              prefix={<InboxOutlined />}
              suffix="sol."
            />
            <div style={{ marginTop: 8 }}>
              <Link href="/inventario/solicitudes">
                <Button type="link" size="small" style={{ padding: 0 }}>
                  Atender reposiciones <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
          </Card>
        </Col>

        {/* Presupuesto Disponible (Finanzas y Gerencia) */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, borderLeft: `5px solid ${COLORES_ERP.ambarAdvertencia}` }}
          >
            <Statistic
              title={`Saldo Presupuesto (${indicadores.presupuesto?.anio || 2026})`}
              value={indicadores.presupuesto?.monto_disponible || 0}
              formatter={(val) => formatearMoneda(Number(val))}
              valueStyle={{ color: COLORES_ERP.azulProfundo, fontWeight: 700 }}
              prefix={<DollarOutlined style={{ color: COLORES_ERP.ambarAdvertencia }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
              Ejecución: <b>{indicadores.presupuesto?.porcentaje_ejecucion ?? 0}%</b>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Si hay productos bajo mínimo, mostrar tabla de advertencia rápida */}
      {indicadores.productosBajoMinimo.length > 0 && (
        <Card
          title={
            <Space>
              <AlertOutlined style={{ color: COLORES_ERP.rojoError }} />
              <span style={{ color: COLORES_ERP.rojoError, fontWeight: 700 }}>
                Atención: Productos que Requieren Reposición Inmediata (RF-INV-08, 09)
              </span>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
          extra={
            tieneAlgunPermiso(usuario, ["INV_SOLICITAR_REPOS"]) && (
              <Link href="/inventario/solicitudes">
                <Button type="primary" size="small">
                  Generar Solicitud de Reposición
                </Button>
              </Link>
            )
          }
        >
          <Table
            size="small"
            pagination={false}
            rowKey="id_producto"
            dataSource={indicadores.productosBajoMinimo}
            columns={[
              { title: "Código", dataIndex: "codigo", key: "codigo", width: 110 },
              { title: "Producto", dataIndex: "nombre", key: "nombre" },
              {
                title: "Stock Actual",
                dataIndex: "stock_actual",
                key: "stock_actual",
                render: (val: number) => (
                  <span style={{ color: COLORES_ERP.rojoError, fontWeight: 700 }}>
                    {val} unidades
                  </span>
                ),
              },
              { title: "Stock Mínimo", dataIndex: "stock_minimo", key: "stock_minimo" },
              {
                title: "Faltante",
                dataIndex: "faltante_al_minimo",
                key: "faltante_al_minimo",
                render: (val: number) => <Tag color="error">-{val} unids.</Tag>,
              },
            ]}
          />
        </Card>
      )}

      {/* Perfil del Usuario y Accesos Habilitados */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: COLORES_ERP.verdeAcento }} />
                <span>Perfil y Permisos Efectivos en el Servidor (RF-GGE-06)</span>
              </Space>
            }
          >
            <p style={{ marginBottom: 12, color: "#475569" }}>
              Permisos asignados a su rol según la vista <code>v_permisos_usuario</code>:
            </p>
            <Space wrap size={[8, 8]}>
              {usuario.permisos.map((perm) => (
                <Tag
                  key={perm}
                  color={COLORES_ERP.azulProfundo}
                  style={{ fontWeight: 600, padding: "3px 10px" }}
                >
                  <SafetyCertificateOutlined style={{ marginRight: 5 }} />
                  {perm}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: COLORES_ERP.verdeAcento }} />
                <span>Opciones Habilitadas en su Menú Lateral</span>
              </Space>
            }
          >
            <p style={{ marginBottom: 12, color: "#475569" }}>
              Módulos y pantallas disponibles para su rol:
            </p>
            <Space wrap size={[8, 8]}>
              {pantallasPermitidas.map((item) => (
                <Link key={item.key} href={item.ruta}>
                  <Tag
                    color={COLORES_ERP.verdeAcento}
                    style={{
                      color: COLORES_ERP.fondoOscuro,
                      fontWeight: 600,
                      padding: "3px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </Tag>
                </Link>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
