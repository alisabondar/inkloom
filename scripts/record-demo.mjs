// Records the README demo by clicking through a running Inkloom: home → create → concept → workspace.
// Run it against the dev server with the dev sign-in bypass on (DEV_AUTH_BYPASS=true in .env.local):
//   npm run dev                # in one terminal (port 3000)
//
// By default the demo generates four AI concepts and shows each one before picking, so it needs an
// image provider key, uses 4 of the hourly quota, and differs every take. --offline uses a
// reference photo (public/landscape-painting.png) as the concept instead: no AI call, the same
// every time. --photo <path> picks a different photo and implies --offline.
//
// Recorded here (default): a headless browser, captured frame by frame into docs/demo.mp4.
// Needs ffmpeg on PATH.
//   node scripts/record-demo.mjs [http://localhost:3000]
//
// Presenter mode (--present): plays the same walkthrough in a visible Chrome window using the
// real mouse pointer, for screen recorders like Screen Studio whose zoom and cursor effects
// follow real clicks. Needs cliclick (brew install cliclick) and Accessibility permission for
// the terminal you run it from. Start recording the window during the countdown.
//   node scripts/record-demo.mjs --present [--countdown 5] [http://localhost:3000]
// --dry-run with --present checks the pointer positions headlessly without moving the pointer.
//
// Each take saves a real (private) template to the dev account; delete old takes from My projects.
// GitHub only plays a video inline when it's uploaded: drag docs/demo.mp4 into the README editor on github.com.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const PRESENT = flag("--present");
const DRY_RUN = flag("--dry-run");
const VERBOSE = flag("--verbose");
const USE_AI = !flag("--offline") && !flag("--photo");
const COUNTDOWN_S = Number(option("--countdown", 5)) || 0;
const PHOTO = resolve(option("--photo", "public/landscape-painting.png"));
const VALUED = ["--countdown", "--photo"];
const BASE = (args.find((arg, index) => !arg.startsWith("--") && !VALUED.includes(args[index - 1])) ?? "http://localhost:3000").replace(/\/$/, "");
const IDEA = "A wreath of wildflowers and fern leaves";
const MEDIUM = "Embroidery";
const TITLE = "Wildflower wreath";
// Presenter window, in screen points: a 16:10 window that Screen Studio can frame.
const WINDOW = { x: 60, y: 40, width: 1440, height: 900 };
const REAL_POINTER = PRESENT && !DRY_RUN;
if (!PRESENT && spawnSync("ffmpeg", ["-version"]).status !== 0) throw new Error("ffmpeg is needed on PATH.");
if (REAL_POINTER && spawnSync("cliclick", ["-V"]).status !== 0) throw new Error("cliclick is needed: brew install cliclick");
// cliclick still exits 0 without Accessibility permission (it only prints a warning and does
// nothing), so check for that up front instead of playing a demo where no click lands.
if (REAL_POINTER) {
  const probe = spawnSync("cliclick", ["p"], { encoding: "utf8" });
  if (/Accessibility privileges not enabled/i.test(`${probe.stderr}${probe.stdout}`)) {
    const app = { Apple_Terminal: "Terminal", "iTerm.app": "iTerm", vscode: "your editor (VS Code / Cursor)", WarpTerminal: "Warp", ghostty: "Ghostty" }[process.env.TERM_PROGRAM] ?? "the app this terminal runs in";
    console.error(`The pointer can't be moved yet: ${app} needs Accessibility permission.
  System Settings → Privacy & Security → Accessibility → turn on ${app} (add it with + if it isn't listed).
  Then quit and reopen ${app}, and run this again.`);
    process.exit(1);
  }
}
// Moves or clicks the real pointer (presenter mode); a no-op in dry runs.
const cliclick = (...commands) => {
  if (DRY_RUN) return;
  const out = spawnSync("cliclick", ["-e", "350", ...commands]);
  if (out.status !== 0) throw new Error(`cliclick failed: ${out.stderr}`);
};
// Recorded output is 2240x1400; at 1.5x zoom the page lays out at ~1493x933 CSS pixels, the same
// space the presenter window has. Presenter mode stays at 1x and lets the screen recorder zoom.
const [OUT_W, OUT_H, ZOOM] = PRESENT ? [WINDOW.width, WINDOW.height, 1] : [2240, 1400, 1.5];
const MIN_FRAME_MS = 16;

let browser;
let page;
if (PRESENT && !DRY_RUN) {
  // A real Chrome-style app window (no address bar or "controlled by automation" banner).
  const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "inkloom-present-")), {
    headless: false,
    viewport: null,
    colorScheme: "light",
    ignoreDefaultArgs: ["--enable-automation"],
    args: [`--app=${BASE}/`, `--window-position=${WINDOW.x},${WINDOW.y}`, `--window-size=${WINDOW.width},${WINDOW.height}`],
  });
  browser = context;
  page = context.pages()[0] ?? (await context.newPage());
} else {
  browser = await chromium.launch();
  // Headless screencast ignores deviceScaleFactor, so render at CSS zoom in a 2x-sized window.
  // A dry run uses the presenter window's size so pointer positions match a real take.
  const size = DRY_RUN ? { width: WINDOW.width, height: WINDOW.height } : { width: OUT_W, height: OUT_H };
  // Clipboard access so the copy buttons show "copied ✓" on camera.
  page = await browser.newPage({ viewport: size, colorScheme: "light", permissions: ["clipboard-read", "clipboard-write"] });
}
await page.context().addInitScript((z) => document.addEventListener("DOMContentLoaded", () => {
  if (z !== 1) document.documentElement.style.zoom = String(z);
  // The recorder eases its own scrolls, so jump each frame instead of smooth-scrolling.
  document.documentElement.style.scrollBehavior = "auto";
  // Hide the Next.js dev overlay (issue badge, route indicator) from the recording.
  const style = document.createElement("style");
  style.textContent = "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }";
  document.head.append(style);
}), ZOOM);

// Warm up every route first, so Turbopack compiles don't stutter the recording. The bogus ids
// only need to reach the route; the workspace's worker chunk compiles on the first real visit.
const BOGUS = "00000000-0000-4000-8000-000000000000";
for (const path of [`/t/${BOGUS}`, `/create/concepts?batch=${BOGUS}&ids=${BOGUS}`, `/create?medium=acrylic&idea=warm`, "/"]) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
// The dev bypass signs every request in; without it /create shows a sign-in card.
await page.goto(`${BASE}/create`);
if (await page.getByRole("radiogroup", { name: "Medium" }).count() === 0) {
  console.error("Not signed in: set DEV_AUTH_BYPASS=true in .env.local and restart the dev server.");
  await browser.close();
  process.exit(1);
}
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const raw = [];
let cdp = null;
if (PRESENT) {
  for (let left = COUNTDOWN_S; left > 0; left -= 1) {
    console.log(`Starting in ${left}… (start recording the Inkloom window now)`);
    await page.waitForTimeout(1000);
  }
  // macOS hands the first click on an inactive window to "activate it", not to the page.
  // Bring the window forward and click an empty spot below the hero first.
  await page.bringToFront();
  const blank = await page.evaluate(() => ({
    x: Math.round(window.screenX + (window.outerWidth - window.innerWidth) / 2 + window.innerWidth * 0.5),
    y: Math.round(window.screenY + (window.outerHeight - window.innerHeight) + 24),
  }));
  cliclick(`m:${blank.x},${blank.y}`, "c:.");
  await page.waitForTimeout(600);
  console.log("Playing the demo. Don't touch the mouse until it finishes.");
} else {
  cdp = await page.context().newCDPSession(page);
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    raw.push({ data, t: metadata.timestamp * 1000 });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "png", maxWidth: OUT_W, maxHeight: OUT_H });
}

const wait = (ms) => page.waitForTimeout(ms);
// Eased page scroll to `top` (px, 'end', or a selector to bring near the top).
const smoothScroll = async (top, { speed = 900, min = 700, max = 2400, offset = 90 } = {}) => {
  await page.evaluate(([top, speed, min, max, offset]) => new Promise((done) => {
    const el = document.scrollingElement;
    const zoom = Number(document.documentElement.style.zoom) || 1;
    const target = typeof top === "string" && top !== "end" ? document.querySelector(top) : null;
    const to = top === "end" ? el.scrollHeight - el.clientHeight
      : target ? Math.max(0, el.scrollTop + target.getBoundingClientRect().top - offset * zoom)
      : top;
    const from = el.scrollTop;
    const dur = Math.min(max, Math.max(min, (Math.abs(to - from) / (speed * zoom)) * 1000));
    const start = performance.now();
    const curve = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.scrollTop = from + (to - from) * curve(p);
      if (p < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  }), [top, speed, min, max, offset]);
};

// ---------- the real pointer (presenter mode) ----------
// Brings an element comfortably into view if it's near or past an edge. The workspace keeps its
// panels in their own scroll areas, so this eases whichever ancestor actually scrolls.
const ensureInView = async (locator) => {
  const moved = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top >= 90 && rect.bottom <= window.innerHeight - 40) return false;
    let box = el.parentElement;
    while (box && box !== document.body && !(box.scrollHeight > box.clientHeight && /auto|scroll/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
    const scroller = !box || box === document.body ? document.scrollingElement : box;
    const delta = rect.top - window.innerHeight / 3;
    const from = scroller.scrollTop;
    const start = performance.now();
    const curve = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
    return new Promise((done) => {
      const step = (now) => {
        const p = Math.min(1, (now - start) / 700);
        scroller.scrollTop = from + delta * curve(p);
        if (p < 1) requestAnimationFrame(step);
        else done(true);
      };
      requestAnimationFrame(step);
    });
  });
  if (moved) await wait(200);
};
// Screen position (points) of an element's center: window origin + browser chrome + page offset.
const screenPoint = (locator) => locator.evaluate((el) => {
  const rect = el.getBoundingClientRect();
  return {
    x: Math.round(window.screenX + (window.outerWidth - window.innerWidth) / 2 + rect.left + rect.width / 2),
    y: Math.round(window.screenY + (window.outerHeight - window.innerHeight) + rect.top + rect.height / 2),
  };
});
const pointerPath = [];
const describe = (locator) => locator.evaluate((el) => (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40));
// Moves the real pointer onto an element, checking macOS actually let it move.
const pointAt = async (locator, verb = "move") => {
  await ensureInView(locator);
  const { x, y } = await screenPoint(locator);
  pointerPath.push(`${x},${y}`);
  if (VERBOSE) console.log(`${verb} ${x},${y}  ${await describe(locator)}`);
  const before = REAL_POINTER ? pointer() : null;
  cliclick(`m:${x},${y}`);
  await wait(140);
  if (!REAL_POINTER) return;
  // The eased move can still be settling when cliclick returns, so give it a moment to land.
  const near = ([px, py]) => Math.abs(px - x) <= 3 && Math.abs(py - y) <= 3;
  let at = pointer();
  for (let tries = 0; tries < 8 && !near(at); tries += 1) {
    await wait(60);
    at = pointer();
  }
  if (near(at)) return;
  // Never left its old spot: macOS ignored cliclick, which is the permission problem.
  if (before && at[0] === before[0] && at[1] === before[1]) {
    throw new Error(`The pointer didn't move from ${at}: macOS is blocking cliclick. Check Accessibility permission for this terminal app.`);
  }
  // It moved but landed elsewhere (still easing, or the trackpad was touched): snap it there.
  spawnSync("cliclick", [`m:${x},${y}`]);
  await wait(80);
  at = pointer();
  if (!near(at)) throw new Error(`The pointer is at ${at}, not ${x},${y}. Keep hands off the mouse and trackpad while the demo plays.`);
};
// The real pointer's position, in screen points.
const pointer = () => spawnSync("cliclick", ["p"], { encoding: "utf8" }).stdout.trim().split(",").map(Number);
const realClick = async (locator) => {
  await pointAt(locator, "click");
  cliclick("c:.");
  // In a dry run nothing really clicks, so let Playwright click instead.
  if (DRY_RUN) await locator.click();
};

const press = async (locator) => {
  if (PRESENT) return realClick(locator);
  await locator.click();
};
// Types into a field: a real click to focus it in presenter mode, then the keys.
const type = async (locator, text, delay) => {
  if (PRESENT) {
    await realClick(locator);
    await page.keyboard.type(text, { delay });
  } else {
    await locator.pressSequentially(text, { delay });
  }
};
// Drags a range input from one fraction of its track to another, so the value visibly sweeps.
const drag = async (slider, fromFraction, toFraction, ms) => {
  if (PRESENT) {
    await ensureInView(slider);
    const geo = await slider.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: window.screenX + (window.outerWidth - window.innerWidth) / 2 + rect.left + 8,
        width: rect.width - 16,
        y: Math.round(window.screenY + (window.outerHeight - window.innerHeight) + rect.top + rect.height / 2),
      };
    });
    const at = (f) => `${Math.round(geo.left + geo.width * f)},${geo.y}`;
    pointerPath.push(`${at(fromFraction)} → ${at(toFraction)}`);
    if (VERBOSE) console.log(`drag ${at(fromFraction)} → ${at(toFraction)}  ${await describe(slider)}`);
    cliclick(`m:${at(fromFraction)}`);
    await wait(120);
    cliclick(`dd:${at(fromFraction)}`);
    await wait(120);
    const steps = Math.round(ms / 60);
    for (let i = 1; i <= steps; i += 1) {
      if (REAL_POINTER) spawnSync("cliclick", ["dm:" + at(fromFraction + ((toFraction - fromFraction) * i) / steps)]);
      await wait(60);
    }
    cliclick(`du:${at(toFraction)}`);
    if (DRY_RUN) await slider.fill(String(Math.round(toFraction * Number(await slider.getAttribute("max")))));
    return;
  }
  const box = await slider.boundingBox();
  const y = box.y + box.height / 2;
  const x = (f) => box.x + 8 + (box.width - 16) * f;
  await page.mouse.move(x(fromFraction), y);
  await page.mouse.down();
  const steps = Math.round(ms / 40);
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(x(fromFraction + ((toFraction - fromFraction) * i) / steps), y);
    await wait(40);
  }
  await page.mouse.up();
};
// The workspace redraws in a Web Worker and shows "redrawing…" meanwhile; hold until it's done.
const settled = async (extra = 0) => {
  await wait(200);
  await page.getByText("redrawing…").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
  if (extra) await wait(extra);
};

// ---------- Home: the idea goes in the hero prompt ----------
await wait(1600);
await smoothScroll("end", { speed: 700 });
await wait(1400);
await smoothScroll(0, { speed: 900 });
await wait(700);
await type(page.locator("#idea"), IDEA, 70);
await wait(500);
await press(page.getByRole("button", { name: "Start a piece →" }));

// ---------- Create: medium, then the idea and a reference photo ----------
await page.getByRole("radiogroup", { name: "Medium" }).waitFor();
await wait(1000);
await press(page.getByRole("radio", { name: new RegExp(`^${MEDIUM}`) }));
await wait(700);
await press(page.getByRole("button", { name: "Next: describe it →" }));
await page.locator("#create-idea").waitFor();
await wait(900);
await press(page.getByRole("button", { name: "+ simple bold shapes" }));
await wait(700);
await type(page.locator("#create-title"), TITLE, 90);
await wait(500);
if (USE_AI) {
  await press(page.getByRole("button", { name: "Generate 4 concepts" }));
} else {
  // A file chooser is a native dialog the recorder would catch, so point at the field and attach
  // the photo directly; the preview appears as if picked.
  const photoField = page.locator("#create-photo");
  if (PRESENT) await pointAt(photoField);
  await photoField.setInputFiles(PHOTO);
  await wait(1400);
  await press(page.getByRole("button", { name: "Use my photo as the concept" }));
}

// ---------- Concepts: pick one, choose a difficulty, keep it ----------
// The create form shows an error instead of moving on when, say, the hourly concept limit is hit.
const formError = page.locator("main [role=alert]").first();
const outcome = await Promise.race([
  page.waitForURL(/\/create\/concepts/, { timeout: 30000 }).then(() => "concepts"),
  formError.waitFor({ timeout: 30000 }).then(() => "error"),
]);
if (outcome === "error") {
  console.error(`The create form said: ${(await formError.textContent()).trim()}
  Raise GENERATE_RATE_LIMIT_PER_HOUR in .env.local (and restart the dev server), wait, or run with --offline.`);
  await browser.close();
  process.exit(1);
}
let concept;
if (USE_AI) {
  // Hold on the progress list while the four concepts paint in, then look at each in turn.
  const done = await Promise.race([
    page.getByText("take your pick").waitFor({ timeout: 180000 }).then(() => "ready"),
    page.getByText("None of the concepts could be painted.").waitFor({ timeout: 180000 }).then(() => "failed"),
  ]);
  if (done === "failed") throw new Error("No concepts could be painted (check the image provider keys and quota), or run with --offline.");
  const ready = page.getByRole("button", { name: /^Concept \d/ });
  await ready.locator("img").evaluateAll((imgs) => Promise.all(imgs.map((img) => img.complete || new Promise((ok) => { img.onload = img.onerror = ok; }))));
  await wait(1400);
  for (let i = 0; i < (await ready.count()); i += 1) {
    if (PRESENT) await pointAt(ready.nth(i));
    else await ready.nth(i).hover();
    await wait(900);
  }
  // Pick Concept 3 if it painted, else the first one that did.
  const third = page.getByRole("button", { name: /^Concept 3/ });
  concept = (await third.count()) ? third : ready.first();
} else {
  concept = page.getByRole("button", { name: /^Concept 1/ });
  await concept.waitFor({ timeout: 20000 });
  await concept.locator("img").evaluate((img) => img.complete || new Promise((ok) => { img.onload = img.onerror = ok; }));
  await wait(1600);
}
await press(concept);
await wait(900);
await press(page.getByRole("button", { name: "intermediate" }));
await wait(700);
await press(page.getByRole("button", { name: "Use this concept →" }));

// ---------- Workspace: layers, presets, fine-tuning, the plan ----------
await page.waitForURL(/\/t\/[0-9a-f-]+/, { timeout: 30000 });
const sheet = page.getByRole("img", { name: /visible$/ });
await sheet.locator("img").first().waitFor({ timeout: 30000 });
await settled(2000);
// Build the sheet up layer by layer, then peel it back to the line art.
for (const layer of ["Values", "Colour ref"]) {
  await press(page.getByRole("button", { name: layer, exact: true }));
  await settled(1500);
}
for (const layer of ["Colour ref", "Values"]) {
  await press(page.getByRole("button", { name: layer, exact: true }));
  await settled(1000);
}
// The preset cards redraw the sketch with more or less detail.
for (const preset of ["Detailed", "Simple", "Balanced"]) {
  await press(page.getByRole("button", { name: new RegExp(`^${preset}`) }));
  await settled(1500);
}
// Fine-tune: sweep the detail slider, then a few exact steps.
await press(page.getByRole("button", { name: /^Fine-tune/ }));
await wait(900);
const detail = page.locator("#ws-detail");
await drag(detail, 0.5, 1, 1200);
await settled(1200);
await drag(detail, 1, 0.5, 1000);
await settled(1000);
await press(page.getByRole("button", { name: "Increase shading" }));
await settled(1000);
for (let i = 0; i < 2; i += 1) {
  await press(page.getByRole("button", { name: /^Increase (paints|threads)$/ }));
  await settled(800);
}
for (let i = 0; i < 3; i += 1) {
  await press(page.getByRole("button", { name: "Increase grid" }));
  await wait(700);
}
// A bigger hoop takes longer: the estimate follows the size.
for (let i = 0; i < 2; i += 1) {
  await press(page.getByRole("button", { name: "Increase size" }));
  await wait(900);
}
await wait(800);
// The thread list: DMC numbers that link to the shop, and a one-click copy.
const threads = page.getByRole("button", { name: /^Copy (DMC|the shopping list)/ });
if (await threads.count()) {
  await threads.nth(1).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
  await wait(1400);
  await press(threads.nth(1));
  await wait(1200);
  await press(page.getByRole("button", { name: "Copy the shopping list" }));
  await wait(1400);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await wait(1200);
}
// The generated project plan, which copies as text too, then back to the finished sheet.
await press(page.getByRole("tab", { name: "Plan" }));
await wait(1500);
await press(page.getByRole("button", { name: "Copy the plan as text" }));
await wait(1200);
const lastStep = page.locator("ol li").last();
if (await lastStep.count()) {
  await lastStep.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
  await wait(2200);
}
await press(page.getByRole("tab", { name: "Sheet" }));
await wait(1600);
// End on My projects: the template is already saved there, with no save button to press.
await page.getByRole("status").filter({ hasText: "saved ✓" }).waitFor({ timeout: 10000 }).catch(() => {});
// The breadcrumb's link, not the site header's (the breadcrumb comes later on the page).
await press(page.getByRole("link", { name: "My projects", exact: true }).last());
await page.waitForURL(/\/projects/);
await page.getByText(TITLE).first().waitFor();
// Thumbnails load lazily; hold until they're painted so the last shot isn't blank cards.
await page.locator("main img").evaluateAll((imgs) => Promise.all(imgs.map((img) => {
  img.loading = "eager";
  return img.complete && img.naturalWidth ? null : new Promise((ok) => { img.onload = img.onerror = ok; });
})));
await page.evaluate(() => document.fonts.ready);
await wait(2800);

if (PRESENT) {
  await wait(1200);
  console.log(DRY_RUN
    ? `Dry run done: ${pointerPath.length} pointer moves, e.g. ${pointerPath.slice(0, 4).join(" | ")}`
    : "Demo finished. Stop the recording.");
  await browser.close();
  process.exit(0);
}
await cdp.send("Page.stopScreencast");
const end = raw.at(-1).t + 1200;
await browser.close();

// Keep at most one frame per MIN_FRAME_MS; each frame lasts until the next kept one.
const kept = [];
for (const f of raw) if (!kept.length || f.t - kept.at(-1).t >= MIN_FRAME_MS) kept.push(f);
const duration = (i) => Math.max(MIN_FRAME_MS, (kept[i + 1]?.t ?? end) - kept[i].t) / 1000;

// ffmpeg's concat demuxer plays each PNG for its real duration, resampled to a steady 60 fps.
const dir = mkdtempSync(join(tmpdir(), "inkloom-demo-"));
const list = kept.map((f, i) => {
  writeFileSync(join(dir, `${i}.png`), Buffer.from(f.data, "base64"));
  return `file '${i}.png'\nduration ${duration(i).toFixed(4)}`;
});
writeFileSync(join(dir, "list.txt"), `${list.join("\n")}\nfile '${kept.length - 1}.png'\n`);
mkdirSync("docs", { recursive: true });
const out = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"),
  "-vf", "fps=60,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "stillimage", "-movflags", "+faststart", "docs/demo.mp4"], { stdio: "inherit" });
rmSync(dir, { recursive: true, force: true });
if (out.status !== 0) throw new Error("ffmpeg failed");
console.log(`docs/demo.mp4: ${kept.length} frames (${raw.length} captured), ${((end - kept[0].t) / 1000).toFixed(1)}s, ${OUT_W}x${OUT_H}, ${(statSync("docs/demo.mp4").size / 1e6).toFixed(1)} MB`);
