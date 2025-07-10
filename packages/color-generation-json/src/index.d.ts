export interface ColorScale {
	accentScale: string[];
	accentScaleAlpha: string[];
	accentScaleWideGamut: string[];
	accentScaleAlphaWideGamut: string[];
	accentContrast: string;
	grayScale: string[];
	grayScaleAlpha: string[];
	grayScaleWideGamut: string[];
	grayScaleAlphaWideGamut: string[];
	graySurface: string;
	graySurfaceWideGamut: string;
	accentSurface: string;
	accentSurfaceWideGamut: string;
	background: string;
	overlays: {
		black: string[];
		white: string[];
	};
}
export interface ColorSystem {
	light: Record<string, ColorScale>;
	dark: Record<string, ColorScale>;
	colorNames: string[];
	sourceColors: any;
	metadata: {
		generatedAt: string;
		totalColors: number;
		totalScales: number;
		config: any;
	};
}
export interface GenerationConfig {
	includeAlpha?: boolean;
	includeWideGamut?: boolean;
	includeGrayScale?: boolean;
	includeOverlays?: boolean;
}
export interface JSONGenerationConfig extends GenerationConfig {
	outputDir?: string;
	format?: "flat" | "nested" | "tokens" | "tailwind" | "collections" | "all";
	includeMetadata?: boolean;
	prettyPrint?: boolean;
	fileExtension?: string;
	separateMetadata?: boolean;
	collectionName?: string;
}
export interface CollectionFormat {
	name: string;
	modes: string[];
	variables: {
		solid: Record<
			string,
			Record<
				string,
				{
					type: string;
					values: Record<string, string>;
				}
			>
		>;
		alpha: Record<
			string,
			Record<
				string,
				{
					type: string;
					values: Record<string, string>;
				}
			>
		>;
		overlays: Record<
			string,
			Record<
				string,
				{
					type: string;
					values: Record<string, string>;
				}
			>
		>;
	};
}
export interface CollectionOutput {
	collections: CollectionFormat[];
}
export declare const defaultJSONConfig: Required<JSONGenerationConfig>;
/**
 * Generate comprehensive metadata JSON for all formats and modes
 */
export declare function generateMetadataJSON(colorSystem: ColorSystem, config?: JSONGenerationConfig): any;
/**
 * Generate flat JSON format (all colors at root level) - WITH universal gray scale
 */
export declare function generateFlatJSON(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config?: JSONGenerationConfig,
): Record<string, string>;
/**
 * Generate nested JSON format (colors grouped by name) - WITH universal gray scale
 */
export declare function generateNestedJSON(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config?: JSONGenerationConfig,
): Record<string, any>;
/**
 * Generate collections format JSON (your requested format) - WITH universal gray scale
 */
export declare function generateCollectionsJSON(
	colorSystem: ColorSystem,
	config?: JSONGenerationConfig,
): CollectionOutput;
/**
 * Generate design tokens format (following design token spec) - WITH universal gray scale
 */
export declare function generateDesignTokensJSON(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config?: JSONGenerationConfig,
): any;
/**
 * Generate Tailwind config format - WITH universal gray scale
 */
export declare function generateTailwindJSON(colorSystem: ColorSystem, config?: JSONGenerationConfig): any;
/**
 * Generate JSON files from a color system
 */
export declare function generateJSONFiles(colorSystem: ColorSystem, config?: JSONGenerationConfig): string[];
/**
 * Convert color system to various JSON formats
 */
export declare function convertToJSON(
	colorSystem: ColorSystem,
	format: "flat" | "nested" | "tokens" | "tailwind" | "collections",
	appearance?: "light" | "dark",
	config?: JSONGenerationConfig,
): any;
