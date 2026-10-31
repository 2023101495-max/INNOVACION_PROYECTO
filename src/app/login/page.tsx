"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Select,
  Divider,
  Tag,
  Row,
  Col,
  Space,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  MobileOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { iniciarSesionAction } from "@/app/actions/auth";
import { INTEGRANTES_EQUIPO, USUARIOS_PRUEBA } from "@/lib/permisos";
import { COLORES_ERP } from "@/lib/tema";

export default function LoginPage() {
  const [form] = Form.useForm();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSeleccionarUsuarioPrueba = (username: string) => {
    form.setFieldsValue({
      username,
      password: "Erp2026*",
    });
    setError(null);
  };

  const onFinish = async (values: { username: string; password: string }) => {
    setCargando(true);
    setError(null);
    try {
      const res = await iniciarSesionAction(values.username, values.password);
      if (!res.ok) {
        setError(res.error || "No se pudo iniciar sesión.");
        setCargando(false);
        return;
      }
      router.push("/inicio");
      router.refresh();
    } catch {
      setError("Error inesperado al intentar iniciar sesión.");
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORES_ERP.fondoOscuro} 0%, ${COLORES_ERP.azulProfundo} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Row
        gutter={[32, 32]}
        align="middle"
        justify="center"
        style={{ maxWidth: 1020, width: "100%" }}
      >
        {/* Columna izquierda: Información institucional y equipo */}
        <Col xs={24} md={12}>
          <div style={{ color: COLORES_ERP.blanco, paddingRight: 12 }}>
            <Space align="center" size="middle" style={{ marginBottom: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: COLORES_ERP.verdeAcento,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORES_ERP.fondoOscuro,
                  fontSize: 28,
                }}
              >
                <MobileOutlined />
              </div>
              <div>
                <Typography.Title
                  level={2}
                  style={{ color: COLORES_ERP.blanco, margin: 0, fontWeight: 800 }}
                >
                  ERP TecnoCel
                </Typography.Title>
                <Typography.Text style={{ color: COLORES_ERP.verdeAcento, fontWeight: 600 }}>
                  Sistema Integrado de Gestión Empresarial
                </Typography.Text>
              </div>
            </Space>

            <Typography.Paragraph
              style={{ color: "#d0d8e8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}
            >
              Comercializadora de celulares, equipos tecnológicos y accesorios. Control
              integrado de <b>Ventas</b>, <b>Inventario y Almacén</b>,{" "}
              <b>Adquisiciones</b>, <b>Administración y Finanzas</b> y{" "}
              <b>Gerencia General</b>.
            </Typography.Paragraph>

            <Card
              size="small"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                borderColor: "rgba(1, 195, 142, 0.35)",
                borderRadius: 10,
              }}
              styles={{ body: { padding: 18 } }}
            >
              <Space align="center" style={{ marginBottom: 10 }}>
                <TeamOutlined style={{ color: COLORES_ERP.verdeAcento, fontSize: 18 }} />
                <Typography.Text
                  strong
                  style={{ color: COLORES_ERP.verdeAcento, fontSize: 13 }}
                >
                  EQUIPO DESARROLLADOR — UCSS NUEVA CAJAMARCA
                </Typography.Text>
              </Space>
              <div style={{ fontSize: 12, color: "#a6b4c9", marginBottom: 10 }}>
                Innovación y Desarrollo Tecnológico — Ingeniería de Sistemas
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 6,
                }}
              >
                {INTEGRANTES_EQUIPO.map((integrante) => (
                  <li
                    key={integrante}
                    style={{
                      color: COLORES_ERP.blanco,
                      fontSize: 13.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: COLORES_ERP.verdeAcento,
                        display: "inline-block",
                      }}
                    />
                    {integrante}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Col>

        {/* Columna derecha: Formulario de Inicio de Sesión */}
        <Col xs={24} md={12}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
              border: "none",
            }}
            styles={{ body: { padding: 32 } }}
          >
            <div style={{ marginBottom: 20 }}>
              <Typography.Title
                level={3}
                style={{ margin: 0, color: COLORES_ERP.azulProfundo }}
              >
                Iniciar Sesión
              </Typography.Title>
              <Typography.Text type="secondary">
                Ingrese sus credenciales o elija un usuario de prueba para evaluar el ERP
              </Typography.Text>
            </div>

            {error && (
              <Alert
                message="Error de autenticación"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 18 }}
              />
            )}

            {/* Selector rápido de usuarios de prueba (Sección 8 - Pantalla 1) */}
            <div
              style={{
                background: "#f3f6f9",
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
                border: "1px dashed #cbd5e1",
              }}
            >
              <Space align="center" style={{ marginBottom: 6 }}>
                <SafetyCertificateOutlined style={{ color: COLORES_ERP.azulProfundo }} />
                <Typography.Text strong style={{ fontSize: 12.5, color: COLORES_ERP.azulProfundo }}>
                  Acceso rápido con usuarios de prueba (Contraseña: Erp2026*)
                </Typography.Text>
              </Space>
              <Select
                placeholder="Seleccione un usuario y rol de prueba..."
                style={{ width: "100%" }}
                onChange={handleSeleccionarUsuarioPrueba}
                options={USUARIOS_PRUEBA.map((u) => ({
                  value: u.username,
                  label: `${u.username} — ${u.rol} (${u.unidad})`,
                }))}
              />
            </div>

            <Divider style={{ margin: "12px 0 20px 0", fontSize: 12, color: "#94a3b8" }}>
              Credenciales de acceso
            </Divider>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                label="Nombre de usuario"
                name="username"
                rules={[{ required: true, message: "Ingrese su nombre de usuario" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Ej. lparedes, pquispe, mflores, evargas, rgutierrez"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label="Contraseña"
                name="password"
                rules={[{ required: true, message: "Ingrese su contraseña" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 8, marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  loading={cargando}
                  block
                  style={{ height: 46, fontSize: 15 }}
                >
                  Ingresar al Sistema
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Tag color={COLORES_ERP.azulProfundo} style={{ margin: 0 }}>
                RF-VEN-09 · RF-GGE-06 · Control de Acceso Basado en Roles
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
