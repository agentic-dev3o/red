import { describe, expect, it } from "bun:test"
import type { VersionEntry } from "../src/lib/api-client"
import { compareSemver, findVersion, latestStable, parseSemver, sortVersions } from "../src/lib/versioning"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entry(version: string, prerelease = false): VersionEntry {
	return {
		version,
		tag: `v${version}`,
		prerelease,
		publishedAt: Date.now(),
		archiveFileName: `red-v${version}.zip`,
	}
}

// ---------------------------------------------------------------------------
// parseSemver
// ---------------------------------------------------------------------------

describe("parseSemver", () => {
	it("parses a simple version", () => {
		const v = parseSemver("1.2.3")
		expect(v.major).toBe(1)
		expect(v.minor).toBe(2)
		expect(v.patch).toBe(3)
		expect(v.prerelease).toEqual([])
	})

	it("strips a leading v", () => {
		const v = parseSemver("v2.0.1")
		expect(v.major).toBe(2)
		expect(v.minor).toBe(0)
		expect(v.patch).toBe(1)
	})

	it("parses prerelease segments", () => {
		const v = parseSemver("1.0.0-beta.2")
		expect(v.prerelease).toEqual(["beta", "2"])
	})
})

// ---------------------------------------------------------------------------
// compareSemver
// ---------------------------------------------------------------------------

describe("compareSemver", () => {
	it("orders by major version", () => {
		expect(compareSemver(parseSemver("2.0.0"), parseSemver("1.0.0"))).toBeGreaterThan(0)
	})

	it("orders by minor version", () => {
		expect(compareSemver(parseSemver("1.2.0"), parseSemver("1.1.0"))).toBeGreaterThan(0)
	})

	it("orders by patch version", () => {
		expect(compareSemver(parseSemver("1.0.2"), parseSemver("1.0.1"))).toBeGreaterThan(0)
	})

	it("release > prerelease when core is equal", () => {
		expect(compareSemver(parseSemver("1.0.0"), parseSemver("1.0.0-beta.1"))).toBeGreaterThan(0)
	})

	it("compares prerelease segments numerically", () => {
		expect(compareSemver(parseSemver("1.0.0-beta.2"), parseSemver("1.0.0-beta.1"))).toBeGreaterThan(0)
	})

	it("compares prerelease segments lexicographically", () => {
		expect(compareSemver(parseSemver("1.0.0-rc.1"), parseSemver("1.0.0-beta.1"))).toBeGreaterThan(0)
	})

	it("numeric < string in prerelease", () => {
		expect(compareSemver(parseSemver("1.0.0-1"), parseSemver("1.0.0-alpha"))).toBeLessThan(0)
	})

	it("fewer prerelease segments = lower precedence", () => {
		expect(compareSemver(parseSemver("1.0.0-beta"), parseSemver("1.0.0-beta.1"))).toBeLessThan(0)
	})

	it("returns 0 for equal versions", () => {
		expect(compareSemver(parseSemver("1.2.3"), parseSemver("1.2.3"))).toBe(0)
	})
})

// ---------------------------------------------------------------------------
// sortVersions
// ---------------------------------------------------------------------------

describe("sortVersions", () => {
	it("sorts descending by semver", () => {
		const input = [entry("1.0.0"), entry("2.1.0"), entry("1.5.0"), entry("2.0.0-beta.1", true)]
		const sorted = sortVersions(input)
		expect(sorted.map((e) => e.version)).toEqual(["2.1.0", "2.0.0-beta.1", "1.5.0", "1.0.0"])
	})

	it("does not mutate the input array", () => {
		const input = [entry("2.0.0"), entry("1.0.0")]
		const sorted = sortVersions(input)
		expect(sorted).not.toBe(input)
		expect(input[0].version).toBe("2.0.0")
	})
})

// ---------------------------------------------------------------------------
// latestStable
// ---------------------------------------------------------------------------

describe("latestStable", () => {
	it("returns the first non-prerelease entry", () => {
		const input = [entry("2.0.0-rc.1", true), entry("1.5.0"), entry("1.4.0")]
		expect(latestStable(input)?.version).toBe("1.5.0")
	})

	it("returns undefined if all are prereleases", () => {
		const input = [entry("2.0.0-alpha.1", true), entry("1.0.0-beta.1", true)]
		expect(latestStable(input)).toBeUndefined()
	})
})

// ---------------------------------------------------------------------------
// findVersion
// ---------------------------------------------------------------------------

describe("findVersion", () => {
	it("finds a version by exact match", () => {
		const input = [entry("1.0.0"), entry("1.5.0")]
		expect(findVersion(input, "1.5.0")?.version).toBe("1.5.0")
	})

	it("finds a version with v prefix mismatch", () => {
		const input = [entry("1.0.0"), entry("1.5.0")]
		expect(findVersion(input, "v1.5.0")?.version).toBe("1.5.0")
	})

	it("returns undefined for missing version", () => {
		const input = [entry("1.0.0")]
		expect(findVersion(input, "2.0.0")).toBeUndefined()
	})
})
