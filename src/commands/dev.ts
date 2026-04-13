import { findConfig, loadConfig, resolveProjectRoot, resolvePortalDir } from '../config.js';
import { startDevServer } from '../dev-server.js';
import { watchBuild } from '../build.js';

interface DevOptions {
	configPath?: string;
}

export async function dev({ configPath }: DevOptions): Promise<void> {
	const resolvedConfigPath = findConfig(configPath);
	const config = loadConfig(resolvedConfigPath);
	const projectRoot = resolveProjectRoot(resolvedConfigPath);
	const portalDir = resolvePortalDir(config, projectRoot);

	startDevServer({
		portalDir,
		port: parseInt(process.env.PORT ?? '3001', 10),
		config,
	});

	await watchBuild(config, projectRoot);
}
