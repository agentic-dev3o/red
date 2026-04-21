/**
 * Fetch, download, and verify a release archive.
 *
 * Shared by the `download` and `scaffold` commands.
 */

import type { ReleaseResult } from "./api-client"
import * as api from "./api-client"
import { verifyChecksum } from "./checksum"
import * as out from "./output"

export interface VerifiedRelease {
	release: ReleaseResult
	buffer: Buffer
	filename: string
}

export async function fetchVerifiedRelease(
	licenseKey: string,
	version: string,
	apiUrl: string,
): Promise<VerifiedRelease> {
	out.progress("Fetching release metadata...")
	const release = await api.fetchRelease(licenseKey, version, apiUrl)

	out.progress("Downloading archive...")
	const { buffer, filename } = await api.downloadArchive(licenseKey, version, apiUrl)
	const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1)
	out.success(`Downloaded archive (${sizeMb} MB)`)

	out.progress("Verifying checksum...")
	verifyChecksum(buffer, release.sha256)
	out.success("Verified checksum (SHA-256)")

	return { release, buffer, filename }
}
