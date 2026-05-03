import { tanstackPlugin } from "@karnak19/pbkit-tanstack";
import type { PbkitConfig } from "@karnak19/pbkit";

const config: PbkitConfig = {
  input: process.env.PB_TYPEGEN_URL ?? process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080",
  output: "src/shared/db/generated",
  sdk: {
    // Leave baseUrl empty — the starter uses multiple PB clients (browser, server, admin)
    // The generated client.gen.ts is a fallback; prefer passing `client` override via opts
  },
  plugins: [tanstackPlugin],
};

export default config;
