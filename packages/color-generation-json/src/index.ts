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
	// Add overlay support
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

// JSON-specific configuration
export interface JSONGenerationConfig extends GenerationConfig {
	outputDir?: string;
	format?: "flat" | "nested" | "tokens" | "tailwind" | "collections" | "all";
	includeMetadata?: boolean;
	prettyPrint?: boolean;
	fileExtension?: string;
	separateMetadata?: boolean;
	collectionName?: string;
}

// Add the new collection format interface
export interface CollectionFormat {
	name: string;
	modes: string[];
	variables: {
		solid: Record<string, Record<string, { type: string; values: Record<string, string> }>>;
		alpha: Record<string, Record<string, { type: string; values: Record<string, string> }>>;
		overlays: Record<string, Record<string, { type: string; values: Record<string, string> }>>;
	};
}

export interface CollectionOutput {
	collections: CollectionFormat[];
}

// Default JSON generation configuration
export const defaultJSONConfig: Required<JSONGenerationConfig> = {
	outputDir: "output",
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	includeOverlays: true,
	format: "all",
	includeMetadata: true,
	prettyPrint: true,
	fileExtension: ".json",
	separateMetadata: true,
	collectionName: "Generated Colors",
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
 * Generate comprehensive metadata JSON for all formats and modes
 */
export function generateMetadataJSON(colorSystem: ColorSystem, config: JSONGenerationConfig = {}): any {
	const fullConfig = { ...defaultJSONConfig, ...config };

	return {
		generatedAt: new Date().toISOString(),
		totalColors: colorSystem.colorNames.length,
		totalScales: colorSystem.metadata.totalScales,
		colorNames: colorSystem.colorNames,
		sourceColors: colorSystem.sourceColors,
		modes: ["light", "dark"],
		formats: fullConfig.format === "all" ? ["flat", "nested", "tokens", "tailwind"] : [fullConfig.format],
		config: {
			includeAlpha: fullConfig.includeAlpha,
			includeWideGamut: fullConfig.includeWideGamut,
			includeGrayScale: fullConfig.includeGrayScale,
			format: fullConfig.format,
			prettyPrint: fullConfig.prettyPrint,
		},
		systemMetadata: colorSystem.metadata,
	};
}

/**
 * Generate flat JSON format (all colors at root level) - WITH gray scales as normal colors
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

		// Add gray scale as normal colors
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

		if (fullConfig.includeGrayScale) {
			result[`${colorName}-gray-surface`] = colorScale.graySurface;
		}

		if (fullConfig.includeWideGamut) {
			result[`${colorName}-surface-p3`] = colorScale.accentSurfaceWideGamut;
			if (fullConfig.includeGrayScale) {
				result[`${colorName}-gray-surface-p3`] = colorScale.graySurfaceWideGamut;
			}
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
 * Generate nested JSON format (colors grouped by name) - WITH gray scales as normal colors
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

		// Main color group
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

		result[colorName] = colorGroup;

		// Gray scale as a separate color (treated like normal color)
		if (fullConfig.includeGrayScale) {
			const grayGroup: any = {
				scale: colorScale.grayScale,
				surface: colorScale.graySurface,
			};

			if (fullConfig.includeAlpha) {
				grayGroup.alpha = colorScale.grayScaleAlpha;
			}

			if (fullConfig.includeWideGamut) {
				grayGroup.p3 = colorScale.grayScaleWideGamut;
				grayGroup.surfaceP3 = colorScale.graySurfaceWideGamut;
			}

			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				grayGroup.p3Alpha = colorScale.grayScaleAlphaWideGamut;
			}

			result[`${colorName}-gray`] = grayGroup;
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
 * Generate design tokens format (following design token spec) - WITH gray scales as normal colors
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

		// Main color tokens
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

		// Wide gamut alpha variants
		if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
			tokens.color[colorName].p3Alpha = {};
			colorScale.accentScaleAlphaWideGamut.forEach((color: string, index: number) => {
				tokens.color[colorName].p3Alpha[index + 1] = {
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

		if (fullConfig.includeWideGamut) {
			tokens.color[colorName].surfaceP3 = {
				value: colorScale.accentSurfaceWideGamut,
				type: "color",
			};
		}

		// Gray scale as a separate color token (treated like normal color)
		if (fullConfig.includeGrayScale) {
			tokens.color[`${colorName}-gray`] = {};

			// Main gray scale
			colorScale.grayScale.forEach((color: string, index: number) => {
				tokens.color[`${colorName}-gray`][index + 1] = {
					value: color,
					type: "color",
				};
			});

			// Alpha variants
			if (fullConfig.includeAlpha) {
				tokens.color[`${colorName}-gray`].alpha = {};
				colorScale.grayScaleAlpha.forEach((color: string, index: number) => {
					tokens.color[`${colorName}-gray`].alpha[index + 1] = {
						value: color,
						type: "color",
					};
				});
			}

			// Wide gamut variants
			if (fullConfig.includeWideGamut) {
				tokens.color[`${colorName}-gray`].p3 = {};
				colorScale.grayScaleWideGamut.forEach((color: string, index: number) => {
					tokens.color[`${colorName}-gray`].p3[index + 1] = {
						value: color,
						type: "color",
					};
				});
			}

			// Wide gamut alpha variants
			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				tokens.color[`${colorName}-gray`].p3Alpha = {};
				colorScale.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					tokens.color[`${colorName}-gray`].p3Alpha[index + 1] = {
						value: color,
						type: "color",
					};
				});
			}

			// Surface colors
			tokens.color[`${colorName}-gray`].surface = {
				value: colorScale.graySurface,
				type: "color",
			};

			if (fullConfig.includeWideGamut) {
				tokens.color[`${colorName}-gray`].surfaceP3 = {
					value: colorScale.graySurfaceWideGamut,
					type: "color",
				};
			}
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

	return tokens;
}

/**
 * Generate Tailwind config format
 */
export function generateTailwindJSON(colorSystem: ColorSystem, config: JSONGenerationConfig = {}): any {
	const fullConfig = { ...defaultJSONConfig, ...config };

	const tailwindConfig: any = {
		theme: {
			extend: {
				colors: {},
			},
		},
	};

	for (const colorName of colorSystem.colorNames) {
		// Main color
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

		// Gray scale as a separate color
		if (fullConfig.includeGrayScale && lightScale) {
			tailwindConfig.theme.extend.colors[`${colorName}-gray`] = {};

			lightScale.grayScale.forEach((color: string, index: number) => {
				tailwindConfig.theme.extend.colors[`${colorName}-gray`][index + 1] = color;
			});

			tailwindConfig.theme.extend.colors[`${colorName}-gray`].DEFAULT = lightScale.grayScale[8]; // Step 9 (index 8)
			tailwindConfig.theme.extend.colors[`${colorName}-gray`].surface = lightScale.graySurface;
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
 * Generate collections format JSON (your requested format)
 */
export function generateCollectionsJSON(colorSystem: ColorSystem, config: JSONGenerationConfig = {}): CollectionOutput {
	const fullConfig = { ...defaultJSONConfig, ...config };

	const collection: CollectionFormat = {
		name: fullConfig.collectionName || "Generated Colors",
		modes: ["light", "dark"],
		variables: {
			solid: {},
			alpha: {},
			overlays: {
				black: {},
				white: {},
			},
		},
	};

	// Generate solid colors
	for (const colorName of colorSystem.colorNames) {
		collection.variables.solid[colorName] = {};

		// Generate 12 steps for each color
		for (let i = 1; i <= 12; i++) {
			const lightColor = colorSystem.light[colorName]?.accentScale[i - 1];
			const darkColor = colorSystem.dark[colorName]?.accentScale[i - 1];

			if (lightColor && darkColor) {
				collection.variables.solid[colorName][i.toString()] = {
					type: "color",
					values: {
						light: lightColor,
						dark: darkColor,
					},
				};
			}
		}
	}

	// Generate alpha colors
	if (fullConfig.includeAlpha) {
		for (const colorName of colorSystem.colorNames) {
			collection.variables.alpha[colorName] = {};

			// Generate 12 steps for each color
			for (let i = 1; i <= 12; i++) {
				const lightColor = colorSystem.light[colorName]?.accentScaleAlpha[i - 1];
				const darkColor = colorSystem.dark[colorName]?.accentScaleAlpha[i - 1];

				if (lightColor && darkColor) {
					collection.variables.alpha[colorName][i.toString()] = {
						type: "color",
						values: {
							light: lightColor,
							dark: darkColor,
						},
					};
				}
			}
		}
	}

	// Generate overlays
	if (fullConfig.includeOverlays) {
		const firstColorName = colorSystem.colorNames[0];
		if (firstColorName) {
			const lightOverlays = colorSystem.light[firstColorName]?.overlays;
			const darkOverlays = colorSystem.dark[firstColorName]?.overlays;

			if (lightOverlays && darkOverlays) {
				// Black overlays
				for (let i = 1; i <= 12; i++) {
					collection.variables.overlays.black[i.toString()] = {
						type: "color",
						values: {
							light: lightOverlays.black[i - 1],
							dark: darkOverlays.black[i - 1],
						},
					};
				}

				// White overlays
				for (let i = 1; i <= 12; i++) {
					collection.variables.overlays.white[i.toString()] = {
						type: "color",
						values: {
							light: lightOverlays.white[i - 1],
							dark: darkOverlays.white[i - 1],
						},
					};
				}
			}
		}
	}

	return {
		collections: [collection],
	};
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
		fullConfig.format === "all"
			? (["flat", "nested", "tokens", "tailwind", "collections"] as const)
			: ([fullConfig.format] as const);

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

			case "collections": {
				// Generate collections format
				const collectionsData = generateCollectionsJSON(colorSystem, fullConfig);
				const collectionsFilePath = join(outputDir, `collections${fullConfig.fileExtension}`);
				writeJSONFile(collectionsFilePath, collectionsData, fullConfig);
				generatedFiles.push(collectionsFilePath);
				break;
			}
		}
	}

	// Generate single metadata file if enabled
	if (fullConfig.includeMetadata && fullConfig.separateMetadata) {
		const metadata = generateMetadataJSON(colorSystem, fullConfig);

		writeJSONFile(join(outputDir, `metadata${fullConfig.fileExtension}`), metadata, fullConfig);
		generatedFiles.push(join(outputDir, `metadata${fullConfig.fileExtension}`));
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
	format: "flat" | "nested" | "tokens" | "tailwind" | "collections",
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

		case "collections":
			return generateCollectionsJSON(colorSystem, config);

		default:
			throw new Error(`Unknown format: ${format}`);
	}
}
