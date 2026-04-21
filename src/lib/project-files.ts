/**
 * Write and verify project-level files (.red-license, .red-version, skills).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { LICENSE_FILENAME, REQUIRED_SKILL_DIRS, VERSION_FILENAME } from "./config"
import * as out from "./output"

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
					"Please verify the release or contact support.",
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
