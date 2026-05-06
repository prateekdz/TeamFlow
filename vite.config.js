import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPort = Number(env.PORT || 3000);
  const clientPort = Number(env.CLIENT_PORT || 5173);

  return {
    root: path.resolve("."),
    envDir: process.cwd(),
    publicDir: path.resolve("public"),
    base: env.BASE_PATH || "/",
    plugins: [react(), tailwindcss({ optimize: false })],
    resolve: {
      alias: {
        "@": path.resolve("src"),
        "@assets": path.resolve("public", "attached_assets"),
        "@workspace/api-client-react": path.resolve(
          "public",
          "lib",
          "api-client-react",
          "index.js",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      host: "0.0.0.0",
      port: clientPort,
      strictPort: true,
      proxy: {
        "/api": `http://localhost:${apiPort}`,
      },
    },
    preview: {
      host: "0.0.0.0",
      port: clientPort,
    },
    build: {
      outDir: path.resolve("dist", "public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("@clerk")) return "clerk";
              if (id.includes("@tanstack")) return "query";
              if (id.includes("lucide-react")) return "icons";
              if (id.includes("@radix-ui")) return "radix";
              if (id.includes("react") || id.includes("wouter")) return "framework";
            }
          },
        },
      },
    },
  };
});
