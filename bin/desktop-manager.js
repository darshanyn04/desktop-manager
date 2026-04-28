#!/usr/bin/env node
import { createDesktopManager } from "../src/server.js";
import { pushDeviceHealthToSheet } from "../src/services/device-health/service.js";
import { monitorHubs } from "../src/services/hub-health/service.js";

const isMobile = process.argv.includes("--mobile");
const isHubmonitor = process.argv.includes("--hubmonitor");

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
else if (isHubmonitor) {
  console.log("📊 Hub Monitor mode enabled → starting HUB health monitoring");

  let isRunning = false;

  setInterval(async () => {
    if (isRunning) {
      console.log("⏳ Skipping HUB check (previous run still running)");
      return;
    }

    try {
      isRunning = true;
      console.log("🔄 Checking HUB health...");
      await monitorHubs();
    } catch (err) {
      console.error("❌ HUB health error:", err.message);
    } finally {
      isRunning = false;
    }
  }, 3000);
 } // every 10 sec (adjust as needed)}