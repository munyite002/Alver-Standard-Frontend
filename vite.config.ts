import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path"

// https://vite.dev/config/
export default defineConfig({
    // base: '/app/',
    plugins: [react(), tailwindcss()],
    server: {
        host: "0.0.0.0",
        port: 5173,
	allowedHosts: ['stron.alverpower.com']
    },
    resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
