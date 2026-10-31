import type { ThemeConfig } from "antd";

export const COLORES_ERP = {
  fondoOscuro: "#1a1e29", // menú lateral, pantalla de login
  azulProfundo: "#132d46", // encabezados de tablas, tarjetas destacadas
  verdeAcento: "#01c38e", // color primario: botones, selección, indicadores positivos
  blanco: "#ffffff",
  grisFondo: "#f3f6f9",
  rojoError: "#e5484d",
  ambarAdvertencia: "#f5a524",
  azulInfo: "#2d7ff9",
} as const;

export const temaAntd: ThemeConfig = {
  token: {
    colorPrimary: COLORES_ERP.verdeAcento,
    colorInfo: COLORES_ERP.azulInfo,
    colorSuccess: COLORES_ERP.verdeAcento,
    colorWarning: COLORES_ERP.ambarAdvertencia,
    colorError: COLORES_ERP.rojoError,
    colorBgLayout: COLORES_ERP.grisFondo,
    colorBgContainer: COLORES_ERP.blanco,
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      siderBg: COLORES_ERP.fondoOscuro,
      headerBg: COLORES_ERP.blanco,
      bodyBg: COLORES_ERP.grisFondo,
    },
    Menu: {
      darkItemBg: COLORES_ERP.fondoOscuro,
      darkSubMenuItemBg: "#141720",
      darkItemSelectedBg: COLORES_ERP.verdeAcento,
      darkItemSelectedColor: COLORES_ERP.fondoOscuro,
      darkItemHoverBg: COLORES_ERP.azulProfundo,
      darkItemColor: "#d9e1ec",
    },
    Table: {
      headerBg: COLORES_ERP.azulProfundo,
      headerColor: COLORES_ERP.blanco,
      headerSortActiveBg: "#1b3f60",
      headerSortHoverBg: "#1b3f60",
      rowHoverBg: "#eef8f5",
      borderColor: "#e5eaf0",
    },
    Button: {
      primaryColor: COLORES_ERP.fondoOscuro,
      fontWeight: 600,
    },
    Card: {
      headerBg: COLORES_ERP.blanco,
    },
  },
};
