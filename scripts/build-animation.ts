import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const animationDirectory = resolve(sourceDirectory, "../animation");

async function sources() {
  const [document, css, timeline, gsap, textPlugin] = await Promise.all([
    readFile(resolve(animationDirectory, "index.html"), "utf8"),
    readFile(resolve(animationDirectory, "setup.css"), "utf8"),
    readFile(resolve(animationDirectory, "setup.js"), "utf8"),
    readFile(require.resolve("gsap/dist/gsap.min.js"), "utf8"),
    readFile(require.resolve("gsap/dist/TextPlugin.min.js"), "utf8")
  ]);
  return { document, css, timeline, gsap, textPlugin };
}

const outputDirectory = resolve(sourceDirectory, "../dist/marketing-animation");
const animation = await sources();
await mkdir(resolve(outputDirectory, "assets"), { recursive: true });
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
