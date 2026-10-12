import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "ui",
		compatibilityDate: "2026-10-12",
		workersDev: false,
		assets: {
			htmlHandling: "auto-trailing-slash",
			notFoundHandling: "404-page",
		},
		domains: [
			"ui.praveenjuge.com",
		],
	},
});
