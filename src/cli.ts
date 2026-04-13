#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

// Parse --config option
let configPath: string | undefined;
const configIdx = args.indexOf('--config');
if (configIdx !== -1 && args[configIdx + 1]) {
	configPath = args[configIdx + 1];
}

const usage = `
Usage: powpow <command> [options]

Commands:
  init     Initialize a new powpow.config.json
  add      Add a portal resource as an entry point
  dev      Start dev server + rolldown watch mode
  build    Type-check and build with rolldown
  serve    Start the dev server only

Options:
  --config <path>  Path to powpow.config.json (default: ./powpow.config.json)
  --force          Overwrite existing config (init only)
  -h, --help       Show this help message
`;

async function main(): Promise<void> {
	if (!command || command === '--help' || command === '-h') {
		console.log(usage.trim());
		process.exit(0);
	}

	switch (command) {
		case 'init': {
			const { init } = await import('./commands/init.js');
			await init({ configPath, force: args.includes('--force') });
			break;
		}

		case 'add': {
			const { add } = await import('./commands/add.js');
			await add({ configPath });
			break;
		}

		case 'dev': {
			const { dev } = await import('./commands/dev.js');
			await dev({ configPath });
			break;
		}

		case 'build': {
			const { build } = await import('./commands/build.js');
			await build({ configPath });
			break;
		}

		case 'serve': {
			const { serve } = await import('./commands/serve.js');
			await serve({ configPath });
			break;
		}

		default:
			console.error(`Unknown command: ${command}`);
			console.log(usage.trim());
			process.exit(1);
	}
}

// Graceful shutdown on SIGINT/SIGTERM (e.g. Ctrl+C)
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
