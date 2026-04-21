/**
 * Lightweight semver parsing, comparison, and target resolution.
 *
 * The backend returns versions sorted by publishedAt. This module re-sorts
 * by semver so the CLI always picks a deterministic "latest stable" target.
 */

import type { VersionEntry } from "./api-client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSemVer {
	major: number
	minor: number
	patch: number
	prerelease: string[]
	raw: string
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseSemver(version: string): ParsedSemVer {
	const cleaned = version.startsWith("v") ? version.slice(1) : version
	const [core, pre] = cleaned.split("-", 2)
	const parts = core.split(".")
	return {
		major: Number(parts[0]) || 0,
		minor: Number(parts[1]) || 0,
		patch: Number(parts[2]) || 0,
		prerelease: pre ? pre.split(".") : [],
		raw: version,
	}
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * Returns negative if a < b, positive if a > b, 0 if equal.
 *
 * Semver rules:
 *   1. Compare major, minor, patch numerically.
 *   2. A version with no prerelease has higher precedence than one with a
 *      prerelease tag when their core versions are equal.
 *   3. Prerelease segments are compared left-to-right; numeric segments are
 *      compared as integers, string segments lexicographically.
 */
export function compareSemver(a: ParsedSemVer, b: ParsedSemVer): number {
	const d = a.major - b.major || a.minor - b.minor || a.patch - b.patch
	if (d !== 0) return d

	// Both have no prerelease — equal core.
	if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0
	// Release > prerelease when core is equal.
	if (a.prerelease.length === 0) return 1
	if (b.prerelease.length === 0) return -1

	// Compare prerelease segments.
	const len = Math.max(a.prerelease.length, b.prerelease.length)
	for (let i = 0; i < len; i++) {
		const sa = a.prerelease[i]
		const sb = b.prerelease[i]
		if (sa === undefined) return -1 // fewer segments = lower
		if (sb === undefined) return 1
		const na = Number(sa)
		const nb = Number(sb)
		const aNum = !Number.isNaN(na)
		const bNum = !Number.isNaN(nb)
		if (aNum && bNum) {
			if (na !== nb) return na - nb
			continue
		}

		if (aNum) return -1 // numeric < string
		if (bNum) return 1

		const cmp = sa.localeCompare(sb)
		if (cmp !== 0) return cmp
	}
	return 0
}

// ---------------------------------------------------------------------------
// Sorting & selection
// ---------------------------------------------------------------------------

/** Sort version entries descending (newest first) by semver. */
export function sortVersions<T extends { version: string }>(entries: T[]): T[] {
	return [...entries].sort((a, b) => {
		const pa = parseSemver(a.version)
		const pb = parseSemver(b.version)
		return compareSemver(pb, pa) // descending
	})
}

/** Pick the latest stable (non-prerelease) version from a sorted list. */
export function latestStable(entries: VersionEntry[]): VersionEntry | undefined {
	return entries.find((e) => !e.prerelease)
}

/** Find a specific version in the list (matches with or without "v" prefix). */
export function findVersion(entries: VersionEntry[], target: string): VersionEntry | undefined {
	const cleaned = target.startsWith("v") ? target.slice(1) : target
	return entries.find((e) => {
		const v = e.version.startsWith("v") ? e.version.slice(1) : e.version
		return v === cleaned
	})
}
