import getPort from "get-port";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const sessions = new Map();
const PW_ROOT = path.resolve(".pw-versions");

function ensurePlaywrightInstalled(version, browser) {

  const dir = path.join(PW_ROOT, version);
  const browsersPath = path.join(dir, ".browsers");

  const env = {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: browsersPath
  };

  if (!fs.existsSync(path.join(dir, "node_modules"))) {

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

  console.log(`[PW] Ensuring ${browser} installed for ${version}...`);

  execSync(
    `npx playwright-core install ${browser}`,
    {
      cwd: dir,
      stdio: "inherit",
      env
    }
  );

  return { dir, browsersPath };
}

export async function startPlaywrightServer(options = {}) {

  const version = options.version || "1.58.0";
  const browser = options.browser || "chromium";
  const headless =
    options.headless === true || options.headless === "true";

  if (!["chromium", "firefox", "webkit"].includes(browser)) {
    throw new Error(`Invalid browser type: ${browser}`);
  }

  const sessionId = uuidv4();
  const port = await getPort();

  console.log(`\n[PW] Starting session ${sessionId}`);
  console.log(`[PW] Playwright Version: ${version}`);
  console.log(`[PW] Browser: ${browser}`);
  console.log(`[PW] Headless: ${headless}`);

  const { dir: versionDir, browsersPath } =
    ensurePlaywrightInstalled(version, browser);

  process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

  const requireFromVersion =
    createRequire(path.join(versionDir, "package.json"));

  const playwright =
    requireFromVersion("playwright-core");

  const browserType =
    playwright[browser];

  if (!browserType) {
    throw new Error(
      `Browser "${browser}" not supported by Playwright`
    );
  }

  const browserServer =
    await browserType.launchServer({
      headless,
      port,
      // args: [
      //   "--no-sandbox",
      //   "--disable-dev-shm-usage"
      // ]
    });

  const wsEndpoint =
    browserServer.wsEndpoint();

  sessions.set(sessionId, {
    sessionId,
    browserServer,
    wsEndpoint,
    version,
    browser,
    port
  });

  console.log(`[PW] Started at ${wsEndpoint}\n`);

  return {
    sessionId,
    wsEndpoint,
    version,
    browser,
    port,
    headless
  };
}

export async function stopPlaywrightServer(sessionId) {

  const session =
    sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  await session.browserServer.close();
  sessions.delete(sessionId);

  console.log(`[PW] Session ${sessionId} stopped`);
}

export function listPlaywrightSessions() {

  return Array.from(
    sessions.values()
  ).map((s) => ({

    sessionId: s.sessionId,
    wsEndpoint: s.wsEndpoint,
    version: s.version,
    browser: s.browser,
    port: s.port

  }));
}
export function registerPlaywrightRoutes(app) {

  app.post("/api/playwright/start", async (req, res) => {

    try {

      const session =
        await startPlaywrightServer(req.body || {});

      res.json(session);

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  });

  app.post("/api/playwright/stop", async (req, res) => {

    try {

      const { sessionId } = req.body;

      if (!sessionId)
        throw new Error("sessionId is required");

      await stopPlaywrightServer(sessionId);

      res.json({
        status: "stopped",
        sessionId
      });

    } catch (e) {

      res.status(500).json({
        error: e.message
      });

    }

  });

  app.get("/api/playwright/sessions", (_, res) => {

    res.json(
      listPlaywrightSessions()
    );

  });
}