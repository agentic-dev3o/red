/**
 * Structured output helpers.
 *
 * Machine-readable JSON goes to stdout so skills can parse it.
 * Human-readable progress goes to stderr so it never breaks piped JSON.
 */

/** Write a JSON payload to stdout (machine-readable channel). */
export function json(data: unknown): void {
	process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
}

/** Write a progress step to stderr. */
export function progress(message: string): void {
	process.stderr.write(`  ${message}\n`)
}

/** Write a success step to stderr. */
export function success(message: string): void {
	process.stderr.write(`  \u2713 ${message}\n`)
}

/** Write an error message to stderr. */
export function error(message: string): void {
	process.stderr.write(`\n  Error: ${message}\n\n`)
}

/** Write a warning to stderr. */
export function warn(message: string): void {
	process.stderr.write(`  ! ${message}\n`)
}

/** Print a blank line to stderr for readability. */
export function blank(): void {
	process.stderr.write("\n")
}
