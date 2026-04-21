/**
 * Archive extraction, root-folder unwrapping, and dotfile-safe copy.
 *
 * The release pipeline produces zip files via `git archive --prefix=red-boilerplate/`.
 * This module extracts to a temp directory, locates the single prefixed root
 * folder, and copies its contents — including dotfiles and hidden directories —
 * to the final destination.
 */

import { execFileSync } from "node:child_process"
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readlinkSync,
	rmSync,
	statSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ARCHIVE_PREFIX } from "./config"
import { CliError } from "./errors"

// ---------------------------------------------------------------------------
// Temp directory management
// ---------------------------------------------------------------------------

export function createTempDir(prefix = "red-"): string {
	return mkdtempSync(join(tmpdir(), prefix))
}

export function cleanupTemp(dir: string): void {
	try {
		rmSync(dir, { recursive: true, force: true })
	} catch {
		// Best-effort cleanup
	}
}

// ---------------------------------------------------------------------------
// Zip extraction (shell-based for zero deps)
// ---------------------------------------------------------------------------

export function extractZip(zipBuffer: Buffer, destDir: string): void {
	mkdirSync(destDir, { recursive: true })
	const zipPath = join(destDir, "archive.zip")
	writeFileSync(zipPath, zipBuffer)

	try {
		execFileSync("unzip", ["-q", "-o", zipPath, "-d", destDir], {
			stdio: "pipe",
		})
	} catch {
		throw new CliError(
			"Could not extract the archive. Please ensure 'unzip' is installed.\n" +
				"  macOS:  available by default\n" +
				"  Linux:  sudo apt install unzip\n" +
				"  Windows: use WSL or install Info-ZIP via your package manager",
		)
	}

	// Remove the zip file from the extraction directory
	try {
		unlinkSync(zipPath)
	} catch {
		// Non-critical
	}
}

// ---------------------------------------------------------------------------
// Root-folder unwrapping
// ---------------------------------------------------------------------------

/**
 * If the extracted directory contains a single folder matching the archive
 * prefix, return the path to that inner folder. Otherwise return the
 * directory as-is.
 */
export function unwrapPrefix(dir: string): string {
	const entries = readdirSync(dir)

	if (entries.length === 1) {
		const candidate = join(dir, entries[0])
		if (statSync(candidate).isDirectory() && entries[0].startsWith(ARCHIVE_PREFIX)) {
			return candidate
		}
	}

	return dir
}

// ---------------------------------------------------------------------------
// Recursive copy (preserves dotfiles, hidden dirs, and symlinks)
// ---------------------------------------------------------------------------

export function copyDirRecursive(src: string, dest: string): void {
	mkdirSync(dest, { recursive: true })

	for (const entry of readdirSync(src, { withFileTypes: true })) {
		const srcPath = join(src, entry.name)
		const destPath = join(dest, entry.name)

		if (entry.isSymbolicLink()) {
			const target = readlinkSync(srcPath)
			symlinkSync(target, destPath)
		} else if (entry.isDirectory()) {
			copyDirRecursive(srcPath, destPath)
		} else {
			copyFileSync(srcPath, destPath)
		}
	}
}
