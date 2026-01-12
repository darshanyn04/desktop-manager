module.exports = {
  startAppium,
  stopAppium,
  launchBrowser,
  startScreenStream,
  stopScreenStream,
  takeScreenshot,
  startRecording,
  stopRecording
};

const { startAppium, stopAppium } = require("./appium/appiumManager");
const { launchBrowser } = require("./browser/browserLauncher");
const { startScreenStream, stopScreenStream } = require("./screen/mjpegStreamer");
const { takeScreenshot } = require("./screen/screenshot");
const { startRecording, stopRecording } = require("./screen/recorder");
