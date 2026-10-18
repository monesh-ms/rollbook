import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const isCloudflare =
	process.env.NITRO_PRESET === "cloudflare_module" ||
	process.env.DEPLOY_TARGET === "cloudflare";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({
			preset: isCloudflare ? "cloudflare_module" : undefined,
			devServer: { runner: "self" },
			rollupConfig: { external: [/^@sentry\//] },
		}),
		tailwindcss(),
		tanstackStart({
			// Static app shell is prerendered when running standalone; Cloudflare Worker serves dynamic SSR & assets.
			spa: isCloudflare ? { enabled: false } : { enabled: true },
			prerender: isCloudflare ? { enabled: false } : undefined,
		}),
		viteReact(),
	],
});

export default config;
