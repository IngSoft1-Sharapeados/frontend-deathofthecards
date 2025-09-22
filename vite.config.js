import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src") //  @ apunta a /src
    }
  },
  test: {
    globals: true,      // para usar test() y expect() sin importarlas
    environment: "jsdom", // para que funcione el DOM
  }
});