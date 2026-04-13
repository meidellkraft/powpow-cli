import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import type { PowpowConfig } from './types.js';
import { isBareSpecifier } from './utils.js';

const CONFIG_FILENAME = 'powpow.config.json';

export function findConfig(configPath?: string): string {
	if (configPath) {
		const abs = resolve(configPath);
		if (!existsSync(abs)) {
			throw new Error(`Config file not found: ${abs}`);
		}
		return abs;
	}

	const candidate = resolve(process.cwd(), CONFIG_FILENAME);
	if (!existsSync(candidate)) {
		throw new Error(
			`No ${CONFIG_FILENAME} found in ${process.cwd()}. Run "powpow init" to create one, or use --config to specify a path.`,
		);
	}
	return candidate;
}

export function loadConfig(configPath: string): PowpowConfig {
	const raw = readFileSync(configPath, 'utf8');
	const config: PowpowConfig = JSON.parse(raw);

	if (!config.portalConfigPath || typeof config.portalConfigPath !== 'string') {
		throw new Error(`Invalid config: "portalConfigPath" is required (in ${configPath})`);
	}
	if (!Array.isArray(config.entryPoints)) {
		throw new Error(`Invalid config: "entryPoints" must be an array (in ${configPath})`);
	}
	if (config.globals !== undefined) {
		if (typeof config.globals !== 'object' || config.globals === null || Array.isArray(config.globals)) {
			throw new Error(`Invalid config: "globals" must be an object mapping package names to global variable names (in ${configPath})`);
		}
		for (const [key, value] of Object.entries(config.globals)) {
			if (typeof value !== 'string') {
				throw new Error(`Invalid config: "globals.${key}" must be a string (in ${configPath})`);
			}
		}
	}

	return config;
}

export function saveConfig(configPath: string, config: PowpowConfig): void {
	writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n');
}

export function resolveProjectRoot(configPath: string): string {
	return dirname(configPath);
}

export function resolveSourceDir(config: PowpowConfig, projectRoot: string): string {
	return resolve(projectRoot, config.sourceDir ?? 'src');
}

export function resolvePortalDir(config: PowpowConfig, projectRoot: string): string {
	return resolve(projectRoot, config.portalConfigPath);
}

export function validateEntryPoints(config: PowpowConfig, projectRoot: string): void {
	const sourceDir = resolveSourceDir(config, projectRoot);
	const dirToEntries = new Map<string, string[]>();

	for (const entry of config.entryPoints) {
		// Skip bare specifiers (npm packages) – they don't occupy a directory
		if (isBareSpecifier(entry.source)) {
			continue;
		}
		const absSource = resolve(sourceDir, entry.source);
		const relSource = relative(sourceDir, absSource);
		const dir = dirname(relSource);
		const existing = dirToEntries.get(dir);
		if (existing) {
			existing.push(entry.source);
		} else {
			dirToEntries.set(dir, [entry.source]);
		}
	}

	for (const [dir, sources] of dirToEntries) {
		if (sources.length > 1) {
			const dirLabel = dir === '.' ? 'sourceDir root' : `"${dir}"`;
			throw new Error(
				`Multiple entry points share the same directory ${dirLabel}: ${sources.join(', ')}. ` +
				`Only one file-based entry point is allowed per directory.`,
			);
		}
	}
}
