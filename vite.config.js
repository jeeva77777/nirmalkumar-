import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => ({
  plugins: mode === "development" ? [mkcert()] : [],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
}));
