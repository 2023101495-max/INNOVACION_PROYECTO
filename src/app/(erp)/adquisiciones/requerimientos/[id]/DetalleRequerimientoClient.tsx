"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Divider,
  Alert,
  Tabs,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  FileDoneOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  SwapOutlined,
  DeleteOutlined,
  SendOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EtiquetaEstado from "@/components/EtiquetaEstado";
import { formatearMoneda, formatearFecha, formatearFechaHora } from "@/lib/formato";
import { COLORES_ERP } from "@/lib/tema";
import {
  registrarCotizacionAction,
  seleccionarCotizacionAction,
  solicitarVerificacionAction,
  registrarReplanteamientoAction,
  decidirAdquisicionAction,
  emitirOrdenAction,
  ItemCotizacionInput,
  ItemOrdenInput,
} from "@/app/actions/adquisiciones";

interface Props {
  adquisicion: {
    id_adquisicion: number;
    nro_adquisicion: string;
    tipo: "BIEN" | "SERVICIO";
    descripcion: string;
    monto_estimado: number;
    estado: string;
    fecha_registro: string;
    nro_solicitud: string | null;
    id_solicitud: number | null;
    registrado_por: string;
  };
  cotizaciones: any[];
  decisiones: any[];
  verificaciones: any[];
  ordenes: any[];
  proveedores: any[];
  productos: any[];
  itemsSolicitudRef: any[];
  permisos: {
    puedeCotizar: boolean;
    puedeDecidir: boolean;
    puedeEmitirOrden: boolean;
  };
}

export default function DetalleRequerimientoClient({
  adquisicion,
  cotizaciones,
  decisiones,
  verificaciones,
  ordenes,
  proveedores,
  productos,
  itemsSolicitudRef,
  permisos,
}: Props) {
  const router = useRouter();
  const [cargandoAccion, setCargandoAccion] = useState(false);

  // Modales
  const [modalCotizacionAbierto, setModalCotizacionAbierto] = useState(false);
  const [itemsCotizacion, setItemsCotizacion] = useState<ItemCotizacionInput[]>([]);
  const [formCot] = Form.useForm();

  const [modalSeleccionarAbierto, setModalSeleccionarAbierto] = useState(false);
  const [cotizacionASeleccionar, setCotizacionASeleccionar] = useState<number | null>(null);
  const [motivoSeleccion, setMotivoSeleccion] = useState("");

  const [modalReplanteoAbierto, setModalReplanteoAbierto] = useState(false);
  const [montoPropuesto, setMontoPropuesto] = useState<number>(0);
  const [motivoReplanteo, setMotivoReplanteo] = useState("");

  const [modalOrdenAbierto, setModalOrdenAbierto] = useState(false);
  const [itemsOrden, setItemsOrden] = useState<ItemOrdenInput[]>([]);
  const [fechaEntregaPactada, setFechaEntregaPactada] = useState<string>("");
  const [condicionesOrden, setCondicionesOrden] = useState<string>("");

  const [modalRechazarAbierto, setModalRechazarAbierto] = useState(false);
  const [tipoDecision, setTipoDecision] = useState<"RECHAZADA" | "POSPUESTA">("RECHAZADA");
  const [motivoDecision, setMotivoDecision] = useState("");

  // Determinar cotización seleccionada si existe
  const cotizacionSeleccionada = cotizaciones.find((c) => c.estado === "SELECCIONADA");

  // Ordenar cotizaciones por menor precio para comparativo (RF-ADQ-06)
  const cotizacionesOrdenadas = [...cotizaciones].sort(
    (a, b) => Number(a.monto_total) - Number(b.monto_total)
  );
  const menorMonto = cotizacionesOrdenadas[0]?.monto_total;

  // Abrir modal de nueva cotización prellenando ítems si viene de reposición
  const abrirModalNuevaCotizacion = () => {
    if (adquisicion.tipo === "BIEN" && itemsSolicitudRef.length > 0) {
      setItemsCotizacion(
        itemsSolicitudRef.map((it) => ({
          id_producto: it.id_producto,
          descripcion: it.producto?.nombre || "Producto",
          cantidad: it.cantidad_solicitada,
          precio_unitario: 0,
        }))
      );
    } else {
      setItemsCotizacion([
        {
          id_producto: null,
          descripcion: adquisicion.descripcion,
          cantidad: 1,
          precio_unitario: 0,
        },
      ]);
    }
    formCot.resetFields();
    setModalCotizacionAbierto(true);
  };

  const agregarFilaItemCot = () => {
    setItemsCotizacion((prev) => [
      ...prev,
      { id_producto: null, descripcion: "", cantidad: 1, precio_unitario: 0 },
    ]);
  };

  const actualizarFilaItemCot = (
    index: number,
    campo: keyof ItemCotizacionInput,
    valor: any
  ) => {
    setItemsCotizacion((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      // Si cambia de producto, autocompletar descripción y sugerir precio
      if (campo === "id_producto" && valor) {
        const prod = productos.find((p) => p.id_producto === valor);
        if (prod) {
          copy[index].descripcion = prod.nombre;
          copy[index].precio_unitario = Number(prod.precio_venta * 0.75); // precio ref mayorista
        }
      }
      return copy;
    });
  };

  const eliminarFilaItemCot = (index: number) => {
    setItemsCotizacion((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCotizacionCalculado = itemsCotizacion.reduce(
    (acc, it) => acc + (it.cantidad || 0) * (it.precio_unitario || 0),
    0
  );

  const handleGuardarCotizacion = async (values: any) => {
    if (itemsCotizacion.length === 0) {
      message.error("Debe agregar al menos una línea a la cotización.");
      return;
    }

    setCargandoAccion(true);
    const res = await registrarCotizacionAction({
      id_adquisicion: adquisicion.id_adquisicion,
      id_proveedor: values.id_proveedor,
      nro_cotizacion_prov: values.nro_cotizacion_prov,
      fecha_cotizacion: values.fecha_cotizacion.format("YYYY-MM-DD"),
      fecha_validez: values.fecha_validez?.format("YYYY-MM-DD"),
      plazo_entrega_dias: values.plazo_entrega_dias,
      condiciones_pago: values.condiciones_pago,
      observacion: values.observacion,
      items: itemsCotizacion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar la cotización.");
      setCargandoAccion(false);
      return;
    }

    message.success("Cotización registrada exitosamente.");
    setModalCotizacionAbierto(false);
    setCargandoAccion(false);
    router.refresh();
  };

  const handleConfirmarSeleccion = async () => {
    if (!cotizacionASeleccionar) return;
    if (!motivoSeleccion.trim()) {
      message.error("El motivo de la selección es obligatorio.");
      return;
    }

    setCargandoAccion(true);
    const res = await seleccionarCotizacionAction({
      id_adquisicion: adquisicion.id_adquisicion,
      id_cotizacion: cotizacionASeleccionar,
      motivo: motivoSeleccion,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo seleccionar la cotización.");
      setCargandoAccion(false);
      return;
    }

    message.success("Cotización seleccionada como ganadora.");
    setModalSeleccionarAbierto(false);
    setMotivoSeleccion("");
    setCargandoAccion(false);
    router.refresh();
  };

  const handleSolicitarVerificacion = async () => {
    setCargandoAccion(true);
    const res = await solicitarVerificacionAction(adquisicion.id_adquisicion);
    if (!res.ok) {
      message.error(res.error || "No se pudo solicitar la verificación.");
      setCargandoAccion(false);
      return;
    }
    message.success(
      "Verificación presupuestal solicitada a Administración y Finanzas (estado: EN_VERIFICACION)."
    );
    setCargandoAccion(false);
    router.refresh();
  };

  const handleConfirmarReplanteo = async () => {
    if (!montoPropuesto || montoPropuesto <= 0) {
      message.error("Ingrese un monto propuesto válido mayor a cero.");
      return;
    }
    if (!motivoReplanteo.trim()) {
      message.error("El motivo del replanteamiento es obligatorio.");
      return;
    }

    setCargandoAccion(true);
    const res = await registrarReplanteamientoAction({
      id_adquisicion: adquisicion.id_adquisicion,
      monto_propuesto: montoPropuesto,
      motivo: motivoReplanteo,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar el replanteamiento.");
      setCargandoAccion(false);
      return;
    }

    message.success("Replanteamiento registrado exitosamente (estado: REPLANTEADA).");
    setModalReplanteoAbierto(false);
    setCargandoAccion(false);
    router.refresh();
  };

  const abrirModalEmitirOrden = () => {
    if (!cotizacionSeleccionada) return;
    // Cargar ítems de la cotización seleccionada para permitir ajustar cantidades (Decisión #2 - Opción A)
    const itemsPre: ItemOrdenInput[] = (
      cotizacionSeleccionada.detalle_cotizacion || []
    ).map((d: any) => ({
      id_producto: d.id_producto,
      descripcion: d.descripcion,
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
    }));

    setItemsOrden(itemsPre);
    setCondicionesOrden(cotizacionSeleccionada.condiciones_pago || "Crédito 30 días");
    setModalOrdenAbierto(true);
  };

  const totalOrdenCalculado = itemsOrden.reduce(
    (acc, it) => acc + (it.cantidad || 0) * (it.precio_unitario || 0),
    0
  );

  const handleConfirmarOrden = async () => {
    if (totalOrdenCalculado > adquisicion.monto_estimado) {
      message.error(
        `El total de la orden (${formatearMoneda(
          totalOrdenCalculado
        )}) no puede superar el monto autorizado (${formatearMoneda(
          adquisicion.monto_estimado
        )}).`
      );
      return;
    }

    setCargandoAccion(true);
    const res = await emitirOrdenAction({
      id_adquisicion: adquisicion.id_adquisicion,
      fecha_entrega_pactada: fechaEntregaPactada || undefined,
      condiciones: condicionesOrden,
      items: itemsOrden,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo emitir la orden.");
      setCargandoAccion(false);
      return;
    }

    message.success(`Orden ${res.nro_orden} emitida exitosamente.`);
    setModalOrdenAbierto(false);
    setCargandoAccion(false);
    router.refresh();
  };

  const handleConfirmarRechazoOPosponer = async () => {
    if (!motivoDecision.trim()) {
      message.error("El motivo de la decisión es obligatorio.");
      return;
    }

    setCargandoAccion(true);
    const res = await decidirAdquisicionAction({
      id_adquisicion: adquisicion.id_adquisicion,
      decision: tipoDecision,
      motivo: motivoDecision,
    });

    if (!res.ok) {
      message.error(res.error || "No se pudo registrar la decisión.");
      setCargandoAccion(false);
      return;
    }

    message.success(`Adquisición marcada como ${tipoDecision}.`);
    setModalRechazarAbierto(false);
    setCargandoAccion(false);
    router.refresh();
  };

  return (
    <div>
      <EncabezadoPagina
        titulo={`Requerimiento: ${adquisicion.nro_adquisicion}`}
        subtitulo={adquisicion.descripcion}
        extra={
          <Space wrap>
            <Link href="/adquisiciones/requerimientos">
              <Button>← Volver a Requerimientos</Button>
            </Link>

            {/* Acciones contextuales según el estado del requerimiento */}
            {permisos.puedeCotizar &&
              ["EN_COTIZACION", "REPLANTEADA", "SIN_DISPONIBILIDAD"].includes(
                adquisicion.estado
              ) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={abrirModalNuevaCotizacion}
                >
                  Registrar Cotización
                </Button>
              )}

            {permisos.puedeCotizar &&
              cotizacionSeleccionada &&
              ["EN_COTIZACION", "REPLANTEADA"].includes(adquisicion.estado) && (
                <Button
                  type="primary"
                  style={{ backgroundColor: COLORES_ERP.azulInfo }}
                  icon={<DollarOutlined />}
                  loading={cargandoAccion}
                  onClick={handleSolicitarVerificacion}
                >
                  Solicitar Verificación Presupuestal
                </Button>
              )}

            {permisos.puedeDecidir && adquisicion.estado === "SIN_DISPONIBILIDAD" && (
              <Button
                type="primary"
                style={{ backgroundColor: COLORES_ERP.ambarAdvertencia }}
                icon={<SwapOutlined />}
                onClick={() => {
                  setMontoPropuesto(adquisicion.monto_estimado);
                  setModalReplanteoAbierto(true);
                }}
              >
                Registrar Replanteamiento (RF-ADQ-17)
              </Button>
            )}

            {permisos.puedeEmitirOrden &&
              ["AUTORIZADA", "CON_ORDEN"].includes(adquisicion.estado) && (
                <Button
                  type="primary"
                  style={{ backgroundColor: COLORES_ERP.verdeAcento }}
                  icon={<CheckCircleOutlined />}
                  onClick={abrirModalEmitirOrden}
                >
                  Emitir Orden ({adquisicion.tipo === "BIEN" ? "Compra" : "Servicio"})
                </Button>
              )}

            {permisos.puedeDecidir &&
              !["CON_ORDEN", "FINALIZADA", "RECHAZADA", "POSPUESTA"].includes(
                adquisicion.estado
              ) && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    setTipoDecision("RECHAZADA");
                    setModalRechazarAbierto(true);
                  }}
                >
                  Rechazar / Posponer
                </Button>
              )}
          </Space>
        }
      />

      {/* Tarjeta de Datos Generales del Requerimiento */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} lg={5}>
            <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>Estado Actual:</span>
            <div style={{ marginTop: 4 }}>
              <EtiquetaEstado estado={adquisicion.estado} />
            </div>
          </Col>
          <Col xs={24} sm={8} lg={4}>
            <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>Tipo:</span>
            <div style={{ marginTop: 4 }}>
              <EtiquetaEstado estado={adquisicion.tipo} />
            </div>
          </Col>
          <Col xs={24} sm={8} lg={5}>
            <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
              Monto Estimado / Autorizado:
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: COLORES_ERP.azulProfundo,
                marginTop: 2,
                display: "inline-block",
              }}
            >
              {adquisicion.monto_estimado > 0
                ? formatearMoneda(adquisicion.monto_estimado)
                : "Por cotizar"}
            </span>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
              Solicitud de Reposición:
            </span>
            <span style={{ fontWeight: 600 }}>
              {adquisicion.nro_solicitud ? (
                <Tag color="orange">{adquisicion.nro_solicitud}</Tag>
              ) : (
                "Requerimiento directo"
              )}
            </span>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>Registrado por:</span>
            <span style={{ fontWeight: 600 }}>{adquisicion.registrado_por}</span>
          </Col>
        </Row>
      </Card>

      {/* Cuadro Comparativo de Cotizaciones (RF-ADQ-04, 05, 06) */}
      <Card
        title={
          <Space>
            <AuditOutlined style={{ color: COLORES_ERP.azulProfundo }} />
            <span>Comparativo de Cotizaciones ({cotizaciones.length} registradas)</span>
          </Space>
        }
        style={{ marginBottom: 20 }}
      >
        {cotizaciones.length === 0 ? (
          <Alert
            type="info"
            message="No hay cotizaciones registradas para este requerimiento"
            description="Utilice el botón 'Registrar Cotización' en la barra superior para agregar cotizaciones de proveedores."
          />
        ) : (
          <Table
            rowKey="id_cotizacion"
            dataSource={cotizaciones}
            pagination={false}
            columns={[
              {
                title: "Proveedor",
                key: "proveedor",
                render: (_: unknown, c: any) => {
                  const prov = Array.isArray(c.proveedor) ? c.proveedor[0] : c.proveedor;
                  const esMenor = Number(c.monto_total) === Number(menorMonto);
                  return (
                    <div>
                      <div style={{ fontWeight: 700, color: COLORES_ERP.azulProfundo }}>
                        {prov?.razon_social}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        RUC: {prov?.ruc} {c.nro_cotizacion_prov ? `| N° ${c.nro_cotizacion_prov}` : ""}
                      </div>
                      {esMenor && cotizaciones.length > 1 && (
                        <Tag color="gold" style={{ marginTop: 4, fontWeight: 700 }}>
                          ★ MENOR PRECIO OFERTADO (RF-ADQ-06)
                        </Tag>
                      )}
                    </div>
                  );
                },
              },
              {
                title: "Fecha Cot.",
                dataIndex: "fecha_cotizacion",
                key: "fecha",
                width: 120,
                render: (f: string) => formatearFecha(f),
              },
              {
                title: "Plazo Entrega",
                dataIndex: "plazo_entrega_dias",
                key: "plazo",
                width: 120,
                align: "center",
                render: (d: number | null) => (d ? `${d} días` : "—"),
              },
              {
                title: "Condiciones de Pago",
                dataIndex: "condiciones_pago",
                key: "cond",
                render: (c: string | null) => c || "—",
              },
              {
                title: "Monto Ofertado",
                dataIndex: "monto_total",
                key: "total",
                width: 140,
                align: "right",
                render: (t: number, c: any) => (
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color:
                        Number(t) === Number(menorMonto)
                          ? COLORES_ERP.verdeAcento
                          : COLORES_ERP.azulProfundo,
                    }}
                  >
                    {formatearMoneda(t)}
                  </span>
                ),
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
                title: "Decisión",
                key: "accion",
                width: 160,
                align: "center",
                render: (_: unknown, c: any) =>
                  c.estado === "SELECCIONADA" ? (
                    <Tag color="green" style={{ fontWeight: 700 }}>
                      ✓ GANADORA
                    </Tag>
                  ) : permisos.puedeDecidir &&
                    ["EN_COTIZACION", "REPLANTEADA"].includes(adquisicion.estado) ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setCotizacionASeleccionar(c.id_cotizacion);
                        setMotivoSeleccion(
                          Number(c.monto_total) === Number(menorMonto)
                            ? "Menor precio y mejores condiciones de entrega"
                            : "Mejores condiciones técnicas"
                        );
                        setModalSeleccionarAbierto(true);
                      }}
                    >
                      Seleccionar
                    </Button>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        )}
      </Card>

      {/* Tabs de Historial: Verificaciones Presupuestales, Órdenes y Decisiones */}
      <Tabs
        defaultActiveKey="verificaciones"
        items={[
          {
            key: "verificaciones",
            label: (
              <span>
                <DollarOutlined /> Verificaciones Presupuestales ({verificaciones.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_verificacion"
                  dataSource={verificaciones}
                  pagination={false}
                  locale={{ emptyText: "No se han solicitado verificaciones para este requerimiento." }}
                  columns={[
                    {
                      title: "N°",
                      dataIndex: "id_verificacion",
                      key: "id",
                      width: 60,
                    },
                    {
                      title: "Fecha Solicitud",
                      dataIndex: "fecha_solicitud",
                      key: "f_sol",
                      render: (f: string) => formatearFechaHora(f),
                    },
                    {
                      title: "Monto Solicitado",
                      dataIndex: "monto_solicitado",
                      key: "monto",
                      align: "right",
                      render: (m: number) => (
                        <b style={{ color: COLORES_ERP.azulProfundo }}>{formatearMoneda(m)}</b>
                      ),
                    },
                    {
                      title: "Saldo al Evaluar",
                      dataIndex: "disponible_al_evaluar",
                      key: "disp",
                      align: "right",
                      render: (d: number | null) => (d !== null ? formatearMoneda(d) : "—"),
                    },
                    {
                      title: "Disponibilidad",
                      dataIndex: "resultado",
                      key: "res",
                      align: "center",
                      render: (r: string) => <EtiquetaEstado estado={r} />,
                    },
                    {
                      title: "Decisión Finanzas",
                      dataIndex: "decision",
                      key: "dec",
                      align: "center",
                      render: (d: string | null) => (d ? <EtiquetaEstado estado={d} /> : "PENDIENTE"),
                    },
                    {
                      title: "Evaluador",
                      key: "eval",
                      render: (_: unknown, r: any) =>
                        r.usuario_evalua?.username || <span style={{ color: "#94a3b8" }}>—</span>,
                    },
                    {
                      title: "Observación",
                      dataIndex: "observacion",
                      key: "obs",
                      render: (o: string | null) => o || "—",
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "ordenes",
            label: (
              <span>
                <FileDoneOutlined /> Órdenes Emitidas ({ordenes.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_orden"
                  dataSource={ordenes}
                  pagination={false}
                  locale={{ emptyText: "Aún no se ha emitido ninguna orden para este requerimiento." }}
                  columns={[
                    {
                      title: "N° Orden",
                      dataIndex: "nro_orden",
                      key: "nro",
                      render: (nro: string, r: any) => (
                        <Link href="/adquisiciones/ordenes">
                          <Tag color="geekblue" style={{ fontWeight: 700 }}>
                            {nro}
                          </Tag>
                        </Link>
                      ),
                    },
                    { title: "Tipo", dataIndex: "tipo", key: "tipo" },
                    {
                      title: "Monto Total",
                      dataIndex: "monto_total",
                      key: "total",
                      align: "right",
                      render: (m: number) => <b>{formatearMoneda(m)}</b>,
                    },
                    {
                      title: "Estado",
                      dataIndex: "estado",
                      key: "estado",
                      align: "center",
                      render: (st: string) => <EtiquetaEstado estado={st} />,
                    },
                    {
                      title: "Fecha Emisión",
                      dataIndex: "fecha_emision",
                      key: "fecha",
                      render: (f: string) => formatearFechaHora(f),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "decisiones",
            label: (
              <span>
                <HistoryOutlined /> Historial de Decisiones ({decisiones.length})
              </span>
            ),
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table
                  rowKey="id_decision"
                  dataSource={decisiones}
                  pagination={false}
                  columns={[
                    {
                      title: "Fecha",
                      dataIndex: "fecha_decision",
                      key: "fecha",
                      width: 160,
                      render: (f: string) => formatearFechaHora(f),
                    },
                    {
                      title: "Unidad",
                      dataIndex: "unidad",
                      key: "unidad",
                      width: 140,
                      render: (u: string) => <Tag color="blue">{u}</Tag>,
                    },
                    {
                      title: "Decisión",
                      dataIndex: "decision",
                      key: "decision",
                      width: 170,
                      render: (d: string) => <EtiquetaEstado estado={d} />,
                    },
                    {
                      title: "Motivo / Justificación",
                      dataIndex: "motivo",
                      key: "motivo",
                    },
                    {
                      title: "Usuario",
                      key: "usuario",
                      width: 160,
                      render: (_: unknown, r: any) => r.usuario?.username || "—",
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal Registrar Cotización (RF-ADQ-04, 05) */}
      <Modal
        title="Registrar Cotización de Proveedor"
        open={modalCotizacionAbierto}
        onCancel={() => setModalCotizacionAbierto(false)}
        footer={null}
        width={760}
      >
        <Form
          form={formCot}
          layout="vertical"
          onFinish={handleGuardarCotizacion}
          initialValues={{
            fecha_cotizacion: null,
            plazo_entrega_dias: 7,
            condiciones_pago: "Crédito 30 días",
          }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="id_proveedor"
                label="Proveedor"
                rules={[{ required: true, message: "Seleccione un proveedor" }]}
              >
                <Select
                  placeholder="Seleccionar proveedor..."
                  options={proveedores.map((p) => ({
                    value: p.id_proveedor,
                    label: `${p.razon_social} (RUC: ${p.ruc})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="nro_cotizacion_prov" label="N° Cotización Proveedor">
                <Input placeholder="Ej. COT-TA-2026-01" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="fecha_cotizacion"
                label="Fecha de Cotización"
                rules={[{ required: true, message: "Seleccione la fecha" }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fecha_validez" label="Válida Hasta">
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="plazo_entrega_dias" label="Plazo Entrega (días)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="condiciones_pago" label="Condiciones de Pago">
            <Input placeholder="Ej. Contado / Crédito 15 días / Crédito 30 días" />
          </Form.Item>

          <Divider titlePlacement="start" style={{ margin: "12px 0 16px 0", fontSize: 13 }}>
            Ítems de la Cotización
          </Divider>

          <Table
            size="small"
            pagination={false}
            rowKey={(_, idx) => String(idx)}
            dataSource={itemsCotizacion}
            columns={[
              {
                title: "Producto / Descripción",
                key: "desc",
                render: (_: unknown, it: ItemCotizacionInput, idx: number) =>
                  adquisicion.tipo === "BIEN" ? (
                    <Select
                      showSearch
                      placeholder="Seleccionar producto..."
                      style={{ width: "100%" }}
                      value={it.id_producto}
                      onChange={(val) => actualizarFilaItemCot(idx, "id_producto", val)}
                      optionFilterProp="label"
                      options={productos.map((p) => ({
                        value: p.id_producto,
                        label: `[${p.codigo}] ${p.nombre}`,
                      }))}
                    />
                  ) : (
                    <Input
                      value={it.descripcion}
                      onChange={(e) =>
                        actualizarFilaItemCot(idx, "descripcion", e.target.value)
                      }
                      placeholder="Descripción del servicio..."
                    />
                  ),
              },
              {
                title: "Cant.",
                key: "cant",
                width: 90,
                render: (_: unknown, it: ItemCotizacionInput, idx: number) => (
                  <InputNumber
                    min={1}
                    value={it.cantidad}
                    onChange={(val) => actualizarFilaItemCot(idx, "cantidad", val || 1)}
                  />
                ),
              },
              {
                title: "Precio Unit. (S/)",
                key: "pu",
                width: 130,
                render: (_: unknown, it: ItemCotizacionInput, idx: number) => (
                  <InputNumber
                    min={0}
                    step={1}
                    precision={2}
                    value={it.precio_unitario}
                    onChange={(val) =>
                      actualizarFilaItemCot(idx, "precio_unitario", val || 0)
                    }
                  />
                ),
              },
              {
                title: "Subtotal",
                key: "sub",
                width: 110,
                align: "right",
                render: (_: unknown, it: ItemCotizacionInput) => (
                  <b>{formatearMoneda((it.cantidad || 0) * (it.precio_unitario || 0))}</b>
                ),
              },
              {
                title: "",
                key: "del",
                width: 45,
                render: (_: unknown, __: unknown, idx: number) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => eliminarFilaItemCot(idx)}
                  />
                ),
              },
            ]}
          />

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={agregarFilaItemCot}
            style={{ marginTop: 8 }}
          >
            Agregar Línea
          </Button>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 14,
              fontSize: 15,
            }}
          >
            <span>Total Cotización: </span>
            <b style={{ color: COLORES_ERP.verdeAcento, marginLeft: 8 }}>
              {formatearMoneda(totalCotizacionCalculado)}
            </b>
          </div>

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalCotizacionAbierto(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={cargandoAccion}>
                Guardar Cotización
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal Seleccionar Cotización Ganadora */}
      <Modal
        title="Seleccionar Cotización Ganadora"
        open={modalSeleccionarAbierto}
        onCancel={() => setModalSeleccionarAbierto(false)}
        footer={null}
        width={480}
      >
        <p style={{ color: "#475569", marginTop: 8 }}>
          Al seleccionar esta cotización, las demás quedarán descartadas y el monto de la
          adquisición se actualizará para la verificación presupuestal (RF-ADQ-06, 07).
        </p>
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Motivo / Criterio de Selección:
          </span>
          <Input.TextArea
            rows={3}
            value={motivoSeleccion}
            onChange={(e) => setMotivoSeleccion(e.target.value)}
            placeholder="Ej. Menor monto total ofertado y mejores condiciones de pago..."
          />
        </div>
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Space>
            <Button onClick={() => setModalSeleccionarAbierto(false)}>Cancelar</Button>
            <Button
              type="primary"
              loading={cargandoAccion}
              onClick={handleConfirmarSeleccion}
            >
              Confirmar Selección
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Modal Replanteamiento (RF-ADQ-17, Opción A aprobada) */}
      <Modal
        title={
          <Space>
            <SwapOutlined style={{ color: COLORES_ERP.ambarAdvertencia }} />
            <span>Registrar Replanteamiento de Adquisición (RF-ADQ-17)</span>
          </Space>
        }
        open={modalReplanteoAbierto}
        onCancel={() => setModalReplanteoAbierto(false)}
        footer={null}
        width={500}
      >
        <p style={{ color: "#475569", marginTop: 8 }}>
          Administración y Finanzas determinó que no hay disponibilidad para el monto anterior (
          {formatearMoneda(adquisicion.monto_estimado)}). Ingrese el monto ajustado y el motivo
          del replanteamiento.
        </p>

        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Nuevo Monto Propuesto (S/):
          </span>
          <InputNumber
            min={1}
            step={100}
            precision={2}
            style={{ width: "100%" }}
            value={montoPropuesto}
            onChange={(val) => setMontoPropuesto(val || 0)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Motivo del Replanteamiento:
          </span>
          <Input.TextArea
            rows={3}
            value={motivoReplanteo}
            onChange={(e) => setMotivoReplanteo(e.target.value)}
            placeholder="Ej. Se reduce la cantidad de smartphones de 20 a 17 unidades para ajustarse al saldo disponible..."
          />
        </div>

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Space>
            <Button onClick={() => setModalReplanteoAbierto(false)}>Cancelar</Button>
            <Button
              type="primary"
              loading={cargandoAccion}
              onClick={handleConfirmarReplanteo}
            >
              Guardar Replanteamiento
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Modal Emitir Orden (RF-ADQ-10 a 13) */}
      <Modal
        title={`Emitir Orden de ${adquisicion.tipo === "BIEN" ? "Compra" : "Servicio"}`}
        open={modalOrdenAbierto}
        onCancel={() => setModalOrdenAbierto(false)}
        footer={null}
        width={700}
      >
        <p style={{ color: "#475569", marginTop: 8 }}>
          Revise los productos, cantidades y condiciones pactadas con el proveedor antes de
          emitir la orden oficial:
        </p>

        <Table
          size="small"
          pagination={false}
          rowKey={(_, idx) => String(idx)}
          dataSource={itemsOrden}
          columns={[
            { title: "Descripción", dataIndex: "descripcion", key: "desc" },
            {
              title: "Cant.",
              key: "cant",
              width: 100,
              render: (_: unknown, it: ItemOrdenInput, idx: number) => (
                <InputNumber
                  min={1}
                  value={it.cantidad}
                  onChange={(val) => {
                    const copy = [...itemsOrden];
                    copy[idx] = { ...copy[idx], cantidad: val || 1 };
                    setItemsOrden(copy);
                  }}
                />
              ),
            },
            {
              title: "P. Unitario",
              dataIndex: "precio_unitario",
              key: "pu",
              width: 120,
              align: "right",
              render: (p: number) => formatearMoneda(p),
            },
            {
              title: "Subtotal",
              key: "sub",
              width: 120,
              align: "right",
              render: (_: unknown, it: ItemOrdenInput) => (
                <b>{formatearMoneda((it.cantidad || 0) * (it.precio_unitario || 0))}</b>
              ),
            },
          ]}
        />

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Fecha de Entrega Pactada:
            </span>
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              onChange={(_, str) => setFechaEntregaPactada(String(str))}
            />
          </Col>
          <Col span={12}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Condiciones de la Orden:
            </span>
            <Input
              value={condicionesOrden}
              onChange={(e) => setCondicionesOrden(e.target.value)}
              placeholder="Crédito 30 días, entrega en almacén central..."
            />
          </Col>
        </Row>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
            padding: "10px 14px",
            background: "#f8fafc",
            borderRadius: 6,
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Monto Autorizado:</span>{" "}
            <b>{formatearMoneda(adquisicion.monto_estimado)}</b>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Total de la Orden:</span>{" "}
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color:
                  totalOrdenCalculado <= adquisicion.monto_estimado
                    ? COLORES_ERP.verdeAcento
                    : COLORES_ERP.rojoError,
              }}
            >
              {formatearMoneda(totalOrdenCalculado)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Space>
            <Button onClick={() => setModalOrdenAbierto(false)}>Cancelar</Button>
            <Button
              type="primary"
              loading={cargandoAccion}
              disabled={totalOrdenCalculado > adquisicion.monto_estimado}
              onClick={handleConfirmarOrden}
            >
              Emitir Orden Oficial
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Modal Rechazar / Posponer */}
      <Modal
        title="Rechazar o Posponer Adquisición (RF-ADQ-18)"
        open={modalRechazarAbierto}
        onCancel={() => setModalRechazarAbierto(false)}
        footer={null}
        width={480}
      >
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Acción:
          </span>
          <Select
            style={{ width: "100%" }}
            value={tipoDecision}
            onChange={(val) => setTipoDecision(val)}
            options={[
              { value: "RECHAZADA", label: "RECHAZAR Adquisición" },
              { value: "POSPUESTA", label: "POSPONER Adquisición" },
            ]}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Motivo / Justificación:
          </span>
          <Input.TextArea
            rows={3}
            value={motivoDecision}
            onChange={(e) => setMotivoDecision(e.target.value)}
            placeholder="Ingrese el motivo de la decisión..."
          />
        </div>
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Space>
            <Button onClick={() => setModalRechazarAbierto(false)}>Cancelar</Button>
            <Button
              danger
              loading={cargandoAccion}
              onClick={handleConfirmarRechazoOPosponer}
            >
              Confirmar Decisión
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
