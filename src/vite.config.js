import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // proxy: {
    //   // Configuration for your polyglot backend migration
      
    //   // 1. Routes for the C# (.NET) service (e.g., Cost Analytics)
    //   "/api/costs": {
    //     target: "http://localhost:5000", 
    //     changeOrigin: true,
    //     secure: false,
    //   },
      
    //   // 2. Routes for the Java (Spring Boot) service (e.g., User Auth & Accounts)
    //   "/api/auth": {
    //     target: "http://localhost:8081", 
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   "/api/accounts": {
    //     target: "http://localhost:8081", 
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
  plugins: [react()],
  resolve: {
    alias: {
      // Maintains the alias used in your translated components
      "@": path.resolve(__dirname, "./src"),
    },
  },
});