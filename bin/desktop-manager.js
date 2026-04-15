#!/usr/bin/env node
import { createDesktopManager } from "../src/server.js";
import { pushDeviceHealthToSheet } from "../src/services/device-health/service.js";

const isMobile = process.argv.includes("--mobile");

// 🚀 Start server
createDesktopManager({
  enableMobile: isMobile
});

// 📱 Run scheduler ONLY in mobile mode
if (isMobile) {
  console.log("📱 Mobile mode enabled → starting device health monitoring");

  let isRunning = false;

  setInterval(async () => {
    if (isRunning) {
      console.log("⏳ Skipping (previous run still running)");
      return;
    }

    try {
      isRunning = true;

      console.log("🔄 Checking device health...");
      await pushDeviceHealthToSheet(true); // 👈 pass flag

    } catch (err) {
      console.error("❌ Device health error:", err.message);
    } finally {
      isRunning = false;
    }
  }, 5000);
}