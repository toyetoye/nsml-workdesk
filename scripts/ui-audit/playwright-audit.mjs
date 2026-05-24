#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const defaultBaseUrl = "http://127.0.0.1:3000";
const baseUrl = (process.env.NSML_UI_AUDIT_BASE_URL || process.env.UI_AUDIT_BASE_URL || defaultBaseUrl).replace(
  /\/+$/,
  "",
);

function parseEnvContent(content) {
  const parsed = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    let key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1);

    if (!key) continue;

    if (key.startsWith("export ")) {
      key = key.slice(7).trim();
    }

    value = value.trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in parsed)) {
      parsed[key] = value;
    }
  }

  return parsed;
}

function loadEnvFiles() {
  const candidates = [".env.local", ".env"];

  for (const fileName of candidates) {
    const filePath = path.join(repoRoot, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const parsed = parseEnvContent(content);

    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function strip(value) {
  return String(value ?? "").trim();
}

function requireEnv(name) {
  const value = strip(process.env[name]);
  if (!value) {
    throw new Error(`Missing required env var ${name}. Set it in .env.local or your shell before running npm run ui:audit.`);
  }
  return value;
}

function formatCheck(ok, label, details) {
  return `${ok ? "[ok]" : "[warn]"} ${label}${details ? ` — ${details}` : ""}`;
}

async function waitForAppReady(fetchImpl) {
  const loginUrl = new URL("/login", baseUrl).toString();
  const timeoutAt = Date.now() + 30_000;
  let lastError = null;

  while (Date.now() < timeoutAt) {
    try {
      const response = await fetchImpl(loginUrl, { redirect: "manual" });
      if (response.ok || response.status >= 300) {
        return;
      }
      lastError = `Unexpected status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `The app is not reachable at ${baseUrl}. Start the local app first (for example: npm run start) and try again. Last error: ${lastError ?? "unknown"}`,
  );
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_BROWSER_PATH,
    process.env.CHROME_PATH,
    process.env.CHROME_BIN,
    process.env.EDGE_PATH,
    process.env.MSEDGE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

async function capturePage(page, route, filePath) {
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
  await page.screenshot({ path: filePath, fullPage: false });
}

async function main() {
  loadEnvFiles();

  const appPassword = requireEnv("NSML_APP_PASSWORD");
  const auditDir = path.join(repoRoot, "references", "screenshots", "ui-audit", timestampSlug());
  ensureDir(auditDir);

  console.log("NSML WorkDesk UI audit");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Audit output: ${auditDir}`);

  await waitForAppReady(fetch);

  const browserExecutable = findBrowserExecutable();
  if (!browserExecutable) {
    throw new Error(
      "Could not find a local Chrome/Edge executable for Playwright. Set PLAYWRIGHT_BROWSER_PATH, CHROME_PATH, CHROME_BIN, EDGE_PATH, or MSEDGE_PATH.",
    );
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutable,
  });

  try {
    const unauthenticated = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    });
    const unauthenticatedPage = await unauthenticated.newPage();

    const protectedRoutes = ["/dashboard", "/import", "/assurance", "/cases", "/drafts"];
    for (const route of protectedRoutes) {
      await unauthenticatedPage.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
      const currentUrl = unauthenticatedPage.url();
      if (!currentUrl.includes("/login")) {
        throw new Error(`Protected route did not redirect to /login: ${route} -> ${currentUrl}`);
      }
    }

    await unauthenticated.close();

    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "networkidle" });

    const passwordField = page.locator('input[name="password"]');
    if ((await passwordField.count()) === 0) {
      throw new Error(
        "The login form is not visible. Ensure the app is running with access-gate env vars configured, not local fallback mode.",
      );
    }

    await passwordField.fill(appPassword);
    await page.getByRole("button", { name: /enter app/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 20_000 });

    const desktopDashboard = path.join(auditDir, "dashboard-desktop.png");
    await capturePage(page, "/dashboard", desktopDashboard);

    const dashboardStats = await page.evaluate(() => {
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0;
      };

      const headings = Array.from(document.querySelectorAll("main h1, main h2, main h3"))
        .filter((node) => visible(node))
        .map((node) => (node.textContent || "").trim())
        .filter(Boolean);

      const cards = Array.from(document.querySelectorAll("main article, main section"))
        .filter((node) => visible(node))
        .slice(0, 40)
        .map((node) => (node.textContent || "").trim())
        .filter(Boolean);

      const clickable = Array.from(document.querySelectorAll('main a, main button'))
        .filter((node) => visible(node))
        .map((node) => (node.textContent || "").trim())
        .filter(Boolean);

      return {
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        headings,
        cards,
        clickable,
      };
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(auditDir, "dashboard-mobile.png"),
      fullPage: false,
    });
    await page.setViewportSize({ width: 1440, height: 1100 });

    const routes = [
      { route: "/import", file: "import-desktop.png" },
      { route: "/assurance", file: "assurance-desktop.png" },
      { route: "/cases", file: "cases-desktop.png" },
      { route: "/drafts", file: "drafts-desktop.png" },
    ];

    for (const item of routes) {
      await capturePage(page, item.route, path.join(auditDir, item.file));
    }

    const pagesToCheck = ["/dashboard", "/import", "/assurance", "/cases", "/drafts"];
    for (const route of pagesToCheck) {
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });

      const sendButtons = page.getByRole("button", { name: /send/i });
      if ((await sendButtons.count()) > 0) {
        throw new Error(`A Send button was found on ${route}.`);
      }
    }

    await page.goto(new URL("/drafts", baseUrl).toString(), { waitUntil: "networkidle" });
    const copyButtons = page.getByRole("button", { name: /copy reviewed draft/i });
    const copyButtonCount = await copyButtons.count();
    for (let index = 0; index < copyButtonCount; index += 1) {
      const button = copyButtons.nth(index);
      const disabled = await button.isDisabled();
      if (!disabled) {
        const article = button.locator("xpath=ancestor::article[1]");
        const articleText = strip(await article.textContent());
        if (!/safe to copy/i.test(articleText)) {
          throw new Error("An enabled copy button was found without a visible safe-to-copy state.");
        }
      }
    }

    const oneViewport = dashboardStats.scrollHeight <= dashboardStats.viewportHeight * 1.15;
    const visibleSections = Array.from(new Set(dashboardStats.headings)).length;
    const dashboardNote = [
      "# Dashboard audit note",
      "",
      `- Fits in one viewport: ${oneViewport ? "yes" : "no"}`,
      `- Major visible headings: ${visibleSections}`,
      `- Overview cards visible: ${dashboardStats.cards.slice(0, 8).length}`,
      `- Click-through destinations visible: ${["Import", "Assurance", "Cases", "Drafts"].every((target) => dashboardStats.clickable.some((item) => item.includes(target))) ? "yes" : "partial"}`,
      `- Detailed workflow content still visible: ${dashboardStats.headings
        .filter((text) => /workflow|queue|recent|snapshot|filters/i.test(text))
        .join(", ") || "none obvious in the first viewport"}`,
      `- Should remain overview-only: dashboard counts, module cards, and top attention items`,
      `- Should move into module pages: long workflow checklist, queue detail, recent-import detail, vessel snapshots, and secondary status groups`,
    ].join("\n");

    writeText(path.join(auditDir, "dashboard-audit-note.md"), dashboardNote + "\n");

    const summary = [
      "UI audit complete.",
      `Screenshots saved to: ${auditDir}`,
      `Dashboard one-viewport fit: ${oneViewport ? "yes" : "no"}`,
      `Visible dashboard headings: ${visibleSections}`,
    ];

    writeText(path.join(auditDir, "audit-summary.txt"), summary.join("\n") + "\n");

    console.log("\n" + summary.join("\n"));
    console.log(formatCheck(true, "Login", "App password accepted and dashboard reached."));
    console.log(formatCheck(true, "Protected redirect", "Unauthenticated pages redirected to /login."));
    console.log(formatCheck(true, "Send button", "No Send button found on audited pages."));
    console.log(formatCheck(true, "Copy gate", "Copy button remained disabled unless safe-to-copy state is visible."));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("");
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
