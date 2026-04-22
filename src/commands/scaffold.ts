/**
 * Default scaffold command: `bun create red-app <dir> --license <key>`
 *
 * Flow:
 *   1. Validate the license key
 *   2. Fetch available releases
 *   3. Sort by semver, choose target (--version or latest stable)
 *   4. Fetch release metadata
 *   5. Download archive
 *   6. Verify SHA-256 checksum
 *   7. Extract → unwrap prefix → copy to destination
 *   8. Write .red-license, .red-version
 *   9. Verify skills directories
 *  10. Print next steps
 */

import { existsSync, readdirSync } from "node:fs"
import { basename, resolve } from "node:path"
import type { VersionEntry } from "../lib/api-client"
import * as api from "../lib/api-client"
import { cleanupTemp, copyDirRecursive, createTempDir, extractZip, unwrapPrefix } from "../lib/archive"
import type { CliConfig } from "../lib/config"
import { CliError, redactKey } from "../lib/errors"
import * as out from "../lib/output"
import { updatePackageName, verifySkillsPresent, writeLicenseFile, writeVersionFile } from "../lib/project-files"
import { fetchVerifiedRelease } from "../lib/release"
import { findVersion, latestStable, sortVersions } from "../lib/versioning"

export interface ScaffoldOptions {
	directory: string
	config: CliConfig
	targetVersion?: string
}

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
	const { directory, config, targetVersion } = opts
	const { licenseKey, apiUrl } = config
	const destDir = resolve(directory)

	// Guard: don't overwrite non-empty directories
	if (existsSync(destDir)) {
		const entries = readdirSync(destDir)
		if (entries.length > 0) {
			throw new CliError(
				`Directory "${directory}" already exists and is not empty.\n` +
					"  Choose a different name or remove the existing directory.",
			)
		}
	}

	out.blank()

	// 1 — Validate license
	out.progress("Validating license key...")
	const validation = await api.validateLicense(licenseKey, apiUrl)
	if (!validation.valid) {
		throw new CliError(
			`License key ${redactKey(licenseKey)} is not valid.\n` +
				"  Check your key and try again, or contact support at contact@dev3o.com",
		)
	}
	out.success(`License validated${validation.plan ? ` (${validation.plan} plan)` : ""}`)

	// 2 — Fetch and sort releases
	out.progress("Fetching available releases...")
	const rawVersions = await api.fetchVersions(licenseKey, apiUrl)
	if (rawVersions.length === 0) {
		throw new CliError("No releases are available for your license.\n" + "  Contact support at contact@dev3o.com")
	}
	const versions = sortVersions(rawVersions)
	out.success(`Fetched ${versions.length} available release(s)`)

	// 3 — Choose target
	let target: VersionEntry | undefined
	if (targetVersion) {
		target = findVersion(versions, targetVersion)
		if (!target) {
			const available = versions
				.slice(0, 5)
				.map((v) => v.version)
				.join(", ")
			throw new CliError(
				`Version "${targetVersion}" not found.\n` +
					`  Available: ${available}${versions.length > 5 ? "..." : ""}\n` +
					"  Run 'create-red-app versions' for the full list.",
			)
		}
	} else {
		target = latestStable(versions)
		if (!target) {
			// All versions are prereleases — pick the newest one
			target = versions[0]
			out.warn(`No stable release found. Using latest prerelease: ${target.version}`)
		}
	}
	out.success(`Selected ${target.version}${targetVersion ? "" : " (latest stable)"}`)

	// 4–6 — Fetch, download, and verify
	const { buffer } = await fetchVerifiedRelease(licenseKey, target.version, apiUrl)

	// 7 — Extract, unwrap, copy
	const tempDir = createTempDir()
	try {
		out.progress("Extracting archive...")
		extractZip(buffer, tempDir)

		const unwrapped = unwrapPrefix(tempDir)
		copyDirRecursive(unwrapped, destDir)
		out.success(`Extracted to ${directory}/`)

		// 8 — Rewrite package.json name
		const pkgName = updatePackageName(destDir, basename(destDir))
		if (pkgName) out.success(`Set package.json name to "${pkgName}"`)

		// 9 — Write project files
		writeLicenseFile(destDir, licenseKey)
		writeVersionFile(destDir, target.version)
		out.success("Wrote .red-license and .red-version")

		// 10 — Verify skills
		verifySkillsPresent(destDir)
	} finally {
		cleanupTemp(tempDir)
	}

	// 10 — Print next steps
	out.blank()
	out.progress("Next steps:\n")
	out.progress(`  cd ${directory}`)
	out.progress("  claude")
	out.progress("  /red-init\n")
	out.progress("Your RED project is ready! Start Claude and run the init skill to complete setup.")
	out.blank()
}
