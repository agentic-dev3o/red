/**
 * `create-red-app versions`
 *
 * Fetch releases, semver-sort, and emit JSON on stdout.
 * Includes prereleases in the output but marks the latest stable.
 */

import * as api from "../lib/api-client"
import type { CliConfig } from "../lib/config"
import * as out from "../lib/output"
import { latestStable, sortVersions } from "../lib/versioning"

export async function versions(config: CliConfig): Promise<void> {
	out.progress("Fetching releases...")

	const raw = await api.fetchVersions(config.licenseKey, config.apiUrl)
	const sorted = sortVersions(raw)
	const stable = latestStable(sorted)

	const result = sorted.map((v) => ({
		version: v.version,
		tag: v.tag,
		prerelease: v.prerelease,
		publishedAt: v.publishedAt,
		archiveFileName: v.archiveFileName,
		latest: stable ? v.version === stable.version : false,
	}))

	out.json({ versions: result })
}
