import { describe, expect, it } from "bun:test"
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const CLI = resolve(import.meta.dirname, "../src/cli.ts")

function run(...args: string[]) {
	const env = { ...process.env }
	delete env.RED_LICENSE_KEY
	const result = spawnSync("bun", ["run", CLI, ...args], {
		timeout: 5000,
		env,
	})
	return {
		stdout: result.stdout?.toString() ?? "",
		stderr: result.stderr?.toString() ?? "",
		status: result.status,
	}
}

// ---------------------------------------------------------------------------
// Help and version flags
// ---------------------------------------------------------------------------

describe("CLI arg routing", () => {
	it("no args prints help to stderr", () => {
		const { stderr } = run()
		expect(stderr).toContain("Usage:")
		expect(stderr).toContain("create-red-app")
	})

	it("-h prints help", () => {
		const { stderr } = run("-h")
		expect(stderr).toContain("Usage:")
	})

	it("--help prints help", () => {
		const { stderr } = run("--help")
		expect(stderr).toContain("Usage:")
	})

	it("-v prints the CLI version", () => {
		const { stdout } = run("-v")
		expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
	})

	it("--version without a value prints the CLI version", () => {
		const { stdout } = run("--version")
		expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
	})

	it("--version <ver> does NOT short-circuit to version display", () => {
		const { stdout, stderr } = run("mydir", "--version", "1.5.0")
		// Should not print the CLI version
		expect(stdout).toBe("")
		// Should attempt scaffold and fail on missing license
		expect(stderr.toLowerCase()).toContain("license")
	})

	it("--version before a flag still shows version", () => {
		const { stdout } = run("--version", "--help")
		// --help is checked first, so help is shown
		expect(stdout).toBe("")
	})
})

// ---------------------------------------------------------------------------
// Command routing errors
// ---------------------------------------------------------------------------

describe("command routing", () => {
	it("scaffold without license key errors", () => {
		const { stderr, status } = run("my-project")
		expect(status).not.toBe(0)
		expect(stderr.toLowerCase()).toContain("license")
	})

	it("versions without license key errors", () => {
		const { stderr, status } = run("versions")
		expect(status).not.toBe(0)
		expect(stderr.toLowerCase()).toContain("license")
	})

	it("info without version argument errors", () => {
		const { stderr, status } = run("info", "--license", "fake-key")
		expect(status).not.toBe(0)
		expect(stderr.toLowerCase()).toContain("missing version")
	})

	it("download without version argument errors", () => {
		const { stderr, status } = run("download", "--license", "fake-key")
		expect(status).not.toBe(0)
		expect(stderr.toLowerCase()).toContain("missing version")
	})
})
