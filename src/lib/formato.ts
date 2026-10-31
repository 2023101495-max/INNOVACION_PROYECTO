import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

export const ZONA_PERU = "America/Lima";

/**
 * Formatea un número como moneda en Soles peruanos: S/ 1,234.56
 */
export function formatearMoneda(valor: number | string | null | undefined): string {
  const num = Number(valor ?? 0);
  if (Number.isNaN(num)) return "S/ 0.00";
  return `S/ ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea un número con separador de miles
 */
export function formatearNumero(valor: number | string | null | undefined): string {
  const num = Number(valor ?? 0);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

/**
 * Formatea una fecha a DD/MM/YYYY
 */
export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return dayjs(fecha).format("DD/MM/YYYY");
}

/**
 * Formatea una fecha y hora a DD/MM/YYYY HH:mm
 */
export function formatearFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return dayjs(fecha).format("DD/MM/YYYY HH:mm");
}

/**
 * Obtiene la fecha actual en zona horaria de Perú en formato YYYY-MM-DD
 */
export function fechaHoyPeru(): string {
  return dayjs().tz(ZONA_PERU).format("YYYY-MM-DD");
}

export { dayjs };
