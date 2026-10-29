import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (file) => readFile(join(root, file), "utf8");
const sessions = JSON.parse(await read("public/sessions.json")).sessions;

test("agenda records have unique ids, valid times, and direct catalog links", () => {
  assert.equal(sessions.length, 21);
  assert.equal(new Set(sessions.map((session) => session.id)).size, sessions.length);
  assert.equal(sessions.filter((session) => session.group === "plan").length, 15);
  for (const session of sessions) {
    assert.match(session.catalogId, /^[A-Za-z0-9]+$/u);
    assert.match(session.day, /^2026-10-(28|29)$/u);
    assert.match(session.start, /^\d{1,2}:\d{2} (AM|PM)$/u);
    assert.match(session.end, /^\d{1,2}:\d{2} (AM|PM)$/u);
    assert.ok(["plan", "optional", "swap"].includes(session.group));
    assert.ok(session.title && session.venue && session.why);
  }
});

test("the React app keeps the catalog action, local storage, and manual availability choices", async () => {
  const [html, app, serviceWorker, manifest, components, packageJson] = await Promise.all([
    read("index.html"),
    read("src/App.tsx"),
    read("public/service-worker.js"),
    read("public/manifest.webmanifest"),
    read("components.json"),
    read("package.json"),
  ]);
  const componentConfig = JSON.parse(components);
  const packageConfig = JSON.parse(packageJson);
  assert.match(html, /manifest\.webmanifest/u);
  assert.match(html, /src\/main\.tsx/u);
  assert.match(app, /my-agenda\//u);
  assert.match(app, /"Full"/u);
  assert.match(app, /"Standby"/u);
  assert.match(app, /universe-checklist\.v1/u);
  assert.match(app, /search\.curatedagenda=1790773278100004cDIo/u);
  assert.match(app, /@\/components\/ui\/card/u);
  assert.match(app, /lucide-react/u);
  assert.match(serviceWorker, /sessions\.json/u);
  assert.match(serviceWorker, /assets\/app\.js/u);
  assert.match(serviceWorker, /assets\/app\.css/u);
  assert.equal(componentConfig.iconLibrary, "lucide");
  assert.equal(packageConfig.scripts.typecheck, "tsc --noEmit");
  assert.equal(JSON.parse(manifest).display, "standalone");
});

test("the Universe treatment keeps working controls without sports styling or official marks", async () => {
  const [app, styles] = await Promise.all([read("src/App.tsx"), read("src/styles.css")]);
  assert.match(styles, /font-family: "Mona Sans Variable"/u);
  assert.match(styles, /--primary: #08872b/u);
  assert.match(styles, /--background: #e4ebe6/u);
  assert.doesNotMatch(styles, /ticket-shape|#c1ff46|Impact/u);
  assert.match(styles, /\.bottom-nav \{ position: fixed/u);
  assert.match(app, /aria-label="Checked sessions"/u);
  assert.match(app, /aria-label="Likely replays"/u);
  assert.match(app, /aria-label="Search sessions"/u);
  assert.match(app, /<details className="session-details">/u);
  assert.match(app, /Not affiliated with or endorsed by GitHub/u);
});

test("the standalone package and offline assets are self-contained", async () => {
  const [packageJson, worker, license, styles, vite] = await Promise.all([
    read("package.json"), read("public/service-worker.js"),
    read("public/fonts/OFL.txt"), read("src/styles.css"), read("vite.config.ts"),
  ]);
  const config = JSON.parse(packageJson);
  assert.equal(config.name, "universe-checklist");
  assert.equal(config.packageManager, "bun@1.4.0");
  assert.doesNotMatch(packageJson, /workspace:|@work-os\//u);
  assert.match(worker, /\/assets\/app\.css/u);
  assert.equal(config.dependencies["@fontsource-variable/mona-sans"], "5.3.0");
  assert.match(styles, /@fontsource-variable\/mona-sans\/index\.css/u);
  assert.match(vite, /assetsInlineLimit: 200_000/u);
  assert.match(license, /SIL OPEN FONT LICENSE/u);
});

test("agenda rationale serves platform engineers rather than sales engagements", async () => {
  const app = await read("src/App.tsx");
  assert.match(app, /Your platform engineering track/u);
  for (const session of sessions) {
    assert.doesNotMatch(session.why, /\bcustomers?\b|\bbake-off\b|\bsales\b/iu);
  }
});
