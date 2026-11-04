import { defineConfig } from "astro/config";

export default defineConfig({
  outDir: "./dist/marketing",
  compressHTML: false,
  build: {
    format: "file",
    inlineStylesheets: "never"
  },
  vite: {
    build: {
      assetsInlineLimit: 0
    }
  }
});
