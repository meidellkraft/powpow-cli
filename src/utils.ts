export function isBareSpecifier(specifier: string): boolean {
	if (specifier.startsWith('.') || specifier.startsWith('/')) return false;
	if (/\.(tsx?|jsx?|mts|cts|mjs|cjs)$/.test(specifier)) return false;
	return true;
}
