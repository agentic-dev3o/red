import { afterEach, describe, expect, it } from "bun:test"
import { CliError } from "../src/lib/errors"

// ---------------------------------------------------------------------------
// Mock fetch for integration tests
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
	// @ts-expect-error — intentionally replacing fetch with a simpler mock
	globalThis.fetch = (input: RequestInfo | URL, _init?: RequestInit) => {
		const url = typeof input === "string" ? input : input.toString()
		return Promise.resolve(handler(url))
	}
}

afterEach(() => {
	globalThis.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validateLicense", () => {
	it("returns valid result", async () => {
		mockFetch(
			() => new Response(JSON.stringify({ valid: true, plan: "pro", email: "test@example.com" }), { status: 200 }),
		)

		const { validateLicense } = await import("../src/lib/api-client")
		const result = await validateLicense("test-key", "https://api.example.com")
		expect(result.valid).toBe(true)
		expect(result.plan).toBe("pro")
	})

	it("returns invalid result", async () => {
		mockFetch(() => new Response(JSON.stringify({ valid: false }), { status: 200 }))

		const { validateLicense } = await import("../src/lib/api-client")
		const result = await validateLicense("bad-key", "https://api.example.com")
		expect(result.valid).toBe(false)
	})
})

describe("fetchVersions", () => {
	it("returns version entries", async () => {
		const versions = [
			{
				version: "1.0.0",
				tag: "v1.0.0",
				prerelease: false,
				publishedAt: "2024-01-01T00:00:00Z",
				archiveFileName: "red-v1.0.0.zip",
			},
			{
				version: "1.1.0-beta.1",
				tag: "v1.1.0-beta.1",
				prerelease: true,
				publishedAt: "2024-02-01T00:00:00Z",
				archiveFileName: "red-v1.1.0-beta.1.zip",
			},
		]

		mockFetch(() => new Response(JSON.stringify({ versions }), { status: 200 }))

		const { fetchVersions } = await import("../src/lib/api-client")
		const result = await fetchVersions("key", "https://api.example.com")
		expect(result).toHaveLength(2)
		expect(result[0].version).toBe("1.0.0")
	})

	it("throws on HTTP error", async () => {
		mockFetch(() => new Response("Forbidden", { status: 403 }))

		const { fetchVersions } = await import("../src/lib/api-client")
		await expect(fetchVersions("key", "https://api.example.com")).rejects.toThrow(CliError)
	})
})

describe("fetchRelease", () => {
	it("normalises stringified migrationManifest", async () => {
		const manifest = { files: ["a.ts", "b.ts"], schemaVersion: 2 }

		mockFetch(
			() =>
				new Response(
					JSON.stringify({
						version: "1.0.0",
						tag: "v1.0.0",
						prerelease: false,
						changelogMd: "# Changes",
						migrationMd: "# Migrations",
						migrationManifest: JSON.stringify(manifest), // string!
						sha256: "abc",
						archiveFileName: "red-v1.0.0.zip",
						publishedAt: 1704067200000,
					}),
					{ status: 200 },
				),
		)

		const { fetchRelease } = await import("../src/lib/api-client")
		const result = await fetchRelease("key", "1.0.0", "https://api.example.com")
		expect(result.migrationManifest).toEqual(manifest)
		expect(typeof result.migrationManifest).toBe("object")
	})

	it("passes through object migrationManifest as-is", async () => {
		const manifest = { files: ["x.ts"] }

		mockFetch(
			() =>
				new Response(
					JSON.stringify({
						version: "1.0.0",
						tag: "v1.0.0",
						prerelease: false,
						changelogMd: "",
						migrationMd: "",
						migrationManifest: manifest, // already object
						sha256: "abc",
						archiveFileName: "red-v1.0.0.zip",
						publishedAt: 1704067200000,
					}),
					{ status: 200 },
				),
		)

		const { fetchRelease } = await import("../src/lib/api-client")
		const result = await fetchRelease("key", "1.0.0", "https://api.example.com")
		expect(result.migrationManifest).toEqual(manifest)
	})
})
