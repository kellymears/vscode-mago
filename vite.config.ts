import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: "src/extension.ts",
      formats: ["cjs"],
      fileName: () => "extension.js",
    },
    outDir: "dist",
    rollupOptions: {
      external: ["vscode", /^node:/],
    },
    sourcemap: false,
    minify: false,
    target: "node18",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    root: "src",
    alias: {
      vscode: new URL("./src/__mocks__/vscode.ts", import.meta.url).pathname,
    },
    coverage: {
      reporter: ["text", "json-summary"],
    },
  },
});
