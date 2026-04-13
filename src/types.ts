export interface EntryPoint {
	source: string;
	target: string;
}

export interface PowpowConfig {
	$schema?: string;
	version?: string;
	portalConfigPath: string;
	sourceDir?: string;
	entryPoints: EntryPoint[];
	globals?: Record<string, string>;
}

export type ResourceType = 'web-template' | 'web-file';

export interface PortalResource {
	guid: string;
	type: ResourceType;
	name: string;
	contentPath: string;
	runtimeUrl?: string;
}
