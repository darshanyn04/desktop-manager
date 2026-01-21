import os from "os";

let impl;

if (os.platform() === "darwin") {
  ({ captureMacFrame: impl } = await import("./mac.js"));
} else {
  impl = async () => null;
}

export async function captureFrame() {
  return impl();
}
