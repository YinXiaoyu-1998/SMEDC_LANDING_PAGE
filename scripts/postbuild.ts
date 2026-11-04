import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const outputDirectory = resolve(process.cwd(), "dist/marketing");
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

for (const file of await htmlFiles(outputDirectory)) {
  const html = await readFile(file, "utf8");
  if (faviconPattern.test(html) || !/<head\b[^>]*>/i.test(html)) continue;
  const href = relative(dirname(file), resolve(outputDirectory, "assets/logo.png"))
    .split(sep)
    .join("/");
  await writeFile(
    file,
    html.replace(
      /<head\b[^>]*>/i,
      (head) => `${head}\n    <link rel="icon" type="image/png" href="${href}" />`
    )
  );
}

const index = await readFile(resolve(outputDirectory, "index.html"));
const revision = createHash("sha256").update(index).digest("hex").slice(0, 16);
await writeFile(resolve(outputDirectory, "version.json"), JSON.stringify({ revision }) + "\n");
