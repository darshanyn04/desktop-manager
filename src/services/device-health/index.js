import { checkDeviceHealth } from "./service.js";

export function registerDeviceHealthRoutes(app) {
  app.get("/api/device-health", async (req, res) => {
    try {
      const { hostIp } = req.query;

      if (!hostIp) {
        return res.status(400).json({ error: "hostIp is required" });
      }

      const result = await checkDeviceHealth(hostIp);
      res.json(result);
    } catch (err) {
      console.error("Device health error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}