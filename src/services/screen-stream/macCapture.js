import { spawn } from "child_process";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const macCaptureEmitter = new EventEmitter();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let proc = null;
let buffer = Buffer.alloc(0);

/**
 * Resolve mac-capture binary for:
 * 1) npm-installed package (bin/mac-capture)
 * 2) local dev Swift build (mac-capture/.build/release/mac-capture)
 */
function resolveMacCaptureBinary() {
  // npm-installed path
  const packagedBin = path.resolve(
    __dirname,
    "../../../bin/mac-capture"
  );

  // local dev path
  const devBin = path.resolve(
    __dirname,
    "../../../mac-capture/.build/release/mac-capture"
  );

  if (fs.existsSync(packagedBin)) {
    return packagedBin;
  }

  if (fs.existsSync(devBin)) {
    return devBin;
  }

  return null;
}

export function startMacCapture() {
  if (proc) return;

  const binPath = resolveMacCaptureBinary();

  if (!binPath) {
    console.warn("⚠️ mac-capture binary not found. Native capture disabled.");
    return;
  }

  console.log("🎯 Starting mac-capture:", binPath);

  proc = spawn(binPath, [], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  proc.on("error", (err) => {
    console.error("❌ mac-capture spawn failed:", err.message);
    proc = null;
  });

  proc.stderr.on("data", (d) => {
    if (d.toString().includes("READY")) {
      console.log("✅ Swift capture ready");
    }
  });

  proc.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const frameLength = buffer.readUInt32BE(0);
      if (buffer.length < 4 + frameLength) break;

      const frame = buffer.slice(4, 4 + frameLength);
      buffer = buffer.slice(4 + frameLength);

      macCaptureEmitter.emit("frame", frame);
    }
  });

  proc.on("exit", (code) => {
    console.warn(`⚠️ mac-capture exited (${code})`);
    proc = null;
  });
}
