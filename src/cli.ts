/**
 * CLI entry point for create-red-app.
 *
 * Usage:
 *   bun create red-app <dir> --license <key>           # scaffold
 *   bunx create-red-app versions                        # list releases
 *   bunx create-red-app info <version>                  # release details
 *   bunx create-red-app download <version>              # download + extract
 *
 * Non-scaffold commands read .red-license from CWD by default.
 * Human progress → stderr. Machine-readable JSON → stdout.
 */

import { download } from "./commands/download"
import { info } from "./commands/info"
import { scaffold } from "./commands/scaffold"
import { versions } from "./commands/versions"
import type { CliConfig } from "./lib/config"
import { CLI_VERSION, DEFAULT_API_URL } from "./lib/config"
import { CliError } from "./lib/errors"
import * as out from "./lib/output"
import { readLicenseFile } from "./lib/project-files"

// ---------------------------------------------------------------------------
// Arg helpers
// ---------------------------------------------------------------------------

function getFlag(args: string[], name: string): string | undefined {
	const idx = args.indexOf(`--${name}`)
	if (idx !== -1 && idx + 1 < args.length) {
		return args[idx + 1]
	}
	return undefined
}

function hasFlag(args: string[], ...names: string[]): boolean {
	return names.some((n) => args.includes(`--${n}`) || args.includes(`-${n}`))
}

/**
 * Resolve the license key from (in priority order):
 *   1. --license flag
 *   2. RED_LICENSE_KEY env var
 *   3. .red-license in CWD
 */
function resolveLicenseKey(args: string[]): string {
	const fromFlag = getFlag(args, "license")
	if (fromFlag) return fromFlag

	const fromEnv = process.env.RED_LICENSE_KEY
	if (fromEnv) return fromEnv

	const fromFile = readLicenseFile(process.cwd())
	if (fromFile) return fromFile

	throw new CliError(
		"No license key provided.\n\n" +
			"  Provide a key with one of:\n" +
			"    --license <key>            CLI flag\n" +
			"    RED_LICENSE_KEY=<key>       environment variable\n" +
			"    .red-license file           in the current directory\n",
	)
}

function buildConfig(args: string[]): CliConfig {
	return {
		apiUrl: getFlag(args, "api-url") ?? DEFAULT_API_URL,
		licenseKey: resolveLicenseKey(args),
	}
}

// ---------------------------------------------------------------------------
// Help & version
// ---------------------------------------------------------------------------

const HELP = `
  create-red-app v${CLI_VERSION}

  Scaffold and manage licensed RED projects.

  Usage:
    bun create red-app <directory> --license <key>    Scaffold a new project
    create-red-app versions                           List available releases
    create-red-app info <version>                     Show release details
    create-red-app download <version>                 Download and extract a release

  Options:
    --license <key>    License key (or set RED_LICENSE_KEY, or .red-license in CWD)
    --version <ver>    Pin to a specific release version (scaffold only)
    --api-url <url>    Override the license API base URL
    -h, --help         Show this help
    -v, --version      Show CLI version

  Examples:
    bun create red-app my-saas --license XXXX-XXXX-XXXX
    bunx create-red-app versions
    bunx create-red-app info 1.5.0
    bunx create-red-app download 1.5.0
`

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const args = process.argv.slice(2)

	// Flags that short-circuit
	if (args.length === 0 || hasFlag(args, "h", "help")) {
		process.stderr.write(`${HELP}\n`)
		return
	}
	// -v always shows version. --version shows version only when not used as
	// a valued flag (e.g. --version 1.5.0 is a scaffold pin, not a display request).
	const versionFlagValue = getFlag(args, "version")
	if (args.includes("-v") || (args.includes("--version") && (!versionFlagValue || versionFlagValue.startsWith("-")))) {
		process.stdout.write(`${CLI_VERSION}\n`)
		return
	}

	// Determine command vs. scaffold
	const positional = args.filter((a) => !a.startsWith("-") && !isValueOfFlag(args, a))
	const command = positional[0]
	const config = buildConfig(args)

	if (command === "versions") {
		await versions(config)
		return
	}

	if (command === "info") {
		const ver = positional[1]
		if (!ver) {
			throw new CliError("Missing version argument.\n" + "  Usage: create-red-app info <version>")
		}
		await info(ver, config)
		return
	}

	if (command === "download") {
		const ver = positional[1]
		if (!ver) {
			throw new CliError("Missing version argument.\n" + "  Usage: create-red-app download <version>")
		}
		await download(ver, config)
		return
	}

	// Default: scaffold
	if (!command) {
		throw new CliError("Missing directory argument.\n" + "  Usage: bun create red-app <directory> --license <key>")
	}

	await scaffold({
		directory: command,
		config,
		targetVersion: getFlag(args, "version"),
	})
}

/**
 * Check if a value is immediately preceded by a flag (e.g. "--license KEY"
 * means "KEY" is the value of --license, not a positional arg).
 */
function isValueOfFlag(args: string[], value: string): boolean {
	const idx = args.indexOf(value)
	if (idx <= 0) return false
	const prev = args[idx - 1]
	return prev.startsWith("--") && !prev.includes("=")
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((err) => {
	if (err instanceof CliError) {
		out.error(err.message)
		process.exit(err.exitCode)
	}
	// Unexpected error — redact any license keys in the message
	const msg = err instanceof Error ? err.message : String(err)
	out.error(`Unexpected error: ${msg}`)
	process.exit(1)
})
