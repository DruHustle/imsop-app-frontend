import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./system",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4189", trace: "off" },
  webServer: {
    command:
      "IMSOP_SYSTEM_API=http://127.0.0.1:18067 VITE_BASE_PATH=/ pnpm preview --host 127.0.0.1 --port 4189",
    url: "http://127.0.0.1:4189",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
