/**
 * SHA-256 verification for downloaded archives.
 */

import { createHash } from "node:crypto"
import { CliError } from "./errors"

export function sha256(data: Buffer): string {
	return createHash("sha256").update(data).digest("hex")
}

export function verifyChecksum(data: Buffer, expected: string): void {
	const actual = sha256(data)
	if (actual !== expected) {
		throw new CliError(
			`Checksum verification failed.\n` +
				`  Expected: ${expected}\n` +
				`  Received: ${actual}\n\n` +
				"  The archive may be corrupted or tampered with.\n" +
				"  Try downloading again, or contact support at contact@dev3o.com",
		)
	}
}
