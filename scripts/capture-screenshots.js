import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import puppeteer from "puppeteer";

const rootDir = process.cwd();
const screenshotsDir = path.join(rootDir, "screenshots");
const baseUrl = process.env.SCREENSHOT_BASE_URL || `http://127.0.0.1:${process.env.CLIENT_PORT || "5173"}`;
const authEmail = process.env.TEAMFLOW_EMAIL || "";
const authPassword = process.env.TEAMFLOW_PASSWORD || "";

const desktopViewport = { width: 1440, height: 900, deviceScaleFactor: 1 };
const mobileViewport = {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

const captures = [
  {
    file: "auth-login.png",
    label: "Login Page",
    route: "/sign-in",
    viewport: desktopViewport,
    authenticated: false,
    selector: "[data-clerk-component], form",
  },
  {
    file: "auth-signup.png",
    label: "Signup Page",
    route: "/sign-up",
    viewport: desktopViewport,
    authenticated: false,
    selector: "[data-clerk-component], form",
  },
  {
    file: "dashboard.png",
    label: "Dashboard Overview",
    route: "/dashboard",
    viewport: desktopViewport,
    authenticated: true,
    selector: "main, h1",
  },
  {
    file: "projects.png",
    label: "Projects Grid View",
    route: "/projects",
    viewport: desktopViewport,
    authenticated: true,
    selector: "main, h1",
  },
  {
    file: "kanban.png",
    label: "Kanban Board",
    route: "/projects/{projectId}",
    viewport: desktopViewport,
    authenticated: true,
    selector: "main, h1",
  },
  {
    file: "team.png",
    label: "Team Management",
    route: "/projects/{projectId}/members",
    viewport: desktopViewport,
    authenticated: true,
    selector: "main, h1",
  },
  {
    file: "mobile-dashboard.png",
    label: "Mobile Dashboard",
    route: "/dashboard",
    viewport: mobileViewport,
    authenticated: true,
    selector: "main, h1",
  },
];

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForStablePage(page, selector) {
  await page.waitForNetworkIdle({ idleTime: 750, timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => document.fonts?.ready, { timeout: 5000 }).catch(() => {});
  if (selector) {
    await page.waitForSelector(selector, { timeout: 8000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function gotoRoute(page, route, selector) {
  await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await waitForStablePage(page, selector);
}

async function isOnAuthPage(page) {
  const url = page.url();
  if (url.includes("/sign-in") || url.includes("/sign-up")) {
    return true;
  }

  const text = await page.evaluate(() => document.body?.innerText || "");
  return /welcome back|create a workspace|secure authentication/i.test(text);
}

async function signInIfPossible(page) {
  if (!authEmail || !authPassword) {
    return false;
  }

  await gotoRoute(page, "/sign-in", "[data-clerk-component], form");

  const emailInput = await page.$('input[name="identifier"], input[type="email"]');
  const passwordInput = await page.$('input[name="password"], input[type="password"]');
  const submitButton = await page.$('button[type="submit"]');

  if (!emailInput || !passwordInput || !submitButton) {
    return false;
  }

  await emailInput.click({ clickCount: 3 });
  await emailInput.type(authEmail, { delay: 20 });
  await passwordInput.click({ clickCount: 3 });
  await passwordInput.type(authPassword, { delay: 20 });

  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }),
    submitButton.click(),
  ]);

  await waitForStablePage(page, "body");
  return !(await isOnAuthPage(page));
}

async function resolveFirstProjectId(page) {
  await gotoRoute(page, "/projects", "body");
  const projectHref = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href^="/projects/"]'));
    const match = links
      .map((link) => link.getAttribute("href") || "")
      .find((href) => /^\/projects\/\d+$/.test(href));
    return match || "";
  });

  const match = projectHref.match(/^\/projects\/(\d+)$/);
  return match?.[1] || "";
}

async function createPlaceholder(browser, capture, reason) {
  const page = await browser.newPage();
  await page.setViewport(capture.viewport);

  const width = capture.viewport.width;
  const height = capture.viewport.height;
  const isMobile = width <= 480;

  await page.setContent(
    `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style>
          :root {
            color-scheme: dark;
            --bg: #0f172a;
            --panel: rgba(15, 23, 42, 0.78);
            --line: rgba(148, 163, 184, 0.24);
            --muted: #cbd5e1;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: ${width}px;
            height: ${height}px;
            font-family: Inter, Arial, sans-serif;
            background:
              radial-gradient(circle at top left, rgba(96, 165, 250, 0.28), transparent 30%),
              radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.24), transparent 32%),
              linear-gradient(135deg, #020617 0%, #0f172a 55%, #111827 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${isMobile ? "24px" : "40px"};
          }
          .frame {
            width: 100%;
            height: 100%;
            border-radius: ${isMobile ? "28px" : "36px"};
            border: 1px solid var(--line);
            background: var(--panel);
            backdrop-filter: blur(18px);
            padding: ${isMobile ? "24px" : "40px"};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 32px 80px rgba(15, 23, 42, 0.42);
          }
          .eyebrow {
            display: inline-flex;
            width: fit-content;
            padding: 10px 14px;
            border-radius: 999px;
            border: 1px solid var(--line);
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 11px;
            font-weight: 700;
          }
          h1 {
            margin: 20px 0 10px;
            font-size: ${isMobile ? "34px" : "56px"};
            line-height: 1.02;
            letter-spacing: -0.04em;
          }
          p {
            margin: 0;
            max-width: ${isMobile ? "100%" : "720px"};
            color: var(--muted);
            font-size: ${isMobile ? "15px" : "18px"};
            line-height: 1.75;
          }
          .cards {
            display: grid;
            grid-template-columns: ${isMobile ? "1fr" : "repeat(3, 1fr)"};
            gap: 16px;
            margin-top: 28px;
          }
          .card {
            min-height: ${isMobile ? "96px" : "128px"};
            border-radius: 24px;
            border: 1px solid var(--line);
            background: rgba(15, 23, 42, 0.68);
            padding: 18px;
          }
          .card strong {
            display: block;
            font-size: ${isMobile ? "14px" : "16px"};
            margin-bottom: 8px;
          }
          .card span {
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
          }
          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
          }
        </style>
      </head>
      <body>
        <div class="frame">
          <div>
            <div class="eyebrow">TeamFlow Screenshot Fallback</div>
            <h1>${capture.label}</h1>
            <p>${reason}</p>
            <div class="cards">
              <div class="card">
                <strong>Route</strong>
                <span>${capture.route.replace("{projectId}", "1")}</span>
              </div>
              <div class="card">
                <strong>Viewport</strong>
                <span>${width} x ${height}</span>
              </div>
              <div class="card">
                <strong>Status</strong>
                <span>Rendered as a placeholder because the live authenticated view could not be captured automatically.</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <span>TeamFlow</span>
            <span>Generated by scripts/capture-screenshots.js</span>
          </div>
        </div>
      </body>
    </html>`,
    { waitUntil: "load" },
  );

  await page.screenshot({
    path: path.join(screenshotsDir, capture.file),
    type: "png",
    fullPage: false,
  });
  await page.close();
}

async function main() {
  await ensureDirectory(screenshotsDir);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const status = [];

  try {
    const authPage = await browser.newPage();
    await authPage.setViewport(desktopViewport);

    let authenticated = false;
    try {
      await gotoRoute(authPage, "/dashboard", "body");
      authenticated = !(await isOnAuthPage(authPage));
      if (!authenticated) {
        authenticated = await signInIfPossible(authPage);
      }
    } catch {
      authenticated = false;
    }

    let projectId = "";
    if (authenticated) {
      try {
        projectId = await resolveFirstProjectId(authPage);
      } catch {
        projectId = "";
      }
    }

    await authPage.close();

    for (const capture of captures) {
      const page = await browser.newPage();
      await page.setViewport(capture.viewport);
      const resolvedRoute = capture.route.replace("{projectId}", projectId || "1");

      try {
        if (capture.authenticated && !authenticated) {
          throw new Error("Authentication was not available for protected routes.");
        }

        if (capture.authenticated && capture.route.includes("{projectId}") && !projectId) {
          throw new Error("No project was available to capture project-specific routes.");
        }

        await gotoRoute(page, resolvedRoute, capture.selector);

        if (capture.authenticated && (await isOnAuthPage(page))) {
          throw new Error("Protected route redirected to authentication.");
        }

        await page.screenshot({
          path: path.join(screenshotsDir, capture.file),
          type: "png",
          fullPage: false,
        });
        status.push({ file: capture.file, mode: "captured" });
      } catch (error) {
        await createPlaceholder(
          browser,
          { ...capture, route: resolvedRoute },
          error instanceof Error ? error.message : "Unknown capture failure.",
        );
        status.push({
          file: capture.file,
          mode: "placeholder",
          reason: error instanceof Error ? error.message : "Unknown capture failure.",
        });
      } finally {
        await page.close();
      }
    }

    await fs.writeFile(
      path.join(screenshotsDir, "capture-status.json"),
      JSON.stringify(
        {
          baseUrl,
          authenticated,
          generatedAt: new Date().toISOString(),
          files: status,
        },
        null,
        2,
      ),
      "utf8",
    );
  } finally {
    await browser.close();
  }

  const placeholderCount = status.filter((entry) => entry.mode === "placeholder").length;
  console.log(
    `Screenshots complete. ${status.length - placeholderCount} captured, ${placeholderCount} placeholder${placeholderCount === 1 ? "" : "s"} generated.`,
  );
}

main().catch((error) => {
  console.error("Failed to generate screenshots.");
  console.error(error);
  process.exitCode = 1;
});
