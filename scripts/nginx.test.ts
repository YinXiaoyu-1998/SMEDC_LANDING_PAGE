import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
const repoRoot = process.cwd();

it("keeps the public static host separate from authenticated API and business pages", async () => {
  const site = await readFile(join(repoRoot, "deploy/nginx-marketing.conf"), "utf8");
  const bootstrap = await readFile(join(repoRoot, "deploy/nginx-marketing-bootstrap.conf"), "utf8");
  expect(site).not.toContain("proxy_pass");
  expect(site).toContain("root /opt/smedc/marketing/current;");
  expect(site).toContain("return 301 https://smedatacenter.xyz$request_uri;");
  expect(site).toContain("location / { return 404; }");
  expect(site).not.toContain("try_files $uri /index.html");
  expect(site).toContain("frame-src 'self'");
  expect(site.split("location = /samples/weekly-report.html")[0]).toContain(
    "frame-ancestors 'none'"
  );
  expect(site).toMatch(/location = \/samples\/weekly-report\.html\s*\{[^}]*frame-ancestors 'self'/);
  expect(site).toContain("location = /samples/weekly-report.css");
  expect(site).toContain("location = /samples/weekly-report.js");
  expect(site).not.toContain("'unsafe-inline'");
  expect(bootstrap).toContain("/.well-known/acme-challenge/");
  expect(bootstrap).not.toContain("ssl_certificate");
});
