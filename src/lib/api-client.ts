/**
 * Typed wrappers around the RED license-server HTTP API.
 *
 * Backend contract comes from red-license-app/convex/api.ts.
 * Quirks normalised here:
 *   - migrationManifest may arrive as a JSON string; we always expose an object.
 *   - versions are returned sorted by publishedAt; caller must re-sort by semver.
 */

import { CliError, httpError, redactKey } from "./errors"

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ValidateResult {
	valid: boolean
	plan?: string
	email?: string
}

export interface VersionEntry {
	version: string
	tag: string
	prerelease: boolean
	publishedAt: number
	archiveFileName: string
}

export interface VersionsResult {
	versions: VersionEntry[]
}

export interface ReleaseResult {
	version: string
	tag: string
	prerelease: boolean
	changelogMd: string
	migrationMd: string
	migrationManifest: Record<string, unknown>
	sha256: string
	archiveFileName: string
	publishedAt: number
}

export interface DownloadResult {
	buffer: Buffer
	filename: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 30_000

async function request(url: string, key: string): Promise<Response> {
	const safeUrl = url.replace(encodeURIComponent(key), redactKey(key))
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
	let res: Response
	try {
		res = await fetch(url, { signal: controller.signal })
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			throw new CliError(
				`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${safeUrl}\n` +
					"  The license server may be down. Please try again later.",
			)
		}
		throw new CliError(
			`Network error contacting ${safeUrl}\n` + `  ${err instanceof Error ? err.message : String(err)}`,
		)
	} finally {
		clearTimeout(timer)
	}
	if (!res.ok) throw httpError(res.status, safeUrl)
	return res
}

function parseMigrationManifest(raw: unknown): Record<string, unknown> {
	if (raw === null || raw === undefined) return {}
	if (typeof raw === "object" && !Array.isArray(raw)) {
		return raw as Record<string, unknown>
	}
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw)
			if (typeof parsed === "object" && parsed !== null) return parsed
		} catch {
			// Fall through to empty
		}
	}
	return {}
}

function requireString(raw: Record<string, unknown>, field: string): string {
	const val = raw[field]
	if (typeof val !== "string") {
		throw new CliError(
			`Unexpected API response: missing or invalid "${field}".\n` +
				"  The server response may have changed. Please update create-red-app.",
		)
	}
	return val
}

function requireBoolean(raw: Record<string, unknown>, field: string): boolean {
	const val = raw[field]
	if (typeof val !== "boolean") {
		throw new CliError(
			`Unexpected API response: missing or invalid "${field}".\n` +
				"  The server response may have changed. Please update create-red-app.",
		)
	}
	return val
}

function requireNumber(raw: Record<string, unknown>, field: string): number {
	const val = raw[field]
	if (typeof val !== "number" || !Number.isFinite(val)) {
		throw new CliError(
			`Unexpected API response: missing or invalid "${field}".\n` +
				"  The server response may have changed. Please update create-red-app.",
		)
	}
	return val
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function validateLicense(key: string, apiUrl: string): Promise<ValidateResult> {
	const res = await request(`${apiUrl}/api/validate/${encodeURIComponent(key)}`, key)

	const data = (await res.json()) as ValidateResult
	return data
}

export async function fetchVersions(key: string, apiUrl: string): Promise<VersionEntry[]> {
	const res = await request(`${apiUrl}/api/versions/${encodeURIComponent(key)}`, key)

	const data = (await res.json()) as VersionsResult
	return data.versions ?? []
}

export async function fetchRelease(key: string, version: string, apiUrl: string): Promise<ReleaseResult> {
	const res = await request(`${apiUrl}/api/releases/${encodeURIComponent(key)}/${encodeURIComponent(version)}`, key)

	const raw = (await res.json()) as Record<string, unknown>

	return {
		version: requireString(raw, "version"),
		tag: requireString(raw, "tag"),
		prerelease: requireBoolean(raw, "prerelease"),
		changelogMd: typeof raw.changelogMd === "string" ? raw.changelogMd : "",
		migrationMd: typeof raw.migrationMd === "string" ? raw.migrationMd : "",
		migrationManifest: parseMigrationManifest(raw.migrationManifest),
		sha256: requireString(raw, "sha256"),
		archiveFileName: requireString(raw, "archiveFileName"),
		publishedAt: requireNumber(raw, "publishedAt"),
	}
}

export async function downloadArchive(key: string, version: string, apiUrl: string): Promise<DownloadResult> {
	const res = await request(`${apiUrl}/api/download/${encodeURIComponent(key)}/${encodeURIComponent(version)}`, key)

	const disposition = res.headers.get("content-disposition") ?? ""
	const filenameMatch = disposition.match(/filename="?([^";\s]+)"?/)
	const filename = filenameMatch?.[1] ?? `red-${version}.zip`

	const arrayBuf = await res.arrayBuffer()
	return {
		buffer: Buffer.from(arrayBuf),
		filename,
	}
}
