import axios from "axios";
import { exec } from "child_process";
import os from "os";


const GET_DEVICE_DETAILS_URL = "https://script.google.com/macros/s/AKfycbygLh6Ny37LLlXeTaaww1z-OkVIOIlhIQwDb0ohmZqW6tRITx2ttRw5g6guDvoxgXu8kg/exec";
const UPDATE_DEVICE_STATUS_URL = "https://script.google.com/macros/s/AKfycbwkMC9Vczqh4bnD5bv_RYPgWqoDKULqrrhd3G9S29yt8hsMUJWayS5cDaojWGnb2HQ9ew/exec";


// 🔹 Call Google Script API
async function fetchDevices(machineIp) {
const res = await axios.get(`${GET_DEVICE_DETAILS_URL}?hostIp=${machineIp}`, {
  timeout: 50000
});
  console.log("📥 Fetched device details from API:", res.data);
  return res.data;
}

setInterval(() => {
  console.log("🔄 Checking device health after 30 seconds");
  pushDeviceHealthToSheet();
}, 30000); 

// 🔹 Get ADB devices
function getConnectedDevices() {
  return new Promise((resolve, reject) => {
    console.log("🔍 Running: adb devices");

    exec("adb devices", (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Error executing adb:", err.message);
        return reject(err);
      }

      if (stderr) {
        console.warn("⚠️ ADB stderr:", stderr);
      }

      console.log("📄 Raw ADB Output:\n", stdout);

      const devices = new Map();

      stdout.split("\n").forEach((line, index) => {
        const trimmed = line.trim();

        // Skip header or empty lines
        if (!trimmed || trimmed.startsWith("List of devices")) {
          return;
        }

        console.log(`➡️ Parsing line ${index}:`, trimmed);

        const parts = trimmed.split(/\s+/);

        if (parts.length === 2) {
          const [udid, state] = parts;

          console.log(`✅ Found device → UDID: ${udid}, State: ${state}`);

          devices.set(udid, state);
        } else {
          console.warn(`⚠️ Unexpected format: "${trimmed}"`);
        }
      });

      console.log("📊 Total connected devices:", devices.size);

      if (devices.size === 0) {
        console.warn("⚠️ No devices detected via ADB");
      }

      resolve(devices);
    });
  });
}

export { getConnectedDevices };

function getMachineIp() {
const interfaces = os.networkInterfaces();

  const vpnInterface = interfaces["tun0"];

  if (!vpnInterface) {
    throw new Error("VPN (tun0) interface not found");
  }

  for (const iface of vpnInterface) {
    if (iface.family === "IPv4" && !iface.internal) {
      return iface.address;
    }
  }

  throw new Error("No IPv4 address found for tun0");
}



export async function pushDeviceHealthToSheet() {
  try {
    const healthData = await checkDeviceHealth();

    const response = await axios.post(UPDATE_DEVICE_STATUS_URL, healthData, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 5000
    });
    console.log("📤 Pushed device health data:", healthData);

    console.log("✅ Sheet updated:", response.data);
  } catch (err) {
    console.error("❌ Failed to push device health:", err.message);
  }
}


// 🔹 Main logic
// export async function checkDeviceHealth() {
//     const machineIp = getMachineIp();
//   const apiData = await fetchDevices(machineIp);
//   const adbDevices = await getConnectedDevices();

//   const devices = apiData.devices.map(d => {
//     const state = adbDevices.get(d.udid);

//     let status = "OFFLINE";
//     if (state === "device") status = "ONLINE";
//     else if (state === "unauthorized") status = "UNAUTHORIZED";
//     else if (state === "offline") status = "ADB_OFFLINE";

//     return {
//       deviceName: d.deviceName,
//       udid: d.udid,
//       status
//     };
//   });

//   return {
//     machineIp,
//     total: devices.length,
//     online: devices.filter(d => d.status === "ONLINE").length,
//     offline: devices.filter(d => d.status !== "ONLINE").length,
//     devices
//   };
// }

export async function checkDeviceHealth() {
  const machineIp = getMachineIp();

  const apiData = await fetchDevices(machineIp);
  const adbDevices = await getConnectedDevices();

  // ✅ SAFE extraction
  const deviceList = apiData?.devices || [];

  if (!Array.isArray(deviceList)) {
    throw new Error("Invalid API response: devices is not an array");
  }

  const devices = deviceList.map(d => {
    const state = adbDevices.get(d.udid);

    let status = "OFFLINE";
    if (state === "device") status = "ONLINE";
    else if (state === "unauthorized") status = "UNAUTHORIZED";
    else if (state === "offline") status = "ADB_OFFLINE";

    return {
      deviceName: d.deviceName,
      udid: d.udid,
      status
    };
  });

  return {
    machineIp,
    total: devices.length,
    online: devices.filter(d => d.status === "ONLINE").length,
    offline: devices.filter(d => d.status !== "ONLINE").length,
    devices
  };
}