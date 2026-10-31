import React from "react";
import { Alert, Card, Col, Row, Space, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { exigirPermisoPagina } from "@/lib/sesion";
import { MENU_ERP, tieneAlgunPermiso } from "@/lib/permisos";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import { COLORES_ERP } from "@/lib/tema";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ denegado?: string; modulo?: string }>;
}) {
  const usuario = await exigirPermisoPagina();
  const params = await searchParams;
  const accesoDenegado = params?.denegado === "1";

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
            params?.modulo ? `"${params.modulo}"` : "la pantalla solicitada"
          }. Ha sido redirigido al Panel Principal.`}
          style={{ marginBottom: 20 }}
        />
      )}

      <EncabezadoPagina
        titulo={`Bienvenido(a), ${usuario.nombres} ${usuario.apellidos}`}
        subtitulo={`Unidad: ${usuario.unidad} · Rol: ${usuario.rol} (${usuario.username})`}
      />

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
                <Tag
                  key={item.key}
                  color={COLORES_ERP.verdeAcento}
                  style={{
                    color: COLORES_ERP.fondoOscuro,
                    fontWeight: 600,
                    padding: "3px 10px",
                  }}
                >
                  {item.label}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
