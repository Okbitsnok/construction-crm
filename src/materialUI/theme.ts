"use client";

import { createTheme } from "@mui/material/styles";

const FONT_FAMILY = "var(--font-inter), system-ui, -apple-system, sans-serif";

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#2457C5" },
        background: { default: "#F4F6FA", paper: "#FFFFFF" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#7EA6F7" },
        background: { default: "#0F141C", paper: "#171E29" },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: FONT_FAMILY,
    h1: { fontSize: "1.75rem", fontWeight: 700 },
    h2: { fontSize: "1.25rem", fontWeight: 600 },
    h3: { fontSize: "1.0625rem", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
  },
});
