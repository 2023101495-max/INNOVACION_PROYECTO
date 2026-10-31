"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { COLORES_ERP } from "@/lib/tema";
import { guardarProveedorAction, ProveedorInput } from "@/app/actions/adquisiciones";

interface ProveedorUI {
  id_proveedor: number;
  ruc: string;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  contacto: string | null;
  estado: "ACTIVO" | "INACTIVO";
}

export default function ProveedoresClient({
  proveedoresIniciales,
}: {
  proveedoresIniciales: ProveedorUI[];
}) {
  const [proveedores, setProveedores] = useState<ProveedorUI[]>(proveedoresIniciales);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ProveedorUI | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm();

  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!filtroTexto) return true;
    const q = filtroTexto.toLowerCase();
    return (
      p.ruc.includes(q) ||
      p.razon_social.toLowerCase().includes(q) ||
      (p.contacto && p.contacto.toLowerCase().includes(q))
    );
  });

  const abrirModalCrear = () => {
    setEditando(null);
    form.resetFields();
    setModalAbierto(true);
  };

  const abrirModalEditar = (prov: ProveedorUI) => {
    setEditando(prov);
    form.setFieldsValue({
      ruc: prov.ruc,
      razon_social: prov.razon_social,
      direccion: prov.direccion,
      telefono: prov.telefono,
      correo: prov.correo,
      contacto: prov.contacto,
      estado: prov.estado,
    });
    setModalAbierto(true);
  };

  const handleGuardar = async (values: any) => {
    setGuardando(true);
    const input: ProveedorInput = {
      id_proveedor: editando?.id_proveedor,
      ruc: values.ruc,
      razon_social: values.razon_social,
      direccion: values.direccion,
      telefono: values.telefono,
      correo: values.correo,
      contacto: values.contacto,
      estado: values.estado || "ACTIVO",
    };

    const res = await guardarProveedorAction(input);
    if (!res.ok) {
      message.error(res.error || "No se pudo guardar el proveedor.");
      setGuardando(false);
      return;
    }

    message.success(
      editando ? "Proveedor actualizado exitosamente." : "Proveedor registrado exitosamente."
    );

    if (editando) {
      setProveedores((prev) =>
        prev.map((p) =>
          p.id_proveedor === editando.id_proveedor ? { ...p, ...input } : p
        )
      );
    } else {
      const nuevo: ProveedorUI = {
        id_proveedor: Date.now(),
        ...input,
        direccion: input.direccion || null,
        telefono: input.telefono || null,
        correo: input.correo || null,
        contacto: input.contacto || null,
        estado: input.estado || "ACTIVO",
      };
      setProveedores((prev) => [nuevo, ...prev]);
    }

    setModalAbierto(false);
    setGuardando(false);
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Proveedores Homologados"
        subtitulo="Registro y administración de proveedores de bienes y servicios (RF-ADQ-03)"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={abrirModalCrear}
          >
            Nuevo Proveedor
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Buscar proveedor por RUC, razón social o persona de contacto..."
          prefix={<SearchOutlined />}
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          style={{ maxWidth: 450 }}
          allowClear
        />
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_proveedor"
          dataSource={proveedoresFiltrados}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "RUC",
              dataIndex: "ruc",
              key: "ruc",
              width: 140,
              render: (r: string) => <Tag color="blue" style={{ fontWeight: 700 }}>{r}</Tag>,
            },
            {
              title: "Razón Social",
              dataIndex: "razon_social",
              key: "razon_social",
              render: (rs: string) => <b style={{ color: COLORES_ERP.azulProfundo }}>{rs}</b>,
            },
            {
              title: "Contacto",
              dataIndex: "contacto",
              key: "contacto",
              render: (c: string | null) => c || <span style={{ color: "#94a3b8" }}>—</span>,
            },
            {
              title: "Teléfono",
              dataIndex: "telefono",
              key: "telefono",
              width: 130,
              render: (t: string | null) => t || <span style={{ color: "#94a3b8" }}>—</span>,
            },
            {
              title: "Correo",
              dataIndex: "correo",
              key: "correo",
              render: (m: string | null) => m || <span style={{ color: "#94a3b8" }}>—</span>,
            },
            {
              title: "Estado",
              dataIndex: "estado",
              key: "estado",
              width: 100,
              align: "center",
              render: (st: string) => <EtiquetaEstado estado={st} />,
            },
            {
              title: "Acción",
              key: "accion",
              width: 95,
              align: "center",
              render: (_: unknown, r: ProveedorUI) => (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => abrirModalEditar(r)}
                >
                  Editar
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editando ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        footer={null}
        width={580}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGuardar}
          requiredMark={false}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="ruc"
                label="RUC (11 dígitos)"
                rules={[
                  { required: true, message: "Ingrese el RUC" },
                  { pattern: /^\d{11}$/, message: "El RUC debe tener 11 dígitos" },
                ]}
              >
                <Input placeholder="Ej. 20601234561" maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="razon_social"
                label="Razón Social"
                rules={[{ required: true, message: "Ingrese la razón social" }]}
              >
                <Input placeholder="Ej. Distribuidora TecnoAndina S.A.C." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contacto" label="Persona de Contacto">
                <Input placeholder="Ej. Miguel Ortiz" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telefono" label="Teléfono / Celular">
                <Input placeholder="Ej. 014567890 / 987654321" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="correo"
                label="Correo Electrónico"
                rules={[{ type: "email", message: "Ingrese un correo válido" }]}
              >
                <Input placeholder="ventas@proveedor.pe" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="estado" label="Estado" initialValue="ACTIVO">
                <Select
                  options={[
                    { value: "ACTIVO", label: "ACTIVO" },
                    { value: "INACTIVO", label: "INACTIVO" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="direccion" label="Dirección Legal">
            <Input placeholder="Av. Los Pioneros 123, Lima..." />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardando}>
                Guardar Proveedor
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
