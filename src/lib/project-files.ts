/**
 * Write and verify project-level files (.red-license, .red-version, skills).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { LICENSE_FILENAME, REQUIRED_SKILL_DIRS, VERSION_FILENAME } from "./config"
import * as out from "./output"

/**
 * Sanitize a raw app name into a valid npm package name:
 * lowercase, only [a-z0-9-._], no leading/trailing separators.
 */
export function toNpmName(raw: string): string {
	const cleaned = raw
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\-_.]+/g, "-")
		.replace(/^[._-]+/, "")
		.replace(/[._-]+$/, "")
	return cleaned || "app"
}

/**
 * Rewrite the "name" field in the scaffolded package.json so the new
 * project identifies itself rather than the "red-boilerplate" source.
 * Returns the name that was written, or undefined if package.json is missing.
 */
export function updatePackageName(dir: string, appName: string): string | undefined {
	const pkgPath = join(dir, "package.json")
	if (!existsSync(pkgPath)) return undefined

	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
	const name = toNpmName(appName)
	pkg.name = name
	writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8")
	return name
}

/** Write the buyer license key to .red-license. */
export function writeLicenseFile(dir: string, key: string): void {
	writeFileSync(join(dir, LICENSE_FILENAME), `${key}\n`, "utf-8")
}

/** Write the selected RED release version to .red-version. */
export function writeVersionFile(dir: string, version: string): void {
	writeFileSync(join(dir, VERSION_FILENAME), `${version}\n`, "utf-8")
}

/**
 * Verify that the required Claude skill directories survived extraction.
 * Warns but does not fail — a missing skill directory is recoverable via
 * re-download but should be investigated.
 */
export function verifySkillsPresent(dir: string): void {
	for (const skillDir of REQUIRED_SKILL_DIRS) {
		const fullPath = join(dir, skillDir)
		if (!existsSync(fullPath)) {
			out.warn(
				`Expected skill directory not found: ${skillDir}\n` +
					"    The release archive may be incomplete. " +
					"Please verify the release or contact support at contact@dev3o.com.",
			)
		}
	}
}

/**
 * Read the license key from .red-license in the given directory.
 * Returns undefined if the file does not exist.
 */
export function readLicenseFile(dir: string): string | undefined {
	const filePath = join(dir, LICENSE_FILENAME)
	if (!existsSync(filePath)) return undefined

	try {
		return readFileSync(filePath, "utf-8").trim()
	} catch {
		return undefined
	}
}
