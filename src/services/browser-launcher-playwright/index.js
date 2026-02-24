import getPort from "get-port";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const sessions = new Map();
const PW_ROOT = path.resolve(".pw-versions");

// 🔥 Always use controlled Chrome
const DEFAULT_CHROME_PATH =
  "C:/FireFlink_Cloud/Chrome_Browsers/Chrome_121/chrome.exe";

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
export async function startPlaywrightServer({
  version = "1.58",
  browser = "chromium",
  headless = false,
  chromePath
} = {}) {

  const sessionId = uuidv4();
  const port = await getPort();

  console.log(`Requested Playwright version: ${version}`);

  const versionDir = ensurePlaywrightInstalled(version);

  // Load that specific version
  const requireFromVersion = createRequire(
    path.join(versionDir, "package.json")
  );

  const playwright = requireFromVersion("playwright-core");

  const browserType = playwright[browser];

  if (!browserType) {
    throw new Error(`Invalid browser: ${browser}`);
  }

  // 🔥 Always resolve chrome path safely
  const executablePath = chromePath || DEFAULT_CHROME_PATH;

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Chrome executable not found at ${executablePath}`);
  }

  const browserServer = await browserType.launchServer({
    headless,
    port,
    executablePath,
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
    port,
    executablePath
  });

  return {
    sessionId,
    wsEndpoint,
    version,
    browser,
    port,
    headless,
    chromePath: executablePath
  };
}

/**
 * Stop server
 */
export async function stopPlaywrightServer(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  await session.browserServer.close();
  sessions.delete(sessionId);
}

/**
 * List sessions
 */
export function listPlaywrightSessions() {
  return Array.from(sessions.values()).map(s => ({
    sessionId: s.sessionId,
    wsEndpoint: s.wsEndpoint,
    version: s.version,
    browser: s.browser,
    port: s.port
  }));
}

/**
 * Register routes
 */
export function registerPlaywrightRoutes(app) {

  app.post("/api/playwright/start", async (req, res) => {
    try {
      const session = await startPlaywrightServer(req.body || {});
      res.json(session);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/playwright/stop", async (req, res) => {
    try {
      await stopPlaywrightServer(req.body.sessionId);
      res.json({ status: "stopped" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/playwright/sessions", (_, res) => {
    res.json(listPlaywrightSessions());
  });
}