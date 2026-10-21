import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: funciona no GitHub Pages (usuario.github.io/enfNewsDaily/) e em qualquer subpasta
export default defineConfig({
  plugins: [react()],
  base: "./",
});
