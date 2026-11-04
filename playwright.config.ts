import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:8443",
    headless: true,
    channel: "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: "msedge",
      },
    },
  ],
})
