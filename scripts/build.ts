import { chmodSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"))

const result = await Bun.build({
	entrypoints: [resolve(root, "src/cli.ts")],
	outdir: resolve(root, "dist"),
	naming: "cli.mjs",
	target: "node",
	format: "esm",
	minify: true,
	define: {
		"process.env.__CLI_VERSION__": JSON.stringify(pkg.version),
	},
})

if (!result.success) {
	console.error("Build failed:")
	for (const log of result.logs) {
		console.error(log)
	}
	process.exit(1)
}

const outPath = resolve(root, "dist/cli.mjs")
const content = readFileSync(outPath, "utf-8")
writeFileSync(outPath, `#!/usr/bin/env node\n${content}`)
chmodSync(outPath, 0o755)

console.log(`Built dist/cli.mjs (v${pkg.version})`)
