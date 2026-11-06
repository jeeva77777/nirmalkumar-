import { defineConfig } from "vite";

export default defineConfig(async ({ mode }) => {
  const plugins = [];
  if (mode === "development") {
    try {
      const mkcertModule = await import("vite-plugin-mkcert");
      const mkcert = mkcertModule.default || mkcertModule;
      plugins.push(mkcert());
    } catch (err) {
      console.warn("[Vite dev]: mkcert plugin optional:", err.message);
    }
  }

  return {
    plugins,
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
  };
});
