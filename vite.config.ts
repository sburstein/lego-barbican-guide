import path from "path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8"));
let commit = "local";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: __dirname }).toString().trim();
} catch {
  // not a git checkout
}

/**
 * The AI designer's server route, mounted only on the dev server. It is
 * imported at runtime (never bundled), so the API key and the designer stay
 * server-side; the static build ships no route and its panel says so.
 */
function designerApi(): Plugin {
  return {
    name: "designer-api",
    apply: "serve",
    async configureServer(server) {
      const href = pathToFileURL(path.resolve(__dirname, "scripts/lib/design-api.mjs")).href;
      const { createDesignApi } = await import(/* @vite-ignore */ href);
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const api = createDesignApi({
        root: __dirname,
        makeClient: (key: string) => new Anthropic({ apiKey: key, maxRetries: 3, timeout: 20 * 60 * 1000 }),
      });
      server.middlewares.use((req, res, next) => api(req, res, next));
    },
  };
}

export default defineConfig({
  plugins: [react(), designerApi()],
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}+${commit}`),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
