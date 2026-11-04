import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { clientSource } from "./client.js";
import { setupPlayerSource } from "./setup-player.js";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const animationDirectory = resolve(sourceDirectory, "../animation");

async function animationSources() {
  const [document, css, timeline, gsap, textPlugin] = await Promise.all([
    readFile(resolve(animationDirectory, "index.html"), "utf8"),
    readFile(resolve(animationDirectory, "setup.css"), "utf8"),
    readFile(resolve(animationDirectory, "setup.js"), "utf8"),
    readFile(require.resolve("gsap/dist/gsap.min.js"), "utf8"),
    readFile(require.resolve("gsap/dist/TextPlugin.min.js"), "utf8")
  ]);
  const markup = document
    .split("<!-- setup-demo:start -->")[1]
    ?.split("<!-- setup-demo:end -->")[0];
  if (!markup) throw new Error("The setup composition is missing its embed markers.");
  return { document, markup, css, timeline, gsap, textPlugin };
}

const faviconPattern = /<link\b[^>]*\brel\s*=\s*["'][^"']*\bicon\b[^"']*["'][^>]*>/i;

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

// Every page under the marketing site gets the brand favicon, including pages added later.
export async function ensureFavicons(outputDirectory: string): Promise<void> {
  const root = resolve(outputDirectory);
  for (const file of await htmlFiles(root)) {
    const html = await readFile(file, "utf8");
    if (faviconPattern.test(html) || !/<head\b[^>]*>/i.test(html)) continue;
    const href = relative(dirname(file), resolve(root, "assets/logo.png")).split(sep).join("/");
    await writeFile(
      file,
      html.replace(
        /<head\b[^>]*>/i,
        (head) => `${head}\n    <link rel="icon" type="image/png" href="${href}" />`
      )
    );
  }
}

export async function buildSite(outputDirectory: string): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  await cp(resolve(sourceDirectory, "../public"), outputDirectory, { recursive: true });
  const animation = await animationSources();
  const html = (await readFile(resolve(sourceDirectory, "index.html"), "utf8")).replace(
    "__SETUP_DEMO__",
    animation.markup
  );
  const css =
    (await readFile(resolve(sourceDirectory, "styles.css"), "utf8")) + "\n" + animation.css;
  const client = [
    animation.gsap,
    animation.textPlugin,
    animation.timeline,
    clientSource,
    setupPlayerSource
  ].join("\n");
  const revision = createHash("sha256")
    .update(html)
    .update(css)
    .update(client)
    .digest("hex")
    .slice(0, 16);
  await Promise.all([
    writeFile(resolve(outputDirectory, "index.html"), html.replaceAll("__REVISION__", revision)),
    writeFile(resolve(outputDirectory, "styles.css"), css),
    writeFile(resolve(outputDirectory, "client.js"), client),
    writeFile(resolve(outputDirectory, "version.json"), JSON.stringify({ revision }) + "\n")
  ]);
  await ensureFavicons(outputDirectory);
}

// A standalone HyperFrames project reuses the exact markup, styles and timeline shipped in the page.
export async function buildSetupComposition(outputDirectory: string): Promise<void> {
  const animation = await animationSources();
  await mkdir(resolve(outputDirectory, "assets"), { recursive: true });
  // HyperFrames static validation discovers the registered timeline in its HTML entrypoint.
  const document = animation.document.replace(
    '<script src="./setup.js"></script>',
    `<script>${animation.timeline}</script>`
  );
  await writeFile(resolve(outputDirectory, "index.html"), document);
  await writeFile(resolve(outputDirectory, "setup.css"), animation.css);
  await writeFile(resolve(outputDirectory, "setup.js"), animation.timeline);
  await writeFile(resolve(outputDirectory, "gsap.min.js"), animation.gsap);
  await writeFile(resolve(outputDirectory, "TextPlugin.min.js"), animation.textPlugin);
  for (const name of ["agent-codex.png", "check-circle.svg", "arrow-up-right.svg"]) {
    await cp(
      resolve(sourceDirectory, "../public/assets", name),
      resolve(outputDirectory, "assets", name)
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildSite(resolve(sourceDirectory, "../dist/marketing"));
  await buildSetupComposition(resolve(sourceDirectory, "../dist/marketing-animation"));
}
