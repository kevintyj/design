#!/usr/bin/env bun

import { cli } from "./cli";

// Re-export CLI functionality
export * from "./cli";

// Export types for external use
export interface CLIConfig {
	input: string;
	outputDir: string;
	formats: ("css" | "json" | "all")[];
	includeAlpha: boolean;
	includeWideGamut: boolean;
	includeGrayScale: boolean;
	verbose: boolean;
	watch?: boolean;
}

// Only run CLI if this script is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	cli().catch((error) => {
		console.error("❌ Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
