import { describe, expect, it } from "bun:test"
import { CliError, httpError, redactKey } from "../src/lib/errors"

describe("redactKey", () => {
	it("redacts short keys completely", () => {
		expect(redactKey("abcd")).toBe("****")
	})

	it("shows first 4 and last 4 of long keys", () => {
		expect(redactKey("ABCD-1234-EFGH-5678")).toBe("ABCD..5678")
	})

	it("handles exactly 8 characters", () => {
		expect(redactKey("12345678")).toBe("****")
	})

	it("handles 9 characters", () => {
		expect(redactKey("123456789")).toBe("1234..6789")
	})
})

describe("httpError", () => {
	it("returns CliError for all status codes", () => {
		expect(httpError(401, "/test")).toBeInstanceOf(CliError)
		expect(httpError(403, "/test")).toBeInstanceOf(CliError)
		expect(httpError(404, "/test")).toBeInstanceOf(CliError)
		expect(httpError(429, "/test")).toBeInstanceOf(CliError)
		expect(httpError(500, "/test")).toBeInstanceOf(CliError)
	})

	it("mentions the URL for 404", () => {
		const err = httpError(404, "/api/releases/key/1.0.0")
		expect(err.message).toContain("/api/releases/key/1.0.0")
	})
})

describe("CliError", () => {
	it("has a default exit code of 1", () => {
		const err = new CliError("test")
		expect(err.exitCode).toBe(1)
	})

	it("accepts a custom exit code", () => {
		const err = new CliError("test", 2)
		expect(err.exitCode).toBe(2)
	})
})
