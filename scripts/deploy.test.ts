import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";

const source = await readFile(new URL("./deploy-remote.sh", import.meta.url), "utf8");
const sha = "b".repeat(40);

it("keeps the remote transaction valid Bash", () => {
  const result = spawnSync("bash", ["-n"], { input: source, encoding: "utf8" });
  expect(result.status, result.stderr).toBe(0);
});

it.each(["success", "verify-failure", "incomplete", "checksum-failure", "first-release-failure"])(
  "handles a website release without modifying service files: %s",
  async (scenario) => {
    const root = await mkdtemp(join(tmpdir(), "smedc-landing-release-"));
    const site = join(root, "marketing");
    const bin = join(root, "bin");
    const payload = join(root, "payload");
    const archive = join(root, `smedc-landing-${sha}-1-1.tar.gz`);
    try {
      await mkdir(bin);
      await mkdir(join(site, "releases/old"), { recursive: true });
      await writeFile(join(site, "releases/old/index.html"), "old website");
      await writeFile(join(site, "releases/old/version.json"), "old revision");
      if (scenario !== "first-release-failure")
        await symlink("releases/old", join(site, "current"));
      await writeFile(join(site, "previous-release"), "releases/older\n");
      await writeFile(join(root, "runtime.env"), "service configuration sentinel");
      await writeFile(join(root, "previous-marketing-release"), "legacy rollback sentinel");
      await writeFile(join(root, "marketing-enabled"), "");
      for (const file of [
        "index.html",
        "version.json",
        "styles.css",
        "client.js",
        "assets/hero.webp",
        "samples/weekly-report.html",
        "samples/weekly-report.css",
        "samples/weekly-report.js"
      ]) {
        const path = join(payload, file);
        await mkdir(join(path, ".."), { recursive: true });
        await writeFile(path, "new website");
      }
      if (scenario === "incomplete") await rm(join(payload, "client.js"));
      const packed = spawnSync("tar", ["-czf", archive, "-C", payload, "."], { encoding: "utf8" });
      expect(packed.status, packed.stderr).toBe(0);
      const digest = createHash("sha256")
        .update(await readFile(archive))
        .digest("hex");
      // Emulate only Linux command differences and the network at the host boundary.
      const commands = {
        mv: `"${process.execPath}" -e 'require("node:fs").renameSync(process.argv[1], process.argv[2])' "$2" "$3"`,
        flock: "exit 0",
        sha256sum: `read -r expected file
actual=$("${process.execPath}" -e 'process.stdout.write(require("node:crypto").createHash("sha256").update(require("node:fs").readFileSync(process.argv[1])).digest("hex"))' "$file")
test "$expected" = "$actual"`,
        curl: `if [ "\${FAIL_VERIFY:-0}" = 1 ]; then exit 22; fi
case "$*" in
  *version.json*) cat "$TEST_ROOT/marketing/current/version.json" ;;
  *redirect_url*) printf 'https://smedatacenter.xyz/' ;;
  *http_code*) printf 404 ;;
esac`
      };
      for (const [name, body] of Object.entries(commands)) {
        await writeFile(join(bin, name), `#!/usr/bin/env bash\nset -euo pipefail\n${body}\n`);
        await chmod(join(bin, name), 0o755);
      }
      // Replace the archive prefix before injecting a root that may itself use /tmp.
      const script = source
        .replaceAll("/tmp/smedc-landing-", `${root}/smedc-landing-`)
        .replaceAll("/opt/smedc", root);
      const run = (args: string[], fail = false) =>
        spawnSync("bash", ["-s", "--", ...args], {
          input: script,
          encoding: "utf8",
          timeout: 5000,
          env: {
            ...process.env,
            PATH: `${bin}:${process.env["PATH"]}`,
            TEST_ROOT: root,
            FAIL_VERIFY: fail ? "1" : "0"
          }
        });
      const result = run(
        ["deploy", sha, archive, scenario === "checksum-failure" ? "0".repeat(64) : digest],
        scenario.endsWith("release-failure") || scenario === "verify-failure"
      );
      if (scenario === "success") {
        expect(result.status, result.stderr).toBe(0);
        expect(await readFile(join(site, "current/index.html"), "utf8")).toBe("new website");
        expect(await readFile(join(site, "current/release-commit.txt"), "utf8")).toBe(`${sha}\n`);
        expect(await readFile(join(site, "previous-release"), "utf8")).toBe("releases/old\n");
        const rolledBack = run(["rollback"]);
        expect(rolledBack.status, rolledBack.stderr).toBe(0);
        expect(await readlink(join(site, "current"))).toBe("releases/old");
      } else {
        expect(result.status, result.stderr).not.toBe(0);
        if (scenario === "first-release-failure") {
          await expect(readlink(join(site, "current"))).rejects.toMatchObject({ code: "ENOENT" });
        } else {
          expect(await readlink(join(site, "current"))).toBe("releases/old");
        }
        expect(await readFile(join(site, "previous-release"), "utf8")).toBe("releases/older\n");
        expect(await readdir(join(site, "releases"))).toEqual(["old"]);
      }
      expect(await readFile(join(root, "runtime.env"), "utf8")).toBe(
        "service configuration sentinel"
      );
      expect(await readFile(join(root, "previous-marketing-release"), "utf8")).toBe(
        "legacy rollback sentinel"
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
);

it("automatically releases trusted main pushes after quality gates and preserves manual rollback", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/deploy.yml", import.meta.url),
    "utf8"
  );
  expect(workflow).toContain("workflow_dispatch:");
  expect(workflow).toContain("push:\n    branches: [main]");
  expect(workflow).not.toContain("workflow_run:");
  expect(workflow).not.toContain("pull_request:");
  expect(workflow).toContain("github.ref == 'refs/heads/main'");
  expect(workflow).toContain("github.event_name == 'push' || inputs.operation == 'deploy'");
  expect(workflow).toContain("needs.quality.result == 'success'");
  expect(workflow).toContain(
    "github.event_name == 'workflow_dispatch' && inputs.operation == 'rollback'"
  );
  expect(workflow).toContain(
    "github.event_name == 'workflow_dispatch' && inputs.operation || 'deploy'"
  );
  expect(workflow).toContain("uses: ./.github/workflows/quality.yml");
  expect(workflow).toContain("if: env.OPERATION == 'deploy'");
  expect(workflow).toContain('current_main=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main"');
  expect(workflow).toContain('if [ "$current_main" != "$GITHUB_SHA" ]; then');
  expect(workflow.indexOf("Verify selected main commit")).toBeLessThan(
    workflow.indexOf("Install the website SSH credential")
  );
  expect(workflow).toContain("group: smedc-landing-production");
  expect(workflow).toContain("cancel-in-progress: false");
  expect(workflow).toContain("name: landing-${{ github.sha }}");
  expect(workflow).toContain("name: landing-production");
  expect(workflow).toContain("StrictHostKeyChecking=yes");
  expect(workflow).toContain('test "$LANDING_DEPLOY_ENABLED" = true');
  expect(workflow).not.toMatch(/ACR_PASSWORD|CURSOR_SIGNING_SECRET|runtime.env|docker/);
  for (const match of workflow.matchAll(/uses: (actions\/[^\s]+)/g)) {
    expect(match[1]).toMatch(/@[a-f0-9]{40}$/);
  }
  const quality = await readFile(
    new URL("../.github/workflows/quality.yml", import.meta.url),
    "utf8"
  );
  expect(quality).toContain("pull_request:");
  expect(quality).toContain("workflow_call:");
  expect(quality).not.toContain("push:");
});
