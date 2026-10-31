"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  AlertOutlined,
  AppstoreAddOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import {
  guardarProductoAction,
  crearCategoriaAction,
  crearMarcaAction,
  ProductoInput,
} from "@/app/actions/inventario";

interface ProductoUI {
  id_producto: number;
  codigo: string;
  nombre: string;
  modelo: string;
  descripcion: string;
  id_categoria: number;
  id_marca: number;
  categoria: string;
  marca: string;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  estado: "ACTIVO" | "INACTIVO";
  bajo_minimo: boolean;
}

interface CategoriaUI {
  id_categoria: number;
  nombre: string;
}

interface MarcaUI {
  id_marca: number;
  nombre: string;
}

export default function ProductosClient({
  puedeEditar,
  productosIniciales,
  categoriasIniciales,
  marcasIniciales,
}: {
  puedeEditar: boolean;
  productosIniciales: ProductoUI[];
  categoriasIniciales: CategoriaUI[];
  marcasIniciales: MarcaUI[];
}) {
  const [productos, setProductos] = useState<ProductoUI[]>(productosIniciales);
  const [categorias, setCategorias] = useState<CategoriaUI[]>(categoriasIniciales);
  const [marcas, setMarcas] = useState<MarcaUI[]>(marcasIniciales);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [filtroMarca, setFiltroMarca] = useState<number | null>(null);
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);

  // Modales
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoUI | null>(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [formProducto] = Form.useForm();

  // Modales rápidos categoría / marca (Decisión #4)
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [modalMarcaAbierto, setModalMarcaAbierto] = useState(false);
  const [formCat] = Form.useForm();
  const [formMarca] = Form.useForm();

  const productosFiltrados = productos.filter((p) => {
    if (soloBajoMinimo && !p.bajo_minimo) return false;
    if (filtroCategoria && p.id_categoria !== filtroCategoria) return false;
    if (filtroMarca && p.id_marca !== filtroMarca) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const match =
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.modelo.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const abrirModalCrear = () => {
    setProductoEditando(null);
    formProducto.resetFields();
    setModalProductoAbierto(true);
  };

  const abrirModalEditar = (prod: ProductoUI) => {
    setProductoEditando(prod);
    formProducto.setFieldsValue({
      codigo: prod.codigo,
      nombre: prod.nombre,
      modelo: prod.modelo,
      descripcion: prod.descripcion,
      id_categoria: prod.id_categoria,
      id_marca: prod.id_marca,
      precio_venta: prod.precio_venta,
      stock_minimo: prod.stock_minimo,
      estado: prod.estado,
    });
    setModalProductoAbierto(true);
  };

  const handleGuardarProducto = async (values: any) => {
    setGuardandoProducto(true);
    const input: ProductoInput = {
      id_producto: productoEditando?.id_producto,
      codigo: values.codigo,
      nombre: values.nombre,
      modelo: values.modelo,
      descripcion: values.descripcion,
      id_categoria: values.id_categoria,
      id_marca: values.id_marca,
      precio_venta: values.precio_venta,
      stock_minimo: values.stock_minimo,
      stock_inicial: values.stock_inicial,
      estado: values.estado || "ACTIVO",
    };

    const res = await guardarProductoAction(input);
    if (!res.ok) {
      message.error(res.error || "No se pudo guardar el producto.");
      setGuardandoProducto(false);
      return;
    }

    message.success(
      productoEditando
        ? "Producto actualizado exitosamente."
        : "Producto registrado exitosamente."
    );

    // Actualizar estado local reactivo
    const catNom = categorias.find((c) => c.id_categoria === values.id_categoria)?.nombre || "";
    const marNom = marcas.find((m) => m.id_marca === values.id_marca)?.nombre || "";

    if (productoEditando) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id_producto === productoEditando.id_producto
            ? {
                ...p,
                codigo: values.codigo.toUpperCase(),
                nombre: values.nombre,
                modelo: values.modelo || "",
                descripcion: values.descripcion || "",
                id_categoria: values.id_categoria,
                id_marca: values.id_marca,
                categoria: catNom,
                marca: marNom,
                precio_venta: values.precio_venta,
                stock_minimo: values.stock_minimo,
                estado: values.estado,
                bajo_minimo: p.stock_actual < values.stock_minimo,
              }
            : p
        )
      );
    } else {
      // Re-render con nuevo producto
      const nuevoStock = Number(values.stock_inicial || 0);
      const nuevoProd: ProductoUI = {
        id_producto: Date.now(), // ID temporal
        codigo: values.codigo.toUpperCase(),
        nombre: values.nombre,
        modelo: values.modelo || "",
        descripcion: values.descripcion || "",
        id_categoria: values.id_categoria,
        id_marca: values.id_marca,
        categoria: catNom,
        marca: marNom,
        precio_venta: values.precio_venta,
        stock_actual: nuevoStock,
        stock_minimo: values.stock_minimo,
        estado: "ACTIVO",
        bajo_minimo: nuevoStock < values.stock_minimo,
      };
      setProductos((prev) => [nuevoProd, ...prev]);
    }

    setModalProductoAbierto(false);
    setGuardandoProducto(false);
  };

  const handleCrearCategoria = async (values: { nombre: string; descripcion?: string }) => {
    const res = await crearCategoriaAction(values.nombre, values.descripcion);
    if (res.ok && res.categoria) {
      message.success("Categoría creada.");
      setCategorias((prev) => [...prev, res.categoria]);
      formProducto.setFieldValue("id_categoria", res.categoria.id_categoria);
      setModalCatAbierto(false);
      formCat.resetFields();
    } else {
      message.error(res.error || "No se pudo crear la categoría.");
    }
  };

  const handleCrearMarca = async (values: { nombre: string }) => {
    const res = await crearMarcaAction(values.nombre);
    if (res.ok && res.marca) {
      message.success("Marca creada.");
      setMarcas((prev) => [...prev, res.marca]);
      formProducto.setFieldValue("id_marca", res.marca.id_marca);
      setModalMarcaAbierto(false);
      formMarca.resetFields();
    } else {
      message.error(res.error || "No se pudo crear la marca.");
    }
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Productos e Inventario"
        subtitulo="Gestión del catálogo de productos tecnológicos y niveles de stock (RF-INV-01 a 04, 08, 13)"
        extra={
          puedeEditar && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={abrirModalCrear}
              style={{ fontWeight: 600 }}
            >
              Nuevo Producto
            </Button>
          )
        }
      />

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} lg={6}>
            <Input
              placeholder="Buscar por código, nombre..."
              prefix={<SearchOutlined />}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} lg={5}>
            <Select
              placeholder="Todas las categorías"
              allowClear
              style={{ width: "100%" }}
              value={filtroCategoria}
              onChange={(val) => setFiltroCategoria(val)}
              options={categorias.map((c) => ({
                value: c.id_categoria,
                label: c.nombre,
              }))}
            />
          </Col>
          <Col xs={24} sm={8} lg={5}>
            <Select
              placeholder="Todas las marcas"
              allowClear
              style={{ width: "100%" }}
              value={filtroMarca}
              onChange={(val) => setFiltroMarca(val)}
              options={marcas.map((m) => ({
                value: m.id_marca,
                label: m.nombre,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Space align="center">
              <Switch
                checked={soloBajoMinimo}
                onChange={setSoloBajoMinimo}
                style={{ backgroundColor: soloBajoMinimo ? COLORES_ERP.rojoError : undefined }}
              />
              <span style={{ fontSize: 13, fontWeight: soloBajoMinimo ? 700 : 400 }}>
                <AlertOutlined style={{ color: COLORES_ERP.rojoError, marginRight: 4 }} />
                Solo productos bajo stock mínimo (RF-INV-08)
              </span>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Productos */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id_producto"
          dataSource={productosFiltrados}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Código",
              dataIndex: "codigo",
              key: "codigo",
              width: 105,
              render: (cod: string) => <Tag color="blue">{cod}</Tag>,
            },
            {
              title: "Producto",
              key: "nombre",
              render: (_: unknown, r: ProductoUI) => (
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
              title: "Precio Venta",
              dataIndex: "precio_venta",
              key: "precio_venta",
              width: 120,
              align: "right",
              render: (p: number) => (
                <span style={{ fontWeight: 600 }}>{formatearMoneda(p)}</span>
              ),
            },
            {
              title: "Stock Actual",
              dataIndex: "stock_actual",
              key: "stock_actual",
              width: 110,
              align: "center",
              render: (s: number, r: ProductoUI) => (
                <span
                  style={{
                    fontWeight: 700,
                    color: r.bajo_minimo ? COLORES_ERP.rojoError : COLORES_ERP.fondoOscuro,
                  }}
                >
                  {s} unids.
                </span>
              ),
            },
            {
              title: "Stock Mín.",
              dataIndex: "stock_minimo",
              key: "stock_minimo",
              width: 95,
              align: "center",
            },
            {
              title: "Situación",
              key: "situacion",
              width: 155,
              align: "center",
              render: (_: unknown, r: ProductoUI) => (
                <EtiquetaEstado
                  estado={r.bajo_minimo ? "REQUIERE REPOSICIÓN" : "DISPONIBLE"}
                />
              ),
            },
            {
              title: "Estado",
              dataIndex: "estado",
              key: "estado",
              width: 95,
              align: "center",
              render: (st: string) => <EtiquetaEstado estado={st} />,
            },
            {
              title: "Acción",
              key: "accion",
              width: 90,
              align: "center",
              render: (_: unknown, r: ProductoUI) =>
                puedeEditar ? (
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => abrirModalEditar(r)}
                  >
                    Editar
                  </Button>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </Card>

      {/* Modal Crear / Editar Producto */}
      <Modal
        title={productoEditando ? "Editar Producto" : "Registrar Nuevo Producto"}
        open={modalProductoAbierto}
        onCancel={() => setModalProductoAbierto(false)}
        footer={null}
        width={650}
      >
        <Form
          form={formProducto}
          layout="vertical"
          onFinish={handleGuardarProducto}
          requiredMark={false}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="codigo"
                label="Código Único"
                rules={[{ required: true, message: "Ingrese el código" }]}
              >
                <Input placeholder="Ej. SMT-005" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="nombre"
                label="Nombre del Producto"
                rules={[{ required: true, message: "Ingrese el nombre" }]}
              >
                <Input placeholder="Ej. Xiaomi Redmi Note 13 Pro 5G" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_categoria"
                label={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <span>Categoría</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<AppstoreAddOutlined />}
                      onClick={() => setModalCatAbierto(true)}
                      style={{ padding: 0, fontSize: 11 }}
                    >
                      + Nueva
                    </Button>
                  </Space>
                }
                rules={[{ required: true, message: "Seleccione categoría" }]}
              >
                <Select
                  placeholder="Seleccionar categoría"
                  options={categorias.map((c) => ({
                    value: c.id_categoria,
                    label: c.nombre,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="id_marca"
                label={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <span>Marca</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<TagsOutlined />}
                      onClick={() => setModalMarcaAbierto(true)}
                      style={{ padding: 0, fontSize: 11 }}
                    >
                      + Nueva
                    </Button>
                  </Space>
                }
                rules={[{ required: true, message: "Seleccione marca" }]}
              >
                <Select
                  placeholder="Seleccionar marca"
                  options={marcas.map((m) => ({
                    value: m.id_marca,
                    label: m.nombre,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="modelo" label="Modelo (opcional)">
                <Input placeholder="Ej. 23117RN68G" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="precio_venta"
                label="Precio de Venta (S/)"
                rules={[{ required: true, message: "Ingrese el precio" }]}
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock_minimo"
                label="Stock Mínimo (Alerta reposición)"
                rules={[{ required: true, message: "Ingrese el stock mínimo" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Ej. 5" />
              </Form.Item>
            </Col>

            {!productoEditando ? (
              <Col span={12}>
                <Form.Item
                  name="stock_inicial"
                  label="Stock Inicial en Almacén (opcional)"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="0 si ingresará después"
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col span={12}>
                <Form.Item name="estado" label="Estado del Producto">
                  <Select
                    options={[
                      { value: "ACTIVO", label: "ACTIVO" },
                      { value: "INACTIVO", label: "INACTIVO" },
                    ]}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Descripción o características principales..." />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Space>
              <Button onClick={() => setModalProductoAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={guardandoProducto}>
                Guardar Producto
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal rápido + Nueva Categoría (Decisión #4) */}
      <Modal
        title="Crear Nueva Categoría"
        open={modalCatAbierto}
        onCancel={() => setModalCatAbierto(false)}
        footer={null}
        width={420}
      >
        <Form form={formCat} layout="vertical" onFinish={handleCrearCategoria}>
          <Form.Item
            name="nombre"
            label="Nombre de la Categoría"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input placeholder="Ej. Consolas de videojuegos" />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción (opcional)">
            <Input placeholder="Descripción breve" />
          </Form.Item>
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalCatAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Crear Categoría
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal rápido + Nueva Marca (Decisión #4) */}
      <Modal
        title="Crear Nueva Marca"
        open={modalMarcaAbierto}
        onCancel={() => setModalMarcaAbierto(false)}
        footer={null}
        width={400}
      >
        <Form form={formMarca} layout="vertical" onFinish={handleCrearMarca}>
          <Form.Item
            name="nombre"
            label="Nombre de la Marca"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input placeholder="Ej. Realme" />
          </Form.Item>
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalMarcaAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Crear Marca
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
