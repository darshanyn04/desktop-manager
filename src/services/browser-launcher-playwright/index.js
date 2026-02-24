import getPort from "get-port";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const sessions = new Map();

const PW_ROOT = path.resolve(".pw-versions");

/**
 * Ensure playwright version installed
 */
function ensurePlaywrightInstalled(version) {

  const dir = path.join(PW_ROOT, version);

  if (!fs.existsSync(dir)) {

    console.log(`[PW] Installing Playwright ${version}...`);

    fs.mkdirSync(dir, { recursive: true });

    execSync(
      `npm init -y`,
      { cwd: dir, stdio: "ignore" }
    );

    execSync(
      `npm install playwright@${version}`,
      { cwd: dir, stdio: "inherit" }
    );

  }

  return dir;
}

/**
 * Start Playwright Server (headed)
 */
export async function startPlaywrightServer({
  version = "latest",
  browser = "chromium",
  headless = false
} = {}) {

  const sessionId = uuidv4();
  const port = await getPort();

  const versionDir =
    ensurePlaywrightInstalled(version);

  const playwrightPath =
    path.join(
      versionDir,
      "node_modules",
      "playwright",
      "index.js"
    );

  const playwrightModule =
    await import(playwrightPath);

  const playwright =
    playwrightModule.default;   // FIX HERE

  const browserType =
    playwright[browser];

  if (!browserType)
    throw new Error(`Invalid browser: ${browser}`);

  const browserServer =
    await browserType.launchServer({
      headless,
      port
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
 * Stop server
 */
export async function stopPlaywrightServer(sessionId) {

  const session =
    sessions.get(sessionId);

  if (!session)
    throw new Error("Session not found");

  await session.browserServer.close();

  sessions.delete(sessionId);

}

/**
 * List sessions
 */
export function listPlaywrightSessions() {

  return Array.from(
    sessions.values()
  ).map(s => ({

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

  app.post(
    "/api/playwright/start",
    async (req, res) => {

      try {

        const session =
          await startPlaywrightServer(
            req.body || {}
          );

        res.json(session);

      } catch (e) {

        res.status(500).json({
          error: e.message
        });

      }

    });

  app.post(
    "/api/playwright/stop",
    async (req, res) => {

      try {

        await stopPlaywrightServer(
          req.body.sessionId
        );

        res.json({
          status: "stopped"
        });

      } catch (e) {

        res.status(500).json({
          error: e.message
        });

      }

    });

  app.get(
    "/api/playwright/sessions",
    (_, res) => {

      res.json(
        listPlaywrightSessions()
      );

    });

}