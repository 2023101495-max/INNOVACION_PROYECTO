"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Tooltip,
} from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  SwapOutlined,
  AlertOutlined,
  InboxOutlined,
  TeamOutlined,
  AuditOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MobileOutlined,
} from "@ant-design/icons";
import { MENU_ERP, UsuarioSesion, tieneAlgunPermiso } from "@/lib/permisos";
import { COLORES_ERP } from "@/lib/tema";
import { cerrarSesionAction } from "@/app/actions/auth";

const { Header, Sider, Content } = Layout;

const ICONOS: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  ShoppingCartOutlined: <ShoppingCartOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  SwapOutlined: <SwapOutlined />,
  AlertOutlined: <AlertOutlined />,
  InboxOutlined: <InboxOutlined />,
  TeamOutlined: <TeamOutlined />,
  AuditOutlined: <AuditOutlined />,
  ContainerOutlined: <ContainerOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  DollarOutlined: <DollarOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

const NOMBRES_GRUPOS: Record<string, string> = {
  VENTAS: "UNIDAD DE VENTAS",
  INVENTARIO: "INVENTARIO Y ALMACÉN",
  ADQUISICIONES: "UNIDAD DE ADQUISICIONES",
  FINANZAS: "ADMINISTRACIÓN Y FINANZAS",
  GERENCIA: "GERENCIA GENERAL",
};

export default function ErpLayoutClient({
  usuario,
  children,
}: {
  usuario: UsuarioSesion;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Filtrar ítems del menú según los permisos efectivos del usuario
  const itemsPermitidos = MENU_ERP.filter((item) =>
    tieneAlgunPermiso(usuario, item.permisosRequeridos)
  );

  // Agrupar ítems por módulo para un menú claro y ordenado
  const modulosPresentes = Array.from(
    new Set(itemsPermitidos.map((i) => i.modulo))
  );

  const menuItems = modulosPresentes.map((modulo) => {
    const hijos = itemsPermitidos.filter((i) => i.modulo === modulo);
    if (modulo === "INICIO") {
      const item = hijos[0];
      return {
        key: item.ruta,
        icon: ICONOS[item.iconoNombre],
        label: item.label,
      };
    }
    return {
      type: "group" as const,
      label: collapsed ? "" : NOMBRES_GRUPOS[modulo] || modulo,
      children: hijos.map((item) => ({
        key: item.ruta,
        icon: ICONOS[item.iconoNombre],
        label: item.label,
      })),
    };
  });

  // Seleccionar el ítem activo actual (incluso si está en una subruta como /adquisiciones/requerimientos/2)
  const itemActivo =
    itemsPermitidos
      .filter((i) => i.ruta !== "/inicio" && pathname.startsWith(i.ruta))
      .sort((a, b) => b.ruta.length - a.ruta.length)[0]?.ruta || "/inicio";

  const handleCerrarSesion = async () => {
    setSaliendo(true);
    await cerrarSesionAction();
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={265}
        breakpoint="lg"
        className="no-print"
        style={{
          background: COLORES_ERP.fondoOscuro,
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo y título del ERP */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "0 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: COLORES_ERP.verdeAcento,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORES_ERP.fondoOscuro,
              fontSize: 20,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            <MobileOutlined />
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.15 }}>
              <div
                style={{
                  color: COLORES_ERP.blanco,
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: 0.3,
                }}
              >
                ERP TecnoCel
              </div>
              <div style={{ color: COLORES_ERP.verdeAcento, fontSize: 11 }}>
                Gestión Empresarial
              </div>
            </div>
          )}
        </div>

        {/* Menú de navegación filtrado por rol */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[itemActivo]}
          onClick={({ key }) => router.push(key)}
          items={menuItems}
          style={{
            background: COLORES_ERP.fondoOscuro,
            borderRight: 0,
            marginTop: 8,
          }}
        />
      </Sider>

      <Layout>
        <Header
          className="no-print"
          style={{
            background: COLORES_ERP.blanco,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e5eaf0",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Space align="center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            <Tag
              color={COLORES_ERP.azulProfundo}
              style={{
                margin: 0,
                fontSize: 12,
                padding: "2px 10px",
                fontWeight: 600,
              }}
            >
              {usuario.unidad}
            </Tag>
          </Space>

          <Space size="middle" align="center">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                lineHeight: 1.2,
              }}
            >
              <Avatar
                style={{
                  backgroundColor: COLORES_ERP.azulProfundo,
                  color: COLORES_ERP.verdeAcento,
                }}
                icon={<UserOutlined />}
              />
              <div style={{ textAlign: "right" }}>
                <Typography.Text
                  strong
                  style={{ display: "block", color: COLORES_ERP.fondoOscuro, fontSize: 13 }}
                >
                  {usuario.nombres} {usuario.apellidos}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {usuario.rol} ({usuario.username})
                </Typography.Text>
              </div>
            </div>

            <Tooltip title="Cerrar sesión">
              <Button
                danger
                type="default"
                icon={<LogoutOutlined />}
                loading={saliendo}
                onClick={handleCerrarSesion}
              >
                Salir
              </Button>
            </Tooltip>
          </Space>
        </Header>

        <Content
          style={{
            padding: 24,
            minHeight: "calc(100vh - 64px)",
            background: COLORES_ERP.grisFondo,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
