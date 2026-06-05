#!/usr/bin/env node
import { accessSync, constants } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { render } from "jsonresume-theme-colophon";

const root = process.cwd();
const resumePath = path.join(root, "src", "data", "resume.json");
const publicPdfPath = path.join(root, "public", "resume.pdf");
const tempHtmlDir = await mkdtemp(path.join(os.tmpdir(), "david-mn-resume-html-"));
const tempHtmlPath = path.join(tempHtmlDir, "resume.html");

const resume = JSON.parse(await readFile(resumePath, "utf8"));
const html = render(resume);
await writeFile(tempHtmlPath, html, "utf8");

const chromePath = resolveChromePath();

if (!chromePath) {
  console.error(
    "Could not find Chrome or Chromium. Set CHROME_PATH to the browser executable path.",
  );
  process.exit(1);
}

await rm(publicPdfPath, { force: true });

const userDataDir = await mkdtemp(path.join(os.tmpdir(), "david-mn-resume-pdf-"));

try {
  await printToPdf(chromePath, userDataDir, tempHtmlPath, publicPdfPath);

  const pdf = await stat(publicPdfPath);

  if (pdf.size === 0) {
    throw new Error(`Chrome created an empty PDF at ${publicPdfPath}`);
  }

  console.log(
    `Wrote ${path.relative(root, publicPdfPath)} (${Math.round(pdf.size / 1024)} KB)`,
  );
} finally {
  await rm(userDataDir, { force: true, recursive: true });
  await rm(tempHtmlDir, { force: true, recursive: true });
}

function resolveChromePath() {
  const fromEnv = process.env.CHROME_PATH?.trim();

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
      return found.stdout.trim().split("\n")[0];
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

async function printToPdf(chromePath, userDataDir, htmlPath, pdfPath) {
  const args = [
    "--headless=new",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-first-run",
    "--no-sandbox",
    "--noerrdialogs",
    "--no-pdf-header-footer",
    "--print-to-pdf-no-header",
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ];

  const child = spawn(chromePath, args, { stdio: "ignore" });

  const closeResult = new Promise((resolve) => {
    child.on("error", (error) => resolve({ type: "error", error }));
    child.on("close", (code, signal) =>
      resolve({ type: "close", code, signal }),
    );
  });

  const firstResult = await Promise.race([
    closeResult,
    waitForStablePdf().then(
      () => ({ type: "pdf-ready" }),
      (error) => ({ type: "pdf-error", error }),
    ),
    delay(45_000).then(() => ({ type: "timeout" })),
  ]);

  if (firstResult.type === "error") {
    throw firstResult.error;
  }

  if (firstResult.type === "timeout") {
    await stopChrome(child, closeResult);
    throw new Error("Chrome timed out while printing the PDF.");
  }

  if (firstResult.type === "pdf-error") {
    await stopChrome(child, closeResult);
    throw firstResult.error;
  }

  if (firstResult.type === "pdf-ready") {
    await stopChrome(child, closeResult);
    return;
  }

  if (firstResult.code !== 0) {
    throw new Error(
      `Chrome exited with code ${firstResult.code}${
        firstResult.signal ? ` and signal ${firstResult.signal}` : ""
      }.`,
    );
  }
}

async function waitForStablePdf() {
  let previousSize = -1;
  let stableChecks = 0;

  for (let elapsed = 0; elapsed < 30_000; elapsed += 500) {
    try {
      const pdf = await stat(publicPdfPath);

      if (pdf.size > 0 && pdf.size === previousSize) {
        stableChecks += 1;

        if (stableChecks >= 2) {
          return;
        }
      } else {
        stableChecks = 0;
      }

      previousSize = pdf.size;
    } catch {
      previousSize = -1;
      stableChecks = 0;
    }

    await delay(500);
  }

  throw new Error(`Chrome did not create a stable PDF at ${publicPdfPath}.`);
}

async function stopChrome(child, closeResult) {
  if (child.killed || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  const stopped = await Promise.race([
    closeResult.then(() => true),
    delay(5_000).then(() => false),
  ]);

  if (!stopped && child.exitCode === null) {
    child.kill("SIGKILL");
    await closeResult;
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, ms);
    timeout.unref?.();
  });
}
