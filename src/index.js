export { createDesktopManager } from "./server.js";
export { startScreenStream, takeScreenshot } from "./services/screen-stream/index.js";
export { registerRecordingRoutes } from "./services/recording/index.js";
export { registerPlaywrightRoutes, startPlaywrightServer,stopPlaywrightServer } from "./services/browser-launcher-playwright/index.js";
export { registerDeviceHealthRoutes } from "./services/device-health/index.js";