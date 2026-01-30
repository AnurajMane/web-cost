import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // This ensures that all "@/" imports resolve correctly to your src folder
      "@": path.resolve(__dirname, "./src"),
    },
    // Adding extensions helps Vite resolve your new .jsx files faster
    extensions: ['.js', '.jsx', '.json']
  },
});