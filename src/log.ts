const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

function fmt(color: string, tag: string, message: string): string {
	return `${color}[${tag}] ${message}${RESET}`;
}

export const log = {
	warn(message: string, tag = 'powpow'): void {
		console.warn(fmt(YELLOW, tag, `⚠ ${message}`));
	},
	success(message: string, tag = 'powpow'): void {
		console.log(fmt(GREEN, tag, `✓ ${message}`));
	},
	info(message: string, tag = 'powpow'): void {
		console.log(fmt(BLUE, tag, message));
	},
	error(message: string, tag = 'powpow'): void {
		console.error(fmt(RED, tag, message));
	},
	errorRaw(message: string): void {
		console.error(`${RED}${message}${RESET}`);
	},
	successRaw(message: string): void {
		console.log(`${GREEN}${message}${RESET}`);
	},
	prefix(tag: string): string {
		return `${BLUE}[${tag}]${RESET} `;
	},
};
