import { describe, expect, it } from "bun:test"
import { sha256, verifyChecksum } from "../src/lib/checksum"
import { CliError } from "../src/lib/errors"

describe("sha256", () => {
	it("produces a hex digest", () => {
		const hash = sha256(Buffer.from("hello"))
		expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
	})

	it("produces consistent results", () => {
		const data = Buffer.from("test data for checksum")
		expect(sha256(data)).toBe(sha256(data))
	})
})

describe("verifyChecksum", () => {
	it("does not throw on matching checksum", () => {
		const data = Buffer.from("hello")
		const expected = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
		expect(() => verifyChecksum(data, expected)).not.toThrow()
	})

	it("throws CliError on mismatch", () => {
		const data = Buffer.from("hello")
		expect(() => verifyChecksum(data, "0000")).toThrow(CliError)
	})
})
