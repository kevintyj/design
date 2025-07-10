export interface ColorDefinition {
	[colorName: string]: string;
}
export interface ColorConstants {
	gray: string;
	background: string;
}
export interface ColorInput {
	light: ColorDefinition;
	dark: ColorDefinition;
	constants: {
		light: ColorConstants;
		dark: ColorConstants;
	};
}
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
export interface GenerationConfig {
	includeAlpha?: boolean;
	includeWideGamut?: boolean;
	includeGrayScale?: boolean;
	includeOverlays?: boolean;
}
export interface ColorSystem {
	light: Record<string, ColorScale>;
	dark: Record<string, ColorScale>;
	colorNames: string[];
	sourceColors: ColorInput;
	metadata: {
		generatedAt: string;
		totalColors: number;
		totalScales: number;
		config: Required<GenerationConfig>;
	};
}
export declare const defaultConfig: Required<GenerationConfig>;
/**
 * Generate complete color scales from color definitions
 */
export declare function generateColorSystem(colorInput: ColorInput, config?: GenerationConfig): ColorSystem;
/**
 * Get a specific color scale
 */
export declare function getColorScale(
	colorSystem: ColorSystem,
	colorName: string,
	appearance: "light" | "dark",
): ColorScale;
/**
 * Load color definitions from a TypeScript/JavaScript file
 */
export declare function loadColorDefinitions(filePath: string): Promise<ColorInput>;
/**
 * Create a color input from simple color objects
 */
export declare function createColorInput(
	lightColors: ColorDefinition,
	darkColors: ColorDefinition,
	lightConstants: ColorConstants,
	darkConstants: ColorConstants,
): ColorInput;
/**
 * Validate color input structure
 */
export declare function validateColorInput(colorInput: ColorInput): void;
export {
	generateOverlayColors,
	generateOverlayColorsForFormat,
	getOverlayAlphas,
	getOverlayColor,
} from "./overlayGeneration";
export { generateRadixColors } from "./radixColorGeneration";
