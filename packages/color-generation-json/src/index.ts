import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Import types (will be resolved when packages are built)
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
}

// JSON-specific configuration
export interface JSONGenerationConfig extends GenerationConfig {
	outputDir?: string;
	format?: "flat" | "nested" | "tokens" | "tailwind" | "all";
	includeMetadata?: boolean;
	prettyPrint?: boolean;
	fileExtension?: string;
}

// Default JSON generation configuration
export const defaultJSONConfig: Required<JSONGenerationConfig> = {
	outputDir: "output",
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	format: "all",
	includeMetadata: true,
	prettyPrint: true,
	fileExtension: ".json",
};

/**
 * Function to ensure directory exists
 */
function ensureDirectoryExists(dirPath: string): void {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
}

/**
 * Generate flat JSON format (all colors at root level)
 */
export function generateFlatJSON(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config: JSONGenerationConfig = {},
): Record<string, string> {
	const fullConfig = { ...defaultJSONConfig, ...config };
	const colorScales = appearance === "light" ? colorSystem.light : colorSystem.dark;
	const result: Record<string, string> = {};

	for (const colorName of colorSystem.colorNames) {
		const colorScale = colorScales[colorName];
		if (!colorScale) continue;

		// Add main color scale
		colorScale.accentScale.forEach((color: string, index: number) => {
			result[`${colorName}-${index + 1}`] = color;
		});

		// Add alpha variants
		if (fullConfig.includeAlpha) {
			colorScale.accentScaleAlpha.forEach((color: string, index: number) => {
				result[`${colorName}-a${index + 1}`] = color;
			});
		}

		// Add wide gamut variants
		if (fullConfig.includeWideGamut) {
			colorScale.accentScaleWideGamut.forEach((color: string, index: number) => {
				result[`${colorName}-p3-${index + 1}`] = color;
			});
		}

		// Add wide gamut alpha variants
		if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
			colorScale.accentScaleAlphaWideGamut.forEach((color: string, index: number) => {
				result[`${colorName}-p3-a${index + 1}`] = color;
			});
		}

		// Add gray scale
		if (fullConfig.includeGrayScale) {
			colorScale.grayScale.forEach((color: string, index: number) => {
				result[`${colorName}-gray-${index + 1}`] = color;
			});

			if (fullConfig.includeAlpha) {
				colorScale.grayScaleAlpha.forEach((color: string, index: number) => {
					result[`${colorName}-gray-a${index + 1}`] = color;
				});
			}

			if (fullConfig.includeWideGamut) {
				colorScale.grayScaleWideGamut.forEach((color: string, index: number) => {
					result[`${colorName}-gray-p3-${index + 1}`] = color;
				});
			}

			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				colorScale.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					result[`${colorName}-gray-p3-a${index + 1}`] = color;
				});
			}
		}

		// Add special colors
		result[`${colorName}-contrast`] = colorScale.accentContrast;
		result[`${colorName}-surface`] = colorScale.accentSurface;
		result[`${colorName}-gray-surface`] = colorScale.graySurface;

		if (fullConfig.includeWideGamut) {
			result[`${colorName}-surface-p3`] = colorScale.accentSurfaceWideGamut;
			result[`${colorName}-gray-surface-p3`] = colorScale.graySurfaceWideGamut;
		}
	}

	// Add background color
	const firstColor = colorScales[colorSystem.colorNames[0]];
	if (firstColor) {
		result.background = firstColor.background;
	}

	return result;
}

/**
 * Generate nested JSON format (colors grouped by name)
 */
export function generateNestedJSON(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config: JSONGenerationConfig = {},
): Record<string, any> {
	const fullConfig = { ...defaultJSONConfig, ...config };
	const colorScales = appearance === "light" ? colorSystem.light : colorSystem.dark;
	const result: Record<string, any> = {};

	for (const colorName of colorSystem.colorNames) {
		const colorScale = colorScales[colorName];
		if (!colorScale) continue;

		const colorGroup: any = {
			scale: colorScale.accentScale,
			contrast: colorScale.accentContrast,
			surface: colorScale.accentSurface,
		};

		if (fullConfig.includeAlpha) {
			colorGroup.alpha = colorScale.accentScaleAlpha;
		}

		if (fullConfig.includeWideGamut) {
			colorGroup.p3 = colorScale.accentScaleWideGamut;
			colorGroup.surfaceP3 = colorScale.accentSurfaceWideGamut;
		}

		if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
			colorGroup.p3Alpha = colorScale.accentScaleAlphaWideGamut;
		}

		if (fullConfig.includeGrayScale) {
			colorGroup.gray = {
				scale: colorScale.grayScale,
				surface: colorScale.graySurface,
			};

			if (fullConfig.includeAlpha) {
				colorGroup.gray.alpha = colorScale.grayScaleAlpha;
			}

			if (fullConfig.includeWideGamut) {
				colorGroup.gray.p3 = colorScale.grayScaleWideGamut;
				colorGroup.gray.surfaceP3 = colorScale.graySurfaceWideGamut;
			}

			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				colorGroup.gray.p3Alpha = colorScale.grayScaleAlphaWideGamut;
			}
		}

		result[colorName] = colorGroup;
	}

	// Add background color
	const firstColor = colorScales[colorSystem.colorNames[0]];
	if (firstColor) {
		result.background = firstColor.background;
	}

	return result;
}

/**
 * Generate design tokens format (following design token spec)
 */
export function generateDesignTokensJSON(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config: JSONGenerationConfig = {},
): any {
	const fullConfig = { ...defaultJSONConfig, ...config };
	const colorScales = appearance === "light" ? colorSystem.light : colorSystem.dark;

	const tokens: any = {
		color: {},
	};

	for (const colorName of colorSystem.colorNames) {
		const colorScale = colorScales[colorName];
		if (!colorScale) continue;

		tokens.color[colorName] = {};

		// Main scale
		colorScale.accentScale.forEach((color: string, index: number) => {
			tokens.color[colorName][index + 1] = {
				value: color,
				type: "color",
			};
		});

		// Alpha variants
		if (fullConfig.includeAlpha) {
			tokens.color[colorName].alpha = {};
			colorScale.accentScaleAlpha.forEach((color: string, index: number) => {
				tokens.color[colorName].alpha[index + 1] = {
					value: color,
					type: "color",
				};
			});
		}

		// Wide gamut variants
		if (fullConfig.includeWideGamut) {
			tokens.color[colorName].p3 = {};
			colorScale.accentScaleWideGamut.forEach((color: string, index: number) => {
				tokens.color[colorName].p3[index + 1] = {
					value: color,
					type: "color",
				};
			});
		}

		// Special colors
		tokens.color[colorName].contrast = {
			value: colorScale.accentContrast,
			type: "color",
		};

		tokens.color[colorName].surface = {
			value: colorScale.accentSurface,
			type: "color",
		};

		// Gray scale
		if (fullConfig.includeGrayScale) {
			tokens.color[colorName].gray = {};
			colorScale.grayScale.forEach((color: string, index: number) => {
				tokens.color[colorName].gray[index + 1] = {
					value: color,
					type: "color",
				};
			});

			tokens.color[colorName].gray.surface = {
				value: colorScale.graySurface,
				type: "color",
			};
		}
	}

	// Add background
	const firstColor = colorScales[colorSystem.colorNames[0]];
	if (firstColor) {
		tokens.color.background = {
			value: firstColor.background,
			type: "color",
		};
	}

	if (fullConfig.includeMetadata) {
		tokens.$metadata = {
			generatedAt: new Date().toISOString(),
			mode: appearance,
			totalColors: colorSystem.colorNames.length,
			config: fullConfig,
		};
	}

	return tokens;
}

/**
 * Generate Tailwind config format
 */
export function generateTailwindJSON(colorSystem: ColorSystem, config: JSONGenerationConfig = {}): any {
	const _fullConfig = { ...defaultJSONConfig, ...config };

	const tailwindConfig: any = {
		theme: {
			extend: {
				colors: {},
			},
		},
	};

	for (const colorName of colorSystem.colorNames) {
		tailwindConfig.theme.extend.colors[colorName] = {};

		// Light mode colors (default)
		const lightScale = colorSystem.light[colorName];
		if (lightScale) {
			lightScale.accentScale.forEach((color: string, index: number) => {
				tailwindConfig.theme.extend.colors[colorName][index + 1] = color;
			});

			tailwindConfig.theme.extend.colors[colorName].DEFAULT = lightScale.accentScale[8]; // Step 9 (index 8)
			tailwindConfig.theme.extend.colors[colorName].contrast = lightScale.accentContrast;
			tailwindConfig.theme.extend.colors[colorName].surface = lightScale.accentSurface;
		}
	}

	// Add background
	const firstLightColor = colorSystem.light[colorSystem.colorNames[0]];
	if (firstLightColor) {
		tailwindConfig.theme.extend.colors.background = firstLightColor.background;
	}

	return tailwindConfig;
}

/**
 * Generate JSON files from a color system
 */
export function generateJSONFiles(colorSystem: ColorSystem, config: JSONGenerationConfig = {}): string[] {
	const fullConfig = { ...defaultJSONConfig, ...config };
	const outputDir = fullConfig.outputDir;

	// Ensure output directory exists
	ensureDirectoryExists(outputDir);

	const generatedFiles: string[] = [];
	const formats =
		fullConfig.format === "all" ? (["flat", "nested", "tokens", "tailwind"] as const) : ([fullConfig.format] as const);

	for (const format of formats) {
		switch (format) {
			case "flat": {
				// Generate flat format for both modes
				const flatLight = generateFlatJSON(colorSystem, "light", fullConfig);
				const flatDark = generateFlatJSON(colorSystem, "dark", fullConfig);

				writeJSONFile(join(outputDir, `colors-flat-light${fullConfig.fileExtension}`), flatLight, fullConfig);
				writeJSONFile(join(outputDir, `colors-flat-dark${fullConfig.fileExtension}`), flatDark, fullConfig);

				generatedFiles.push(
					join(outputDir, `colors-flat-light${fullConfig.fileExtension}`),
					join(outputDir, `colors-flat-dark${fullConfig.fileExtension}`),
				);
				break;
			}

			case "nested": {
				// Generate nested format for both modes
				const nestedLight = generateNestedJSON(colorSystem, "light", fullConfig);
				const nestedDark = generateNestedJSON(colorSystem, "dark", fullConfig);

				writeJSONFile(join(outputDir, `colors-nested-light${fullConfig.fileExtension}`), nestedLight, fullConfig);
				writeJSONFile(join(outputDir, `colors-nested-dark${fullConfig.fileExtension}`), nestedDark, fullConfig);

				generatedFiles.push(
					join(outputDir, `colors-nested-light${fullConfig.fileExtension}`),
					join(outputDir, `colors-nested-dark${fullConfig.fileExtension}`),
				);
				break;
			}

			case "tokens": {
				// Generate design tokens format for both modes
				const tokensLight = generateDesignTokensJSON(colorSystem, "light", fullConfig);
				const tokensDark = generateDesignTokensJSON(colorSystem, "dark", fullConfig);

				writeJSONFile(join(outputDir, `colors-tokens-light${fullConfig.fileExtension}`), tokensLight, fullConfig);
				writeJSONFile(join(outputDir, `colors-tokens-dark${fullConfig.fileExtension}`), tokensDark, fullConfig);

				generatedFiles.push(
					join(outputDir, `colors-tokens-light${fullConfig.fileExtension}`),
					join(outputDir, `colors-tokens-dark${fullConfig.fileExtension}`),
				);
				break;
			}

			case "tailwind": {
				// Generate Tailwind config (includes both modes via CSS variables)
				const tailwindConfig = generateTailwindJSON(colorSystem, fullConfig);

				writeJSONFile(join(outputDir, `tailwind-colors${fullConfig.fileExtension}`), tailwindConfig, fullConfig);

				generatedFiles.push(join(outputDir, `tailwind-colors${fullConfig.fileExtension}`));
				break;
			}
		}
	}

	// Generate complete color system export
	if (fullConfig.includeMetadata) {
		const completeSystem = {
			...colorSystem,
			config: fullConfig,
		};

		writeJSONFile(join(outputDir, `colors-complete${fullConfig.fileExtension}`), completeSystem, fullConfig);
		generatedFiles.push(join(outputDir, `colors-complete${fullConfig.fileExtension}`));
	}

	return generatedFiles;
}

/**
 * Helper function to write JSON files
 */
function writeJSONFile(filePath: string, data: any, config: Required<JSONGenerationConfig>): void {
	const json = config.prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);

	writeFileSync(filePath, json);
}

/**
 * Convert color system to various JSON formats
 */
export function convertToJSON(
	colorSystem: ColorSystem,
	format: "flat" | "nested" | "tokens" | "tailwind",
	appearance?: "light" | "dark",
	config: JSONGenerationConfig = {},
): any {
	switch (format) {
		case "flat":
			if (!appearance) throw new Error("Appearance is required for flat format");
			return generateFlatJSON(colorSystem, appearance, config);

		case "nested":
			if (!appearance) throw new Error("Appearance is required for nested format");
			return generateNestedJSON(colorSystem, appearance, config);

		case "tokens":
			if (!appearance) throw new Error("Appearance is required for tokens format");
			return generateDesignTokensJSON(colorSystem, appearance, config);

		case "tailwind":
			return generateTailwindJSON(colorSystem, config);

		default:
			throw new Error(`Unknown format: ${format}`);
	}
}
