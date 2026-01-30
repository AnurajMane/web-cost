import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // PROXY RULE: Any request starting with /api goes to your backend
      // Change target to http://localhost:5000 (for C#) or 8080 (for Java)
      "/api": {
        target: "http://localhost:5000", 
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});