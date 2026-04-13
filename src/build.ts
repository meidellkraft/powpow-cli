import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { watch as fsWatch } from 'node:fs';
import { rolldown } from 'rolldown';
import { powpow } from './plugin.js';
import { validateEntryPoints, resolvePortalDir } from './config.js';
import type { PowpowConfig, PortalResource } from './types.js';
import type { InputOptions, OutputOptions } from 'rolldown';
import { log } from './log.js';
import { scanPortalResources } from './resources.js';

function createEntryBuildConfig(
	config: PowpowConfig,
	projectRoot: string,
	entry: { source: string; target: string },
	inlinedPackages: Map<string, Set<string>>,
	resourceMap: Map<string, PortalResource>,
): { inputOptions: InputOptions; outputOptions: OutputOptions } {
	const sourceDir = config.sourceDir ?? 'src';
	const { input, plugin } = powpow({
		portalDir: config.portalConfigPath,
		entry,
		root: projectRoot,
		sourceDir,
		globals: config.globals,
		allEntries: config.entryPoints,
		inlinedPackages,
		resourceMap,
	});

	const inputOptions: InputOptions = {
		input,
		platform: 'browser',
		plugins: [plugin],
	};

	const outputOptions: OutputOptions = {
		entryFileNames: '[name]',
		format: 'es',
		dir: resolve(projectRoot, 'dist'),
		minify: true,
	};

	return { inputOptions, outputOptions };
}

async function buildEntry(
	config: PowpowConfig,
	projectRoot: string,
	entry: { source: string; target: string },
	inlinedPackages: Map<string, Set<string>>,
	resourceMap: Map<string, PortalResource>,
): Promise<void> {
	const { inputOptions, outputOptions } = createEntryBuildConfig(config, projectRoot, entry, inlinedPackages, resourceMap);
	const bundle = await rolldown(inputOptions);
	await bundle.write(outputOptions);
	await bundle.close();
}

export async function build(config: PowpowConfig, projectRoot: string): Promise<void> {
	validateEntryPoints(config, projectRoot);

	const portalDir = resolvePortalDir(config, projectRoot);
	const resourceMap = scanPortalResources(portalDir);
	const inlinedPackages = new Map<string, Set<string>>();
	await Promise.all(config.entryPoints.map((entry) => buildEntry(config, projectRoot, entry, inlinedPackages, resourceMap)));

	for (const [pkg, entries] of inlinedPackages) {
		if (entries.size > 1) {
			log.warn(
				`Package "${pkg}" is inlined by ${entries.size} entry points. ` +
				`Consider creating a web-file entry point with source "${pkg}" to avoid code duplication.`,
			);
		}
	}
}

export async function watchBuild(config: PowpowConfig, projectRoot: string): Promise<void> {
	const sourceDir = resolve(projectRoot, config.sourceDir ?? 'src');

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let building = false;

	async function rebuild() {
		if (building) return;
		building = true;
		log.info('Building\u2026', 'watch');
		const start = performance.now();
		try {
			await build(config, projectRoot);
			log.info(`Built in ${Math.round(performance.now() - start)}ms`, 'watch');
		} catch (error) {
			log.error('Build error:', 'watch');
			console.error(error);
		} finally {
			building = false;
		}
	}

	// Initial build
	await rebuild();

	const watcher = fsWatch(sourceDir, { recursive: true }, (_event, _filename) => {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(rebuild, 100);
	});

	return new Promise<void>((resolvePromise) => {
		const shutdown = () => {
			watcher.close();
			if (debounceTimer) clearTimeout(debounceTimer);
			resolvePromise();
		};
		process.on('SIGINT', shutdown);
		process.on('SIGTERM', shutdown);
	});
}

export function typeCheck(projectRoot: string): Promise<void> {
	return new Promise((done, fail) => {
		const tscPath = resolve(projectRoot, 'node_modules', '.bin', 'tsc');
		const prefix = log.prefix('tsc');

		const child = spawn(tscPath, [], {
			cwd: projectRoot,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, FORCE_COLOR: '1' },
		});

		child.stdout?.on('data', (data: Buffer) => {
			for (const line of data.toString().split('\n')) {
				if (line) process.stdout.write(prefix + line + '\n');
			}
		});

		child.stderr?.on('data', (data: Buffer) => {
			for (const line of data.toString().split('\n')) {
				if (line) process.stderr.write(prefix + line + '\n');
			}
		});

		child.on('exit', (code) => {
			if (code === 0 || code === null) done();
			else fail(new Error(`tsc exited with code ${code}`));
		});

		process.on('SIGINT', () => child.kill('SIGTERM'));
		process.on('SIGTERM', () => child.kill('SIGTERM'));
	});
}
