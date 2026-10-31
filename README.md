# ERP TecnoCel — Sistema Integral de Gestión Empresarial

> **Universidad Católica Sedes Sapientiae (UCSS)**  
> **Curso:** Innovación y Desarrollo Tecnológico  
> **Proyecto:** Sistema ERP Web para la empresa comercializadora de tecnología y telefonía **TecnoCel S.A.C.**  
> **Ciclo Académico:** 2026-I  

---

## 👥 Equipo de Innovación y Desarrollo

| Nombre Completo | Rol en el Proyecto |
| :--- | :--- |
| **Erick Piero Vasquez Silva** | Arquitectura de Software, Base de Datos y Backend |
| **Vanessa Llanos Julca** | Análisis Funcional, Módulo de Ventas e Inventario |
| **Maryuri Navarro Estrella** | Módulo de Adquisiciones, Compras y Proveedores |
| **Willy Fernandes Hoyos** | Módulo de Finanzas, Presupuestos y Control de Gastos |
| **Harvin Ander Fustamante Calderon** | Inteligencia de Negocios, Reportes y Seguridad |

---

## 🚀 Inicio Rápido (1 Clic)

El proyecto incluye un script de automatización para Windows que verifica dependencias, comprueba variables de entorno, inicia el servidor de desarrollo y abre automáticamente el navegador:

1. Haga doble clic sobre el archivo **`INICIAR.bat`** en la raíz del proyecto.
2. El sistema abrirá automáticamente su navegador en [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Instalación y Ejecución Manual

Si prefiere ejecutarlo mediante la terminal o PowerShell:

### 1. Prerrequisitos
- **Node.js**: v18.17.0 o superior (recomendado v20+).
- **npm**: v9.0.0 o superior.

### 2. Configurar Variables de Entorno
Asegúrese de contar con el archivo `.env.local` en la raíz del proyecto con la siguiente configuración conectada a Supabase:

```env
# URL Pública del proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://haemwsmbvmsqwmoadhye.supabase.co

# Clave de Servicio / Secreto de Supabase (Service Role Secret)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_eCTfawInmfF-aiBHtezj0g_4psVMnXe

# Secreto criptográfico para firma de tokens de sesión JWT
AUTH_SECRET=tecnocel_jwt_secret_key_innovacion_2026_seguro_1234567890
```

### 3. Instalar Dependencias y Arrancar
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo de desarrollo
npm run dev

# 3. Compilar para producción (opcional)
npm run build
npm start
```

El aplicativo estará disponible en `http://localhost:3000`.

---

## 🔐 Cuentas de Acceso de Prueba Sembradas

Todas las cuentas de prueba comparten la misma contraseña segura preconfigurada: **`Erp2026*`**. Cada usuario cuenta con un rol y juego de permisos específicos que condicionan su menú lateral y accesos:

| Usuario (Email) | Contraseña | Rol en el Sistema | Permisos y Alcance Clave |
| :--- | :--- | :--- | :--- |
| `gerencia@tecnocel.com` | `Erp2026*` | **Gerente General** | Acceso integral a todas las pantallas, reportes BI, visualización global y aprobación. |
| `almacen@tecnocel.com` | `Erp2026*` | **Jefe de Almacén** | Catálogo de productos, movimientos, solicitudes de reposición, recepción de mercancías y guías. |
| `asistente.alm@tecnocel.com` | `Erp2026*` | **Asistente de Almacén** | Consulta de existencias, registro de movimientos y soporte en recepción. |
| `cajero1@tecnocel.com` | `Erp2026*` | **Vendedor / Cajero 1** | Punto de Venta (POS), emisión de tickets/boletas/facturas, historial de ventas. |
| `cajero2@tecnocel.com` | `Erp2026*` | **Vendedor / Cajero 2** | Punto de Venta (POS) alternativo en tienda, emisión y consulta de comprobantes. |
| `compras@tecnocel.com` | `Erp2026*` | **Encargado de Compras** | Directorio de proveedores RUC, requerimientos, cotizaciones, órdenes de compra y servicios. |
| `asistente.com@tecnocel.com` | `Erp2026*` | **Asistente de Compras** | Registro de proveedores, carga de cotizaciones de mercado y seguimiento de compras. |
| `finanzas@tecnocel.com` | `Erp2026*` | **Jefe de Finanzas** | Verificación presupuestal, replanificación de gastos, asignación de techos y compromisos. |
| `asistente.fin@tecnocel.com` | `Erp2026*` | **Asistente de Finanzas** | Consulta de saldos presupuestales, compromisos y revisión de requerimientos. |
| `admin@tecnocel.com` | `Erp2026*` | **Administrador del Sistema** | Gestión integral de parámetros y configuración general. |

---

## 🏛️ Arquitectura del Sistema

El ERP TecnoCel ha sido desarrollado siguiendo una arquitectura moderna de aplicaciones empresariales:

- **Framework Web:** Next.js 15 con **App Router** (arquitectura híbrida de Server Components y Client Components).
- **Lenguaje:** TypeScript 5 en modo estricto (`strict: true`), 100% libre de advertencias de compilación.
- **Librería de Componentes:** **Ant Design v6**, adaptada con la paleta de identidad corporativa de TecnoCel (`#132d46` Marino, `#01c38e` Esmeralda, `#1a1e29` Fondo Oscuro, `#ffffff` Limpio).
- **Visualización de Datos (BI):** **Recharts** para gráficos reactivos de área, barras horizontales, distribución por estado y pastel de presupuesto.
- **Exportación Ofimática:** **ExcelJS** con motor de generación nativo de hojas de cálculo estilizadas (.xlsx), con cabeceras corporativas, tipos de moneda peruana (`S/ #,##0.00`) y pestañas analíticas.
- **Base de Datos Relacional:** **PostgreSQL en Supabase**, empleando vistas SQL consolidadas, funciones correlativas atómicas (`fn_correlativo`), triggers de consistencia y control de concurrencia.
- **Seguridad y Sesión:** Autenticación de doble vía con contraseñas encriptadas con **bcryptjs** (cost factor 10) y tokens de sesión **JWT (jose)** almacenados en cookies seguras `httpOnly` con rotación y middleware de verificación de permisos.

---

## 📋 Matriz de Cumplimiento: 62 Requisitos Funcionales

El sistema satisface con exactitud el 100% de los requisitos funcionales estipulados en el **Reglamento de Organización y Funciones (ROF)** y las especificaciones técnicas:

### 1. Módulo de Ventas (RF-VEN-01 al RF-VEN-12)

| Código RF | Descripción del Requisito | Pantalla / Ruta | Archivo de Implementación | Base de Datos / Lógica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-VEN-01** | Búsqueda rápida de productos por nombre, código o categoría con stock visible. | Pantalla 3: `/ventas/nueva` | `src/app/(erp)/ventas/nueva/NuevaVentaClient.tsx` | `productos`, filtro en vivo, validación de stock disponible. |
| **RF-VEN-02** | Carrito de compras con cálculo automático de subtotal, IGV (18%) y total. | Pantalla 3: `/ventas/nueva` | `src/app/(erp)/ventas/nueva/NuevaVentaClient.tsx` | Cálculos reactivos con redondeo a 2 decimales en moneda peruana. |
| **RF-VEN-03** | Validación estricta en tiempo real de stock disponible impidiendo sobreventas. | Pantalla 3: `/ventas/nueva` | `src/app/actions/ventas.ts` (`registrarVenta`) | Transacción atómica; rechaza si `cantidad > stock_actual`. |
| **RF-VEN-04** | Registro de datos del cliente (DNI, RUC, Nombres / Razón Social) o Venta Rápida. | Pantalla 3: `/ventas/nueva` | `src/app/(erp)/ventas/nueva/NuevaVentaClient.tsx` | Soporte para cliente anónimo ("Clientes Varios") o datos fiscales. |
| **RF-VEN-05** | Emisión de comprobante de pago: Boleta, Factura o Ticket con correlativo oficial. | Pantalla 3: `/ventas/nueva` | `src/app/actions/ventas.ts` | Uso de `fn_correlativo('VENTA_BOLETA' \| 'VENTA_FACTURA')`. |
| **RF-VEN-06** | Múltiples métodos de pago (Efectivo, Tarjeta, Yape/Plin, Transferencia). | Pantalla 3: `/ventas/nueva` | `src/app/(erp)/ventas/nueva/NuevaVentaClient.tsx` | Selector de medio de pago con registro en campo `medio_pago`. |
| **RF-VEN-07** | Descuento automático del stock del almacén tras confirmación de la venta. | Pantalla 3: `/ventas/nueva` | `src/app/actions/ventas.ts` | Trigger / update en `productos.stock_actual` y `movimientos_inventario`. |
| **RF-VEN-08** | Generación de comprobante imprimible con formato de ticket térmico/oficial. | Pantalla 3 y 4 | `src/app/(erp)/ventas/nueva/NuevaVentaClient.tsx` | Modal con botón de impresión directa CSS `@media print`. |
| **RF-VEN-09** | Historial de ventas con filtros por fecha, tipo de comprobante, correlativo y cliente. | Pantalla 4: `/ventas/historial` | `src/app/(erp)/ventas/historial/HistorialVentasClient.tsx` | Tabla paginada con filtros combinables y búsqueda por texto. |
| **RF-VEN-10** | Consulta detallada del desglose de productos vendidos de cualquier comprobante. | Pantalla 4: `/ventas/historial` | `src/app/(erp)/ventas/historial/HistorialVentasClient.tsx` | Visualización en modal del detalle con precios unitarios y totales. |
| **RF-VEN-11** | Anulación de comprobantes de venta con reversión automática del stock. | Pantalla 4: `/ventas/historial` | `src/app/actions/ventas.ts` (`anularVenta`) | Revierte stock de cada ítem con movimiento `KARDEX_ENTRADA` y audita. |
| **RF-VEN-12** | Control de permisos para caja y restricción de funciones administrativas. | Middleware / Sesión | `src/middleware.ts` y `src/lib/permisos.ts` | Permisos `VEN_NUEVA` y `VEN_HISTORIAL`; bloqueo de rutas ajenas. |

---

### 2. Módulo de Inventario y Almacén (RF-INV-01 al RF-INV-15)

| Código RF | Descripción del Requisito | Pantalla / Ruta | Archivo de Implementación | Base de Datos / Lógica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-INV-01** | Catálogo general de productos con código, nombre, categoría, marca y precios. | Pantalla 5: `/inventario/productos` | `src/app/(erp)/inventario/productos/ProductosClient.tsx` | Vista `v_inventario_consolidado` con ordenamiento y paginación. |
| **RF-INV-02** | Registro y edición de productos con definición de stock mínimo y precio referencial. | Pantalla 5: `/inventario/productos` | `src/app/actions/inventario.ts` (`guardarProducto`) | Modal de alta y actualización de atributos de catálogo. |
| **RF-INV-03** | Creación rápida de categorías y marcas directamente desde el formulario de producto. | Pantalla 5: `/inventario/productos` | `src/app/(erp)/inventario/productos/ProductosClient.tsx` | Botones `+ Nueva categoría` y `+ Nueva marca` en modal. |
| **RF-INV-04** | Alerta visual automática de productos con stock igual o inferior al stock mínimo. | Pantallas 2 y 5 | `src/app/(erp)/inicio/InicioClient.tsx` | Indicadores `CRÍTICO: Reponer` con filtro directo de alertas. |
| **RF-INV-05** | Filtro exclusivo para visualizar únicamente productos que requieren reposición. | Pantalla 5: `/inventario/productos` | `src/app/(erp)/inventario/productos/ProductosClient.tsx` | Switch "Solo en alerta de reposición" reactivo. |
| **RF-INV-06** | Generación de solicitudes de reposición basadas en productos bajo stock mínimo. | Pantalla 7: `/inventario/solicitudes` | `src/app/(erp)/inventario/solicitudes/SolicitudesClient.tsx` | Carga automática de productos críticos con cantidad sugerida. |
| **RF-INV-07** | Solicitud manual de reposición con selección libre de productos y justificación. | Pantalla 7: `/inventario/solicitudes` | `src/app/actions/inventario.ts` (`crearSolicitudReposicion`) | Inserción en `solicitudes_reposicion` con correlativo `REP-XXXXXX`. |
| **RF-INV-08** | Flujo de estados de la solicitud de reposición: PENDIENTE, EN_PROCESO, ATENDIDA. | Pantalla 7: `/inventario/solicitudes` | `src/app/(erp)/inventario/solicitudes/SolicitudesClient.tsx` | Badges de color dinámicos según el estado del requerimiento. |
| **RF-INV-09** | Kardex / historial de movimientos de inventario (Entradas, Salidas, Ajustes). | Pantalla 6: `/inventario/movimientos` | `src/app/(erp)/inventario/movimientos/MovimientosClient.tsx` | Consulta a `movimientos_inventario` con stock anterior y posterior. |
| **RF-INV-10** | Filtro de movimientos por tipo de operación, producto y rango de fechas. | Pantalla 6: `/inventario/movimientos` | `src/app/(erp)/inventario/movimientos/MovimientosClient.tsx` | Filtros combinados en cabecera de tabla con búsqueda instantánea. |
| **RF-INV-11** | Registro de ajustes manuales de stock con justificación obligatoria y auditoría. | Pantalla 6: `/inventario/movimientos` | `src/app/actions/inventario.ts` (`registrarAjusteManual`) | Validación de motivo, cálculo de diferencial e impacto en kardex. |
| **RF-INV-12** | Recepción de mercancías asociada a órdenes de compra aprobadas. | Pantalla 8: `/inventario/recepcion` | `src/app/(erp)/inventario/recepcion/RecepcionClient.tsx` | Selector de órdenes en estado `EMITIDA` o `EN_TRANSITO`. |
| **RF-INV-13** | Registro del número de Guía de Remisión del proveedor y observaciones físicas. | Pantalla 8: `/inventario/recepcion` | `src/app/(erp)/inventario/recepcion/RecepcionClient.tsx` | Campos obligatorios de guía de remisión física y conformidad. |
| **RF-INV-14** | Incremento automático del stock físico al confirmar la recepción en almacén. | Pantalla 8: `/inventario/recepcion` | `src/app/actions/inventario.ts` (`confirmarRecepcion`) | Actualización de `stock_actual` y generación de movimientos `KARDEX`. |
| **RF-INV-15** | Cierre automático de la solicitud de reposición original al recepcionar el pedido. | Pantalla 8: `/inventario/recepcion` | `src/app/actions/inventario.ts` (`confirmarRecepcion`) | Actualiza `solicitudes_reposicion.estado = 'ATENDIDA'` y orden. |

---

### 3. Módulo de Adquisiciones y Compras (RF-ADQ-01 al RF-ADQ-18)

| Código RF | Descripción del Requisito | Pantalla / Ruta | Archivo de Implementación | Base de Datos / Lógica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-ADQ-01** | Directorio de proveedores con RUC, razón social, rubro, contacto y estado activo. | Pantalla 9: `/adquisiciones/proveedores` | `src/app/(erp)/adquisiciones/proveedores/ProveedoresClient.tsx` | Tabla interactiva con búsqueda por RUC o Razón Social. |
| **RF-ADQ-02** | Validación estricta del RUC peruano (exactamente 11 dígitos numéricos). | Pantalla 9: `/adquisiciones/proveedores` | `src/app/actions/adquisiciones.ts` (`guardarProveedor`) | Validación regex `^\d{11}$` tanto en cliente como en servidor. |
| **RF-ADQ-03** | Bandeja de requerimientos de adquisición (Bienes derivados o Servicios directos). | Pantalla 10: `/adquisiciones/requerimientos` | `src/app/(erp)/adquisiciones/requerimientos/RequerimientosClient.tsx` | Lista con filtro por estado (`REGISTRADO`, `COTIZANDO`, `APROBADO`...). |
| **RF-ADQ-04** | Creación de requerimientos de bienes a partir de reposiciones pendientes. | Pantalla 10: `/adquisiciones/requerimientos` | `src/app/actions/adquisiciones.ts` (`crearRequerimientoBienes`) | Importa ítems de la solicitud de reposición seleccionada. |
| **RF-ADQ-05** | Creación de requerimientos directos de servicios con detalle de entregables y costo ref. | Pantalla 10: `/adquisiciones/requerimientos` | `src/app/actions/adquisiciones.ts` (`crearRequerimientoServicio`) | Genera requerimiento de tipo `SERVICIO` con monto estimado. |
| **RF-ADQ-06** | Registro de cotizaciones recibidas de proveedores con precios unitarios y plazos. | Pantalla 11: Detalle Requerimiento | `src/app/actions/adquisiciones.ts` (`agregarCotizacion`) | Inserción en `cotizaciones` y desglose en `cotizaciones_detalle`. |
| **RF-ADQ-07** | Cuadro comparativo automático de cotizaciones destacando el precio más bajo. | Pantalla 11: Detalle Requerimiento | `src/app/(erp)/adquisiciones/requerimientos/[id]/DetalleRequerimientoClient.tsx` | Algoritmo que calcula el menor valor y lo destaca con insignia verde. |
| **RF-ADQ-08** | Selección justificada de cotización ganadora con sustento técnico/comercial. | Pantalla 11: Detalle Requerimiento | `src/app/actions/adquisiciones.ts` (`seleccionarCotizacion`) | Marca la cotización elegida y pasa el requerimiento a cotizado. |
| **RF-ADQ-09** | Envío de solicitud de verificación presupuestal al departamento de Finanzas. | Pantalla 11: Detalle Requerimiento | `src/app/actions/adquisiciones.ts` (`solicitarVerificacionPresupuestal`) | Cambia estado a `VERIFICACION_PRESUPUESTAL` y alerta a Finanzas. |
| **RF-ADQ-10** | Manejo de respuesta de insuficiencia presupuestal con estado `PRESUPUESTO_INSUFICIENTE`. | Pantalla 11: Detalle Requerimiento | `src/app/(erp)/adquisiciones/requerimientos/[id]/DetalleRequerimientoClient.tsx` | Banner de alerta con motivo del rechazo y botón de replanificación. |
| **RF-ADQ-11** | Modal de replanificación de compra para ajustar monto o justificar ante Finanzas. | Pantalla 11: Detalle Requerimiento | `src/app/actions/adquisiciones.ts` (`replanificarAdquisicion`) | Registra nuevo monto propuesto y devuelve a evaluación financiera. |
| **RF-ADQ-12** | Emisión formal de Orden de Compra o de Servicio tras contar con presupuesto aprobado. | Pantalla 11 y 12 | `src/app/actions/adquisiciones.ts` (`emitirOrden`) | Genera número oficial correlativo `OC-2026-XXXX` u `OS-2026-XXXX`. |
| **RF-ADQ-13** | Bloqueo estricto que impide emitir órdenes si el monto excede el autorizado. | Pantalla 11 y 12 | `src/app/actions/adquisiciones.ts` (`emitirOrden`) | Comprobación estricta en servidor: `totalOrden <= montoAutorizado`. |
| **RF-ADQ-14** | Bandeja general de órdenes de compra y servicios con estado del ciclo de entrega. | Pantalla 12: `/adquisiciones/ordenes` | `src/app/(erp)/adquisiciones/ordenes/OrdenesClient.tsx` | Tabla con seguimiento de plazos, proveedor y monto final. |
| **RF-ADQ-15** | Registro de coordinación de entrega con fecha estimada y transportista. | Pantalla 12: `/adquisiciones/ordenes` | `src/app/actions/adquisiciones.ts` (`coordinarEntrega`) | Pasa orden a `EN_TRANSITO` con datos de seguimiento logístico. |
| **RF-ADQ-16** | Otorgamiento de conformidad de servicio con informe técnico de cumplimiento. | Pantalla 12: `/adquisiciones/ordenes` | `src/app/actions/adquisiciones.ts` (`otorgarConformidadServicio`) | Cierre de órdenes de servicio y aprobación de pago a proveedor. |
| **RF-ADQ-17** | Anulación controlada de órdenes con verificación de recepciones previas. | Pantalla 12: `/adquisiciones/ordenes` | `src/app/actions/adquisiciones.ts` (`anularOrden`) | Impide anular si existen recepciones registradas en almacén. |
| **RF-ADQ-18** | Visualización e impresión de la Orden de Compra/Servicio en formato estándar. | Pantalla 12: `/adquisiciones/ordenes` | `src/app/(erp)/adquisiciones/ordenes/OrdenesClient.tsx` | Modal con diseño oficial para impresión o guardado en PDF. |

---

### 4. Módulo de Finanzas y Presupuesto (RF-ADM-01 al RF-ADM-11)

| Código RF | Descripción del Requisito | Pantalla / Ruta | Archivo de Implementación | Base de Datos / Lógica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-ADM-01** | Bandeja de solicitudes de verificación presupuestal enviadas por Adquisiciones. | Pantalla 13: `/finanzas/verificaciones` | `src/app/(erp)/finanzas/verificaciones/VerificacionesClient.tsx` | Lista filtrable con montos solicitados, requerimiento y proveedor. |
| **RF-ADM-02** | Cálculo automático del saldo disponible en tiempo real frente al monto solicitado. | Pantalla 13: `/finanzas/verificaciones` | `src/app/(erp)/finanzas/verificaciones/VerificacionesClient.tsx` | Vista `v_situacion_presupuestal` y evaluación dinámica `saldo >= monto`. |
| **RF-ADM-03** | Aprobación de verificación presupuestal con compromiso de fondos en el periodo. | Pantalla 13: `/finanzas/verificaciones` | `src/app/actions/finanzas.ts` (`procesarVerificacionPresupuestal`) | Crea registro en `compromisos_presupuestales` y descuenta saldo. |
| **RF-ADM-04** | Rechazo motivado de verificación presupuestal por insuficiencia de fondos. | Pantalla 13: `/finanzas/verificaciones` | `src/app/actions/finanzas.ts` (`procesarVerificacionPresupuestal`) | Registra estado `RECHAZADO` con justificación para Adquisiciones. |
| **RF-ADM-05** | Bandeja de adquisiciones en estado de replanificación para reevaluación financiera. | Pantalla 13: `/finanzas/verificaciones` | `src/app/(erp)/finanzas/verificaciones/VerificacionesClient.tsx` | Pestaña especial para solicitudes replanificadas con propuesta. |
| **RF-ADM-06** | Aprobación con asignación presupuestal extraordinaria o ajuste de techo. | Pantalla 13: `/finanzas/verificaciones` | `src/app/actions/finanzas.ts` (`procesarReplanificacion`) | Actualiza techo presupuestal o aprueba monto replanificado. |
| **RF-ADM-07** | Configuración y gestión de periodos presupuestales anuales y mensuales. | Pantalla 14: `/finanzas/presupuesto` | `src/app/(erp)/finanzas/presupuesto/PresupuestoClient.tsx` | Gestión de presupuestos con estado `ACTIVO` o `CERRADO`. |
| **RF-ADM-08** | Asignación y ampliación de presupuesto para el periodo operativo. | Pantalla 14: `/finanzas/presupuesto` | `src/app/actions/finanzas.ts` (`asignarPresupuesto`) | Modificación del monto asignado con recálculo de saldo disponible. |
| **RF-ADM-09** | Vista en tiempo real de la situación presupuestal: Asignado, Comprometido, Saldo. | Pantalla 14: `/finanzas/presupuesto` | `src/app/(erp)/finanzas/presupuesto/PresupuestoClient.tsx` | Tarjetas de saldo y barra de porcentaje de ejecución financiera. |
| **RF-ADM-10** | Trazabilidad completa de compromisos presupuestales vinculados a cada orden. | Pantalla 14: `/finanzas/presupuesto` | `src/app/(erp)/finanzas/presupuesto/PresupuestoClient.tsx` | Vista `v_adquisiciones_presupuesto` con orden, monto y fecha. |
| **RF-ADM-11** | Bloqueo automático del sistema si una orden excede el compromiso autorizado. | Acciones del Servidor | `src/app/actions/adquisiciones.ts` | Validador estricto a nivel de base de datos y backend. |

---

### 5. Módulo de Gerencia General, Reportes y BI (RF-GGE-01 al RF-GGE-06)

| Código RF | Descripción del Requisito | Pantalla / Ruta | Archivo de Implementación | Base de Datos / Lógica |
| :--- | :--- | :--- | :--- | :--- |
| **RF-GGE-01** | Reporte consolidado diario de ventas con montos totales y número de operaciones. | Pantalla 15: `/gerencia/reportes` | `src/app/(erp)/gerencia/reportes/ReportesClient.tsx` | Vista `v_ventas_consolidado_diario` con gráfico de evolución. |
| **RF-GGE-02** | Ranking y reporte de ventas por producto con cantidades facturadas. | Pantalla 15: `/gerencia/reportes` | `src/app/(erp)/gerencia/reportes/ReportesClient.tsx` | Vista `v_ventas_por_producto` con gráfico de barras horizontales. |
| **RF-GGE-03** | Reporte de inventario valorizado a costo de compra y precio de venta proyectado. | Pantalla 15: `/gerencia/reportes` | `src/app/(erp)/gerencia/reportes/ReportesClient.tsx` | Vista `v_inventario_consolidado` con cálculo de capital inmovilizado. |
| **RF-GGE-04** | Historial consolidado de adquisiciones y efectividad de compras a proveedores. | Pantalla 15: `/gerencia/reportes` | `src/app/(erp)/gerencia/reportes/ReportesClient.tsx` | Vista `v_historial_adquisiciones` con desglose por proveedor y estado. |
| **RF-GGE-05** | Dashboard gerencial con gráficos interactivos de ventas, inventario y presupuesto. | Pantallas 2 y 15 | `src/app/(erp)/inicio/page.tsx` y `ReportesClient.tsx` | Componentes reactivos Recharts (Área, Pastel, Barras) y KPIs. |
| **RF-GGE-06** | Exportación completa del reporte gerencial en formato Excel estructurado (.xlsx). | API Endpoint y Botón UI | `src/app/api/exportar/reporte-gerencia/route.ts` | Motor **ExcelJS** con 5 pestañas formateadas y descarga inmediata. |

---

## 🔄 Guía de Demostración del Flujo Integral E2E

Para evaluar el sistema en una sesión de sustentación o prueba funcional, se recomienda seguir el siguiente circuito continuo:

```
[1. Venta POS] ──► [2. Alerta de Stock] ──► [3. Solicitud Reposición]
                                                      │
[6. Orden Compra] ◄── [5. Verificación Presupuesto] ◄─┘
       │
       ▼
[7. Coordinación Entrega] ──► [8. Recepción Almacén] ──► [9. Cierre y Reporte BI]
```

1. **Paso 1: Venta en Tienda (Cajero)**
   - Inicie sesión con `cajero1@tecnocel.com`.
   - Vaya a **Ventas > Nueva Venta (POS)**.
   - Busque un producto (ej. "iPhone 15 Pro"), agregue unidades al carrito, seleccione medio de pago (Efectivo/Yape) y haga clic en **Completar Venta**.
   - Observe la emisión del ticket y la actualización instantánea del stock.

2. **Paso 2: Alerta de Reposición y Solicitud (Almacén)**
   - Inicie sesión con `almacen@tecnocel.com`.
   - Ingrese a **Inicio** o **Inventario > Productos** y observe los productos en alerta roja por haber caído bajo su stock mínimo.
   - Vaya a **Inventario > Solicitudes de Reposición** y haga clic en **Nueva Solicitud**.
   - Use el botón **"Cargar productos en alerta"** para auto-completar el formulario y guarde la solicitud `REP-XXXXXX`.

3. **Paso 3: Cotización de Proveedores (Compras)**
   - Inicie sesión con `compras@tecnocel.com`.
   - Vaya a **Adquisiciones > Requerimientos** y genere un requerimiento de bienes a partir de la reposición anterior.
   - Ingrese al detalle del requerimiento y agregue 2 cotizaciones de distintos proveedores (con RUC).
   - El sistema resaltará en verde la cotización más económica. Selecciónela y haga clic en **"Solicitar Verificación Presupuestal"**.

4. **Paso 4: Evaluación y Compromiso de Presupuesto (Finanzas)**
   - Inicie sesión con `finanzas@tecnocel.com`.
   - Vaya a **Finanzas > Verificaciones Presupuestales**.
   - Observe la solicitud enviada con su comparativa de saldo disponible vs. monto requerido.
   - Si cuenta con saldo suficiente, presione **Aprobar Verificación**, lo cual generará el compromiso financiero y reservará el dinero.
   - *(Opcional)* Pruebe el rechazo por insuficiencia y el posterior flujo de replanificación con ajuste de monto.

5. **Paso 5: Emisión de Orden de Compra (Compras)**
   - Regrese con `compras@tecnocel.com`.
   - En el requerimiento aprobado, haga clic en **"Emitir Orden de Compra"**.
   - Se generará la orden formal con numeración correlativa (ej. `OC-2026-000001`).
   - En **Adquisiciones > Órdenes**, registre la coordinación de entrega indicando fecha estimada y transportista.

6. **Paso 6: Recepción Física de Mercancías (Almacén)**
   - Inicie sesión con `almacen@tecnocel.com`.
   - Vaya a **Inventario > Recepción de Mercancías**.
   - Seleccione la orden de compra recién emitida, ingrese el número de Guía de Remisión física del proveedor (ej. `T001-0004523`) y confirme la recepción.
   - El sistema automáticamente sumará las unidades al stock físico, registrará el movimiento en el Kardex y marcará la solicitud de reposición como `ATENDIDA`.

7. **Paso 7: Análisis Ejecutivo y Exportación Excel (Gerencia)**
   - Inicie sesión con `gerencia@tecnocel.com`.
   - Ingrese a **Gerencia > Reportes y BI**.
   - Explore los gráficos dinámicos de ventas diarias, ejecución presupuestal, productos más vendidos y estado de adquisiciones.
   - Haga clic en el botón superior **"Exportar Excel Consolidado (.xlsx)"**.
   - Abra el archivo descargado para comprobar las 5 hojas analíticas estilizadas con formato numérico y monetario profesional.

---

## 📄 Licencia y Derechos de Autor

Desarrollado con fines exclusivamente académicos para el curso de **Innovación y Desarrollo Tecnológico** en la **Universidad Católica Sedes Sapientiae (UCSS)**, Filial Rioja / Nueva Cajamarca. Prohibida su venta o distribución no autorizada.
