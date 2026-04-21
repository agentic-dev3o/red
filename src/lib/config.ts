/**
 * CLI configuration and constants.
 *
 * The version is injected at build time via `define` in scripts/build.ts.
 * During development (bun run src/cli.ts) it falls back to "0.0.0-dev".
 */

export const CLI_VERSION = process.env.__CLI_VERSION__ ?? "0.0.0-dev"

export const DEFAULT_API_URL = "https://wry-salamander-154.convex.site"

export const LICENSE_FILENAME = ".red-license"
export const VERSION_FILENAME = ".red-version"

/** The prefix added by `git archive --prefix=red/` in the release pipeline. */
export const ARCHIVE_PREFIX = "red"

/** Skill directories that must survive extraction for buyer onboarding. */
export const REQUIRED_SKILL_DIRS = [".claude/skills/red-init", ".claude/skills/red-update"] as const

export interface CliConfig {
	apiUrl: string
	licenseKey: string
}
