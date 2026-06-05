#!/usr/bin/env node
import { accessSync, constants } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { render } from "jsonresume-theme-colophon";

const root = process.cwd();
const resumePath = path.join(root, "src", "data", "resume.json");
const publicPdfPath = path.join(root, "public", "resume.pdf");
const pdfTimeoutMs = readPositiveInteger("RESUME_PDF_TIMEOUT_MS", 120_000);
const chromePath = resolveChromePath();

if (!chromePath) {
  console.error(
    "Could not find Chrome or Chromium. Set CHROME_PATH to the browser executable path.",
  );
  process.exit(1);
}

const userDataDir = await mkdtemp(path.join(os.tmpdir(), "david-mn-resume-pdf-"));
let browser;

try {
  const resume = JSON.parse(await readFile(resumePath, "utf8"));
  const html = render(resume);

  await mkdir(path.dirname(publicPdfPath), { recursive: true });
  await rm(publicPdfPath, { force: true });

  browser = await launchBrowser(chromePath, userDataDir);

  const page = await browser.newPage();
  page.setDefaultTimeout(pdfTimeoutMs);
  page.setDefaultNavigationTimeout(pdfTimeoutMs);

  await page.setContent(html, {
    timeout: pdfTimeoutMs,
    waitUntil: "load",
  });
  await page.emulateMediaType("print");
  await withTimeout(
    page.pdf({
      path: publicPdfPath,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
    }),
    pdfTimeoutMs,
    "Timed out while asking Chrome to print the resume PDF.",
  );

  const pdf = await stat(publicPdfPath);

  if (pdf.size === 0) {
    throw new Error(`Chrome created an empty PDF at ${publicPdfPath}.`);
  }

  console.log(
    `Wrote ${path.relative(root, publicPdfPath)} (${Math.round(pdf.size / 1024)} KB)`,
  );
} catch (error) {
  console.error(formatFailure(error, chromePath));
  process.exitCode = 1;
} finally {
  if (browser) {
    await closeBrowser(browser);
  }

  await rm(userDataDir, { force: true, recursive: true });
}

async function launchBrowser(executablePath, userDataDir) {
  return await puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: pdfTimeoutMs,
    timeout: pdfTimeoutMs,
    userDataDir,
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-setuid-sandbox",
      "--disable-sync",
      "--font-render-hinting=none",
      "--metrics-recording-only",
      "--no-first-run",
      "--no-sandbox",
      "--noerrdialogs",
    ],
  });
}

async function closeBrowser(browser) {
  const browserProcess = browser.process();

  try {
    await withTimeout(browser.close(), 10_000, "Timed out closing Chrome.");
  } catch {
    browserProcess?.kill("SIGKILL");
  }
}

function resolveChromePath() {
  const fromEnv =
    process.env.CHROME_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();

  if (fromEnv && isExecutable(fromEnv)) {
    return fromEnv;
  }

  const absoluteCandidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  for (const candidate of absoluteCandidates) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  for (const command of [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ]) {
    const found = spawnSync("which", [command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    if (found.status === 0) {
      const commandPath = found.stdout.trim().split("\n")[0];

      if (isExecutable(commandPath)) {
        return commandPath;
      }
    }
  }

  return "";
}

function isExecutable(filePath) {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);

  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  return fallback;
}

async function withTimeout(promise, timeoutMs, message) {
  let timeout;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function formatFailure(error, executablePath) {
  const chromeVersion = spawnSync(executablePath, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const details = [
    "Failed to build resume PDF.",
    `Chrome: ${executablePath}`,
    `Chrome version: ${chromeVersion.stdout.trim() || "unknown"}`,
    `Platform: ${process.platform} ${process.arch}`,
    `CI: ${process.env.CI ? "true" : "false"}`,
    `Timeout: ${pdfTimeoutMs}ms`,
  ];

  return `${details.join("\n")}\n\n${error?.stack || error}`;
}
