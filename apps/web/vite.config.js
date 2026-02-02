import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        proxy: process.env.VITE_API_URL
            ? undefined
            : { "/api": { target: "http://localhost:3000", changeOrigin: true } },
    },
});
