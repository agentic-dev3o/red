import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { cleanupTemp, copyDirRecursive, createTempDir, unwrapPrefix } from "../src/lib/archive"

// ---------------------------------------------------------------------------
// unwrapPrefix
// ---------------------------------------------------------------------------

describe("unwrapPrefix", () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "red-test-"))
	})

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true })
	})

	it("unwraps a single red-boilerplate/ directory", () => {
		const inner = join(tempDir, "red-boilerplate")
		mkdirSync(inner)
		writeFileSync(join(inner, "package.json"), "{}")

		const result = unwrapPrefix(tempDir)
		expect(result).toBe(inner)
	})

	it("returns dir as-is when no prefix match", () => {
		mkdirSync(join(tempDir, "some-other-dir"))
		const result = unwrapPrefix(tempDir)
		expect(result).toBe(tempDir)
	})

	it("returns dir as-is when multiple entries exist", () => {
		mkdirSync(join(tempDir, "red-boilerplate"))
		writeFileSync(join(tempDir, "extra-file.txt"), "")
		const result = unwrapPrefix(tempDir)
		expect(result).toBe(tempDir)
	})
})

// ---------------------------------------------------------------------------
// copyDirRecursive
// ---------------------------------------------------------------------------

describe("copyDirRecursive", () => {
	let srcDir: string
	let destDir: string

	beforeEach(() => {
		srcDir = mkdtempSync(join(tmpdir(), "red-copy-src-"))
		destDir = join(mkdtempSync(join(tmpdir(), "red-copy-dest-")), "out")
	})

	afterEach(() => {
		rmSync(srcDir, { recursive: true, force: true })
		rmSync(destDir, { recursive: true, force: true })
	})

	it("copies files and directories", () => {
		writeFileSync(join(srcDir, "file.txt"), "hello")
		mkdirSync(join(srcDir, "subdir"))
		writeFileSync(join(srcDir, "subdir", "nested.txt"), "world")

		copyDirRecursive(srcDir, destDir)

		expect(readFileSync(join(destDir, "file.txt"), "utf-8")).toBe("hello")
		expect(readFileSync(join(destDir, "subdir", "nested.txt"), "utf-8")).toBe("world")
	})

	it("preserves dotfiles and hidden directories", () => {
		writeFileSync(join(srcDir, ".env.example"), "KEY=val")
		mkdirSync(join(srcDir, ".claude"))
		mkdirSync(join(srcDir, ".claude", "skills"))
		writeFileSync(join(srcDir, ".claude", "skills", "SKILL.md"), "# skill")

		copyDirRecursive(srcDir, destDir)

		expect(existsSync(join(destDir, ".env.example"))).toBe(true)
		expect(existsSync(join(destDir, ".claude", "skills", "SKILL.md"))).toBe(true)
		expect(readFileSync(join(destDir, ".claude", "skills", "SKILL.md"), "utf-8")).toBe("# skill")
	})

	it("preserves symlinks", () => {
		writeFileSync(join(srcDir, "target.txt"), "target content")
		symlinkSync("target.txt", join(srcDir, "link.txt"))

		copyDirRecursive(srcDir, destDir)

		expect(existsSync(join(destDir, "link.txt"))).toBe(true)
		// The symlink should point to the same relative target
		const { readlinkSync } = require("node:fs")
		expect(readlinkSync(join(destDir, "link.txt"))).toBe("target.txt")
	})
})

// ---------------------------------------------------------------------------
// createTempDir / cleanupTemp
// ---------------------------------------------------------------------------

describe("createTempDir", () => {
	it("creates a directory that exists", () => {
		const dir = createTempDir("red-test-")
		expect(existsSync(dir)).toBe(true)
		cleanupTemp(dir)
	})
})

describe("cleanupTemp", () => {
	it("removes the directory", () => {
		const dir = createTempDir("red-test-cleanup-")
		writeFileSync(join(dir, "file.txt"), "data")
		cleanupTemp(dir)
		expect(existsSync(dir)).toBe(false)
	})

	it("does not throw on non-existent directory", () => {
		expect(() => cleanupTemp("/tmp/red-nonexistent-12345")).not.toThrow()
	})
})
