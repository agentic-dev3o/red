/**
 * CLI error handling with friendly messages and license-key redaction.
 */

export class CliError extends Error {
	constructor(
		message: string,
		public readonly exitCode: number = 1,
	) {
		super(message)
		this.name = "CliError"
	}
}

/** Redact the middle of a license key so it never leaks into logs or screenshots. */
export function redactKey(key: string): string {
	if (key.length <= 8) return "****"
	return `${key.slice(0, 4)}..${key.slice(-4)}`
}

/** Map common HTTP status codes to actionable remediation text. */
export function httpError(status: number, url: string): CliError {
	switch (status) {
		case 401:
		case 403:
			return new CliError(
				`License key is invalid or expired (HTTP ${status}).\n` +
					"  Check your key and try again, or contact support at contact@dev3o.com",
			)
		case 404:
			return new CliError(
				`Resource not found (HTTP ${status}): ${url}\n` +
					"  The requested version may not exist. Run 'create-red-app versions' to see available releases.",
			)
		case 429:
			return new CliError("Rate limited by the license server. Please wait a moment and try again.")
		default:
			return new CliError(
				`Unexpected response from license server (HTTP ${status}): ${url}\n` +
					"  If this persists, please contact support at contact@dev3o.com",
			)
	}
}
