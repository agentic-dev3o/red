/**
 * `create-red-app info <version>`
 *
 * Fetch release metadata and emit normalised JSON on stdout.
 * The migrationManifest is always emitted as a parsed object,
 * even though the backend may return it as a JSON string.
 */

import * as api from "../lib/api-client"
import type { CliConfig } from "../lib/config"
import * as out from "../lib/output"

export async function info(version: string, config: CliConfig): Promise<void> {
	out.progress(`Fetching release info for ${version}...`)

	const release = await api.fetchRelease(config.licenseKey, version, config.apiUrl)

	out.json({
		version: release.version,
		tag: release.tag,
		prerelease: release.prerelease,
		changelogMd: release.changelogMd,
		migrationMd: release.migrationMd,
		migrationManifest: release.migrationManifest,
		sha256: release.sha256,
		archiveFileName: release.archiveFileName,
		publishedAt: release.publishedAt,
	})
}
