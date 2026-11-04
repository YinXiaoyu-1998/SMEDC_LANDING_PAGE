import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import guideData from "./content/guide.json";

const output = join(process.cwd(), "dist/marketing");
const read = (file: string) => readFile(join(output, file), "utf8");
const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>/i;

describe("public marketing page", () => {
  it("keeps contact, report and guide entry points without inline code", async () => {
    const html = await read("index.html");
    expect(html).toContain('href="tel:18514577162"');
    expect(html).toContain('href="mailto:consyinxy@gmail.com?subject=');
    expect(html).toContain('href="/guides/automation-user-guide.html"');
    expect(html).toContain("查看详细步骤");
    expect(html).toContain('id="report-dialog"');
    expect(html).toContain('data-composition-id="smedc-setup"');
    expect(html).toContain('id="copy-setup-prompt"');
    expect(html).toContain('class="setup-copy-button"');
    const setupRequest = html
      .match(/<p class="setup-request-text">([\s\S]*?)<\/p>/)?.[1]
      ?.replace(/\s+/g, " ")
      .trim();
    expect(setupRequest).toBe(
      "帮我安装或更新 https://github.com/YinXiaoyu-1998/smedc-mcp-skill 的核心和配套 SKILL，并按官方说明安装、配置好。完成后告诉我下一步。"
    );
    const copyIndex = html.indexOf('id="copy-setup-prompt"');
    expect(copyIndex).toBeGreaterThan(html.indexOf('class="setup-demo-heading"'));
    expect(copyIndex).toBeLessThan(html.indexOf('class="setup-demo-footer"'));
    expect(html).toContain("data-work-panel");
    expect(html.match(/data-work-panel/g)).toHaveLength(4);
    expect(html).toContain('class="site-header"');
    expect(html).toContain('class="site-footer"');
    expect(html).toContain("北京殷实麦家管理咨询有限责任公司");
    expect(html).not.toContain("__SETUP_DEMO__");
    expect(html).not.toContain("__REVISION__");
    expect(html).not.toMatch(/<style\b/);
    expect(html).not.toMatch(inlineScript);
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).toContain('rel="icon"');
    expect(html).toContain('href="/assets/logo.png"');
    expect(html).toMatch(/<link rel="stylesheet" href="\/_astro\//);
  });

  it("ships the guide with every prompt and the shared header and footer", async () => {
    const guide = await read("guides/automation-user-guide.html");
    expect(guide).toContain("餐饮管理人员使用指南");
    expect(guide).toContain('class="site-header"');
    expect(guide).toContain('class="site-footer"');
    expect(guide).toContain("北京殷实麦家管理咨询有限责任公司");
    expect(guide).toContain('id="chooser"');
    expect(guide.match(/class="route-panel"/g)).toHaveLength(3);
    expect(guide.match(/class="prompt"/g)).toHaveLength(33);
    expect(guide).toContain("https://smedatacenter.xyz/guides/automation-user-guide.html");
    expect(guide).not.toContain("SME_DATA_CENTER");
    expect(guide).toContain('src="/assets/automation-guide-hero.webp"');
    expect(guide).toContain('src="/assets/automation-guide-handover.webp"');
    expect(guide).not.toMatch(/<style\b/);
    expect(guide).not.toMatch(inlineScript);
    expect(guide).not.toMatch(/\sstyle=/);
    expect(guide).toMatch(/<link rel="stylesheet" href="\/_astro\//);
  });

  it("builds Astro assets and keeps the standalone report sample", async () => {
    const assets = await readdir(join(output, "_astro"));
    expect(assets.some((file) => file.endsWith(".css"))).toBe(true);
    expect(assets.some((file) => file.endsWith(".js"))).toBe(true);
    expect(await readFile(join(output, "assets/automation-guide-hero.webp"))).toBeTruthy();
    expect(await readFile(join(output, "assets/automation-guide-handover.webp"))).toBeTruthy();
    expect(JSON.parse(await read("version.json")).revision).toMatch(/^[a-f0-9]{16}$/);
    const report = await read("samples/weekly-report.html");
    expect(report).toContain("某餐饮企业");
    expect(report).toContain('rel="icon"');
    const reportFrame = (await read("index.html")).match(/<iframe\b[^>]*>/)?.[0];
    expect(reportFrame).toContain('sandbox="allow-scripts"');
    expect(reportFrame).toContain('data-src="/samples/weekly-report.html"');
  });

  it("keeps the guide content structured and complete", () => {
    const routes = guideData.routes;
    expect(routes.map((route) => route.key)).toEqual(["a", "b", "c"]);
    expect(routes.map((route) => route.steps.length)).toEqual([6, 7, 11]);
    const prompts = routes.flatMap((route) => [
      ...route.steps.flatMap((step) => (step.prompt ? [step.prompt.text] : [])),
      ...route.help.sheets.map((sheet) => sheet.prompt.text)
    ]);
    expect(prompts).toHaveLength(33);
    expect(prompts.every((prompt) => prompt.trim().length > 0)).toBe(true);
    expect(prompts.join("\n")).toContain("继续验证 SMEDC 升级");
  });
});
