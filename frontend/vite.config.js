import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/hardhat-rpc": {
        target: "http://127.0.0.1:8545",
        changeOrigin: true,
        rewrite: () => "/",
      },
    },
  },
});
