import { findConfig, loadConfig, resolveProjectRoot } from '../config.js';
import { typeCheck, build as runBuild } from '../build.js';

interface BuildOptions {
	configPath?: string;
}

export async function build({ configPath }: BuildOptions): Promise<void> {
	const resolvedConfigPath = findConfig(configPath);
	const config = loadConfig(resolvedConfigPath);
	const projectRoot = resolveProjectRoot(resolvedConfigPath);

	await typeCheck(projectRoot);
	await runBuild(config, projectRoot);
}
