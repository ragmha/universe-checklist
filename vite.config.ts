import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const sourceDirectory = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": sourceDirectory },
  },
  server: {
    host: "127.0.0.1",
    port: 4177,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4177,
    strictPort: true,
  },
  build: {
    assetsInlineLimit: 200_000,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (asset) => asset.name?.endsWith(".css")
          ? "assets/app.css"
          : "assets/[name]-[hash][extname]",
      },
    },
  },
});
