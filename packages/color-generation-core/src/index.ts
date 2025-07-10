import { generateRadixColors } from "./radixColorGeneration";

// Type definitions for color inputs
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

// Type for a complete color scale output
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

// Configuration interface for generation options
export interface GenerationConfig {
	includeAlpha?: boolean;
	includeWideGamut?: boolean;
	includeGrayScale?: boolean;
	includeOverlays?: boolean;
}

// Complete color system output
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

// Default configuration
export const defaultConfig: Required<GenerationConfig> = {
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	includeOverlays: true,
};

/**
 * Generate complete color scales from color definitions
 */
export function generateColorSystem(colorInput: ColorInput, config: GenerationConfig = {}): ColorSystem {
	const fullConfig = { ...defaultConfig, ...config };
	const colorNames = Object.keys(colorInput.light);

	const lightColorScales: Record<string, ColorScale> = {};
	const darkColorScales: Record<string, ColorScale> = {};

	// Generate light mode color scales
	for (const colorName of colorNames) {
		lightColorScales[colorName] = generateRadixColors({
			appearance: "light",
			accent: colorInput.light[colorName]!,
			gray: colorInput.constants.light.gray,
			background: colorInput.constants.light.background,
		});
	}

	// Generate dark mode color scales
	for (const colorName of colorNames) {
		darkColorScales[colorName] = generateRadixColors({
			appearance: "dark",
			accent: colorInput.dark[colorName]!,
			gray: colorInput.constants.dark.gray,
			background: colorInput.constants.dark.background,
		});
	}

	return {
		light: lightColorScales,
		dark: darkColorScales,
		colorNames,
		sourceColors: colorInput,
		metadata: {
			generatedAt: new Date().toISOString(),
			totalColors: colorNames.length,
			totalScales: colorNames.length * 2, // light + dark
			config: fullConfig,
		},
	};
}

/**
 * Get a specific color scale
 */
export function getColorScale(colorSystem: ColorSystem, colorName: string, appearance: "light" | "dark"): ColorScale {
	const scale = appearance === "light" ? colorSystem.light[colorName] : colorSystem.dark[colorName];

	if (!scale) {
		throw new Error(`Color scale not found for ${colorName} in ${appearance} mode`);
	}

	return scale;
}

/**
 * Load color definitions from a TypeScript/JavaScript file
 */
export async function loadColorDefinitions(filePath: string): Promise<ColorInput> {
	try {
		// Import the color definitions dynamically
		const colorModule = await import(filePath);

		// Try to find the color definitions in various export patterns
		const light = colorModule._light || colorModule.light || colorModule.lightColors;
		const dark = colorModule._dark || colorModule.dark || colorModule.darkColors;
		const constantsLight = colorModule._constantsLight || colorModule.constantsLight || colorModule.light_constants;
		const constantsDark = colorModule._constantsDark || colorModule.constantsDark || colorModule.dark_constants;

		if (!light || !dark || !constantsLight || !constantsDark) {
			throw new Error("Required color definitions not found. Expected: light, dark, constantsLight, constantsDark");
		}

		return {
			light,
			dark,
			constants: {
				light: constantsLight,
				dark: constantsDark,
			},
		};
	} catch (error) {
		throw new Error(`Failed to load color definitions from ${filePath}: ${error}`);
	}
}

/**
 * Create a color input from simple color objects
 */
export function createColorInput(
	lightColors: ColorDefinition,
	darkColors: ColorDefinition,
	lightConstants: ColorConstants,
	darkConstants: ColorConstants,
): ColorInput {
	return {
		light: lightColors,
		dark: darkColors,
		constants: {
			light: lightConstants,
			dark: darkConstants,
		},
	};
}

/**
 * Validate color input structure
 */
export function validateColorInput(colorInput: ColorInput): void {
	const lightKeys = Object.keys(colorInput.light);
	const darkKeys = Object.keys(colorInput.dark);

	if (lightKeys.length === 0) {
		throw new Error("Light color definitions cannot be empty");
	}

	if (darkKeys.length === 0) {
		throw new Error("Dark color definitions cannot be empty");
	}

	// Check if light and dark have the same keys
	const missingInDark = lightKeys.filter((key) => !darkKeys.includes(key));
	const missingInLight = darkKeys.filter((key) => !lightKeys.includes(key));

	if (missingInDark.length > 0) {
		throw new Error(`Missing dark variants for colors: ${missingInDark.join(", ")}`);
	}

	if (missingInLight.length > 0) {
		throw new Error(`Missing light variants for colors: ${missingInLight.join(", ")}`);
	}

	// Validate constants
	if (!colorInput.constants.light.gray || !colorInput.constants.light.background) {
		throw new Error("Light constants must include gray and background");
	}

	if (!colorInput.constants.dark.gray || !colorInput.constants.dark.background) {
		throw new Error("Dark constants must include gray and background");
	}
}

// Re-export the radix color generation function for advanced use cases
export { generateRadixColors } from "./radixColorGeneration";
