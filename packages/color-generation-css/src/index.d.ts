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
export interface CSSGenerationConfig extends GenerationConfig {
	outputDir?: string;
	generateSeparateFiles?: boolean;
	generateCombinedFile?: boolean;
	prefix?: string;
	includeComments?: boolean;
	variant?: "full" | "clean" | "hexa-only" | "p3-only";
}
export declare const defaultCSSConfig: Required<CSSGenerationConfig>;
/**
 * Generate CSS custom properties for a single color scale
 */
export declare function generateCSSForColorScale(
	colorName: string,
	colorScale: ColorScale,
	appearance: "light" | "dark",
	config?: CSSGenerationConfig,
): string;
/**
 * Generate CSS custom properties for all colors
 */
export declare function generateCSSForColorSystem(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config?: CSSGenerationConfig,
): string;
/**
 * Generate CSS files from a color system
 */
export declare function generateCSSFiles(colorSystem: ColorSystem, config?: CSSGenerationConfig): string[];
/**
 * Generate utility classes for Tailwind CSS or similar frameworks
 */
export declare function generateUtilityClasses(colorSystem: ColorSystem, config?: CSSGenerationConfig): string;
