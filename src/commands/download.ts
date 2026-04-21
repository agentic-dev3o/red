/**
 * `create-red-app download <version>`
 *
 * Download an archive, verify its checksum, extract to a temp directory,
 * and emit JSON with paths. Never touches the current working tree — this
 * is an inspection primitive consumed by the red-update skill.
 */

import { join } from "node:path"
import { createTempDir, extractZip, unwrapPrefix } from "../lib/archive"
import type { CliConfig } from "../lib/config"
import * as out from "../lib/output"
import { fetchVerifiedRelease } from "../lib/release"

export async function download(version: string, config: CliConfig): Promise<void> {
	const { release, buffer, filename } = await fetchVerifiedRelease(config.licenseKey, version, config.apiUrl)

	// Extract to temp directory
	const tempDir = createTempDir("red-download-")
	out.progress("Extracting archive...")
	extractZip(buffer, tempDir)
	const extractedPath = unwrapPrefix(tempDir)
	out.success("Extracted to temp directory")

	// Write the archive file for reference
	const archivePath = join(tempDir, filename)
	const { writeFileSync } = await import("node:fs")
	writeFileSync(archivePath, buffer)

	// Emit machine-readable output
	out.json({
		version: release.version,
		archiveFileName: filename,
		archivePath,
		extractedPath,
	})
}
