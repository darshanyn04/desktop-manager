const { spawn } = require("child_process");

let appiumProcess = null;

function startAppium(port = 4723) {
  if (appiumProcess) return;

  appiumProcess = spawn("appium", ["-p", port], {
    stdio: "inherit"
  });
}

function stopAppium() {
  if (appiumProcess) {
    appiumProcess.kill("SIGTERM");
    appiumProcess = null;
  }
}

module.exports = { startAppium, stopAppium };
