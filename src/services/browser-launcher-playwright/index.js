import getPort from "get-port";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import os from "os";


const sessions = new Map();
const PW_ROOT = path.resolve(".pw-versions");

// 🔥 Controlled Chrome (Hardcoded)

/**
 * Ensure specific Playwright version is installed
 */
function ensurePlaywrightInstalled(version) {
  const dir = path.join(PW_ROOT, version);

  if (!fs.existsSync(dir)) {
    console.log(`[PW] Installing playwright-core ${version}...`);

    fs.mkdirSync(dir, { recursive: true });

    execSync(`npm init -y`, {
      cwd: dir,
      stdio: "ignore"
    });

    execSync(`npm install playwright-core@${version}`, {
      cwd: dir,
      stdio: "inherit"
    });
  }

  return dir;
}

/**
 * Start Playwright Server
 */
export async function startPlaywrightServer(options = {}) {
  console.log(options)
  const version = options.version || "1.58.0";
  const browser = options.browser || "chromium";
  const browserVersion = options.browserVersion || "141";
  const headless =
    options.headless === true || options.headless === "true";
    let DEFAULT_BROWSER_PATH =null;

    if(browser==="chromium"){
      console.log(os.platform())
      if(os.platform()==="win32"){
      DEFAULT_BROWSER_PATH=`C:/FireFlink_Cloud/Chrome_Browsers/Chrome_${browserVersion}/chrome.exe`;
      }
    }
    else if(browser === "firefox"){

    }
    else{
      // const DEFAULT_BROWSER_PATH =
    }





  if (!["chromium", "firefox", "webkit"].includes(browser)) {
    throw new Error(`Invalid browser type: ${browser}`);
  }

  if (!fs.existsSync(DEFAULT_BROWSER_PATH)) {
    throw new Error(
      `Chrome executable not found at ${DEFAULT_BROWSER_PATH}`
    );
  }

  const sessionId = uuidv4();
  const port = await getPort();

  console.log(`[PW] Starting session ${sessionId}`);
  console.log(`[PW] Version: ${version}`);
  console.log(`[PW] Browser: ${browser}`);
  console.log(`[PW] Headless: ${headless}`);

  const versionDir = ensurePlaywrightInstalled(version);

  const requireFromVersion = createRequire(
    path.join(versionDir, "package.json")
  );

  const playwright = requireFromVersion("playwright-core");

  const browserType = playwright[browser];

  if (!browserType) {
    throw new Error(`Browser "${browser}" not supported by Playwright`);
  }

  const browserServer = await browserType.launchServer({
    headless,
    port,
    executablePath: DEFAULT_BROWSER_PATH,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=0"
    ]
  });

  const wsEndpoint = browserServer.wsEndpoint();

  sessions.set(sessionId, {
    sessionId,
    browserServer,
    wsEndpoint,
    version,
    browser,
    port
  });

  return {
    sessionId,
    wsEndpoint,
    version,
    browser,
    port,
    headless
  };
}

/**
 * Stop Playwright Server
 */
export async function stopPlaywrightServer(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  await session.browserServer.close();
  sessions.delete(sessionId);

  console.log(`[PW] Session ${sessionId} stopped`);
}

/**
 * List active sessions
 */
export function listPlaywrightSessions() {
  return Array.from(sessions.values()).map((s) => ({
    sessionId: s.sessionId,
    wsEndpoint: s.wsEndpoint,
    version: s.version,
    browser: s.browser,
    port: s.port
  }));
}

/**
 * Register Express Routes
 */
export function registerPlaywrightRoutes(app) {
  app.post("/api/playwright/start", async (req, res) => {
    try {
      console.log(`Request Body ${req.body}`)
      const session = await startPlaywrightServer(req.body || {});
      res.json(session);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/playwright/stop", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        throw new Error("sessionId is required");
      }

      await stopPlaywrightServer(sessionId);
      res.json({ status: "stopped", sessionId });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/playwright/sessions", (_, res) => {
    res.json(listPlaywrightSessions());
  });
}