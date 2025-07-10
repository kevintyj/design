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
