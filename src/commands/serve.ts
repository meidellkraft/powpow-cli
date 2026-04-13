import { findConfig, loadConfig, resolveProjectRoot, resolvePortalDir } from '../config.js';
import { startDevServer } from '../dev-server.js';

interface ServeOptions {
	configPath?: string;
}

export async function serve({ configPath }: ServeOptions): Promise<void> {
	const resolvedConfigPath = findConfig(configPath);
	const config = loadConfig(resolvedConfigPath);
	const projectRoot = resolveProjectRoot(resolvedConfigPath);
	const portalDir = resolvePortalDir(config, projectRoot);

	startDevServer({
		portalDir,
		port: parseInt(process.env.PORT ?? '3001', 10),
		config,
	});
}
