import axios from "axios";

const GET_HUBS_API = "https://script.google.com/macros/s/AKfycbyyIJYPvNLQ_L-dtSI_sh4Ah1jc2tzyd9Z86sY6MYF5idhO1KOwifXk3FZ4tDRhNYCVLg/exec";
const UPDATE_STATUS_API = "https://script.google.com/macros/s/AKfycbz5jlGq_glBtVOoUqRZ_rpoKYt9dQQRdOjw15YCBlonsNIf8wXe1cleVTvtRHCSghXYVA/exec";

// Check if hub is alive
async function checkHubHealth(hubIp) {
  try {
    // Selenium Grid exposes /status
    const res = await axios.get(`${hubIp}/status`, { timeout: 3000 });

    if (res.status === 200) {
      return "ACTIVE";
    }
    return "DOWN";
  } catch (err) {
    return "DOWN";
  }
}

// Main function
export async function monitorHubs() {
  try {
    console.log("📡 Fetching HUBs from sheet...");

    const res = await axios.get(GET_HUBS_API);
    const hubs = res.data.data || res.data; // handle both formats

    console.log(`🔢 Total hubs: ${hubs.length}`);

    // Run checks in parallel
    await Promise.all(
      hubs.map(async (hubIp) => {
        const status = await checkHubHealth(hubIp);

        console.log(`🔍 ${hubIp} → ${status}`);

        // Update status in sheet
        await axios.post(UPDATE_STATUS_API, {
          hubIp,
          status
        });
      })
    );

  } catch (err) {
    console.error("❌ Hub monitor error:", err.message);
  }
}