import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/okr-planner/", // repository 이름으로 수정
  plugins: [react()],
});
