import { generateOverlayColors } from "@design/color-generation-core";
import Color from "colorjs.io";

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

// JSON-specific configuration (removed outputDir and file-related options)
export interface JSONGenerationConfig extends GenerationConfig {
	format?: "flat" | "nested" | "tokens" | "tailwind" | "collections" | "all";
	includeMetadata?: boolean;
	prettyPrint?: boolean;
	fileExtension?: string;
	separateMetadata?: boolean;
	collectionName?: string;
}

// File data interface for pure functions
export interface JSONFileData {
	name: string;
	content: string;
}

// Simplified collection format interface for human-readable output
export interface SimpleCollectionFormat {
	name: string;
	modes: string[];
	variables: {
		solid: Record<string, Record<string, { type: string; values: Record<string, string> }>>;
		alpha: Record<string, Record<string, { type: string; values: Record<string, string> }>>;
		overlays: {
			black: Record<string, { type: string; values: Record<string, string> }>;
			white: Record<string, { type: string; values: Record<string, string> }>;
		};
	};
}

export interface SimpleCollectionOutput {
	collections: SimpleCollectionFormat;
}

// Default JSON generation configuration
export const defaultJSONConfig: Required<JSONGenerationConfig> = {
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
 * Generate flat JSON format (all colors at root level) - WITH universal gray scale
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

		// Add special colors
		result[`${colorName}-contrast`] = colorScale.accentContrast;
		result[`${colorName}-surface`] = colorScale.accentSurface;

		if (fullConfig.includeWideGamut) {
			result[`${colorName}-surface-p3`] = colorScale.accentSurfaceWideGamut;
		}
	}

	// Add universal gray scale (only once)
	if (fullConfig.includeGrayScale) {
		const firstColor = colorScales[colorSystem.colorNames[0]];
		if (firstColor) {
			firstColor.grayScale.forEach((color: string, index: number) => {
				result[`gray-${index + 1}`] = color;
			});

			if (fullConfig.includeAlpha) {
				firstColor.grayScaleAlpha.forEach((color: string, index: number) => {
					result[`gray-a${index + 1}`] = color;
				});
			}

			if (fullConfig.includeWideGamut) {
				firstColor.grayScaleWideGamut.forEach((color: string, index: number) => {
					result[`gray-p3-${index + 1}`] = color;
				});
			}

			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				firstColor.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					result[`gray-p3-a${index + 1}`] = color;
				});
			}

			result["gray-surface"] = firstColor.graySurface;
			if (fullConfig.includeWideGamut) {
				result["gray-surface-p3"] = firstColor.graySurfaceWideGamut;
			}
		}
	}

	// Add universal overlays (only once, not per color) - FIXED
	if (fullConfig.includeOverlays) {
		// Generate overlays using the overlay generation utility
		const overlays = generateOverlayColors();

		overlays.black.forEach((color: string, index: number) => {
			result[`overlay-black-${index + 1}`] = color;
		});

		overlays.white.forEach((color: string, index: number) => {
			result[`overlay-white-${index + 1}`] = color;
		});
	}

	// Add background color
	const firstColor = colorScales[colorSystem.colorNames[0]];
	if (firstColor) {
		result.background = firstColor.background;
	}

	return result;
}

/**
 * Generate nested JSON format (colors grouped by name) - WITH universal gray scale
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
	}

	// Add universal gray scale (only once)
	if (fullConfig.includeGrayScale) {
		const firstColor = colorScales[colorSystem.colorNames[0]];
		if (firstColor) {
			const grayGroup: any = {
				scale: firstColor.grayScale,
				surface: firstColor.graySurface,
			};

			if (fullConfig.includeAlpha) {
				grayGroup.alpha = firstColor.grayScaleAlpha;
			}

			if (fullConfig.includeWideGamut) {
				grayGroup.p3 = firstColor.grayScaleWideGamut;
				grayGroup.surfaceP3 = firstColor.graySurfaceWideGamut;
			}

			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				grayGroup.p3Alpha = firstColor.grayScaleAlphaWideGamut;
			}

			result.gray = grayGroup;
		}
	}

	// Add universal overlays (only black and white, not per color) - FIXED
	if (fullConfig.includeOverlays) {
		const overlays = generateOverlayColors();

		result.overlay = {
			black: {},
			white: {},
		};

		overlays.black.forEach((color: string, index: number) => {
			result.overlay.black[index + 1] = color;
		});

		overlays.white.forEach((color: string, index: number) => {
			result.overlay.white[index + 1] = color;
		});
	}

	// Add background color
	const firstColor = colorScales[colorSystem.colorNames[0]];
	if (firstColor) {
		result.background = firstColor.background;
	}

	return result;
}

/**
 * Format color for Figma collections (RGB with alpha) using colorjs.io
 */
function _formatFigmaColor(colorString: string): any {
	try {
		// Parse the color using colorjs.io (handles all formats: hex, rgb, hsl, etc.)
		const color = new Color(colorString);

		// Get RGB values (0-1 range for Figma)
		const rgb = color.srgb;

		return {
			r: rgb.r,
			g: rgb.g,
			b: rgb.b,
			a: color.alpha ?? 1,
		};
	} catch (_error) {
		// Fallback for invalid colors
		console.warn(`Invalid color format: ${colorString}, using fallback`);
		return {
			r: 0,
			g: 0,
			b: 0,
			a: 1,
		};
	}
}

// Keep the old W3C token format interface for backwards compatibility if needed
export interface W3CCollectionFormat {
	$extensions: {
		[namespace: string]: {
			modes: string[];
		};
	};
	[collectionName: string]: any;
}

export interface W3CCollectionOutput {
	[collectionKey: string]: W3CCollectionFormat;
}

/**
 * Generate collections format JSON (Simplified human-readable format) - WITH universal gray scale
 */
export function generateCollectionsJSON(
	colorSystem: ColorSystem,
	config: JSONGenerationConfig = {},
): SimpleCollectionOutput {
	const fullConfig = { ...defaultJSONConfig, ...config };
	const collectionName = fullConfig.collectionName || "Generated Colors";

	const collection: SimpleCollectionFormat = {
		name: collectionName,
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

	// Generate solid colors (accent colors + gray + background)
	for (const colorName of colorSystem.colorNames) {
		collection.variables.solid[colorName] = {};

		// Add main color scale (1-12)
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

		// Add contrast and surface colors
		const lightScale = colorSystem.light[colorName];
		const darkScale = colorSystem.dark[colorName];

		if (lightScale && darkScale) {
			collection.variables.solid[colorName].contrast = {
				type: "color",
				values: {
					light: lightScale.accentContrast,
					dark: darkScale.accentContrast,
				},
			};

			collection.variables.solid[colorName].surface = {
				type: "color",
				values: {
					light: lightScale.accentSurface,
					dark: darkScale.accentSurface,
				},
			};
		}
	}

	// Add universal gray colors (only once) to solid section
	if (fullConfig.includeGrayScale) {
		collection.variables.solid.gray = {};

		for (let i = 1; i <= 12; i++) {
			const lightColor = colorSystem.light[colorSystem.colorNames[0]]?.grayScale[i - 1];
			const darkColor = colorSystem.dark[colorSystem.colorNames[0]]?.grayScale[i - 1];

			if (lightColor && darkColor) {
				collection.variables.solid.gray[i.toString()] = {
					type: "color",
					values: {
						light: lightColor,
						dark: darkColor,
					},
				};
			}
		}

		// Add gray surface
		const lightGray = colorSystem.light[colorSystem.colorNames[0]];
		const darkGray = colorSystem.dark[colorSystem.colorNames[0]];

		if (lightGray && darkGray) {
			collection.variables.solid.gray.surface = {
				type: "color",
				values: {
					light: lightGray.graySurface,
					dark: darkGray.graySurface,
				},
			};
		}
	}

	// Add background as a solid color
	const firstLightColor = colorSystem.light[colorSystem.colorNames[0]];
	const firstDarkColor = colorSystem.dark[colorSystem.colorNames[0]];

	if (firstLightColor && firstDarkColor) {
		collection.variables.solid.background = {
			"1": {
				type: "color",
				values: {
					light: firstLightColor.background,
					dark: firstDarkColor.background,
				},
			},
		};
	}

	// Generate alpha colors if enabled
	if (fullConfig.includeAlpha) {
		for (const colorName of colorSystem.colorNames) {
			collection.variables.alpha[colorName] = {};

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

		// Add universal gray alpha colors
		if (fullConfig.includeGrayScale) {
			collection.variables.alpha.gray = {};

			for (let i = 1; i <= 12; i++) {
				const lightColor = colorSystem.light[colorSystem.colorNames[0]]?.grayScaleAlpha[i - 1];
				const darkColor = colorSystem.dark[colorSystem.colorNames[0]]?.grayScaleAlpha[i - 1];

				if (lightColor && darkColor) {
					collection.variables.alpha.gray[i.toString()] = {
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

	// Generate universal overlays
	if (fullConfig.includeOverlays) {
		const overlays = generateOverlayColors();

		// Black overlays (same for light and dark)
		overlays.black.forEach((color: string, index: number) => {
			collection.variables.overlays.black[(index + 1).toString()] = {
				type: "color",
				values: {
					light: color,
					dark: color,
				},
			};
		});

		// White overlays (same for light and dark)
		overlays.white.forEach((color: string, index: number) => {
			collection.variables.overlays.white[(index + 1).toString()] = {
				type: "color",
				values: {
					light: color,
					dark: color,
				},
			};
		});
	}

	return {
		collections: collection,
	};
}

/**
 * Generate design tokens format (following design token spec) - WITH universal gray scale
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
	}

	// Add universal gray scale (only once)
	if (fullConfig.includeGrayScale) {
		const firstColor = colorScales[colorSystem.colorNames[0]];
		if (firstColor) {
			tokens.color.gray = {};

			// Main gray scale
			firstColor.grayScale.forEach((color: string, index: number) => {
				tokens.color.gray[index + 1] = {
					value: color,
					type: "color",
				};
			});

			// Alpha variants
			if (fullConfig.includeAlpha) {
				tokens.color.gray.alpha = {};
				firstColor.grayScaleAlpha.forEach((color: string, index: number) => {
					tokens.color.gray.alpha[index + 1] = {
						value: color,
						type: "color",
					};
				});
			}

			// Wide gamut variants
			if (fullConfig.includeWideGamut) {
				tokens.color.gray.p3 = {};
				firstColor.grayScaleWideGamut.forEach((color: string, index: number) => {
					tokens.color.gray.p3[index + 1] = {
						value: color,
						type: "color",
					};
				});
			}

			// Wide gamut alpha variants
			if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
				tokens.color.gray.p3Alpha = {};
				firstColor.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					tokens.color.gray.p3Alpha[index + 1] = {
						value: color,
						type: "color",
					};
				});
			}

			// Surface colors
			tokens.color.gray.surface = {
				value: firstColor.graySurface,
				type: "color",
			};

			if (fullConfig.includeWideGamut) {
				tokens.color.gray.surfaceP3 = {
					value: firstColor.graySurfaceWideGamut,
					type: "color",
				};
			}
		}
	}

	// Add universal overlays (only black and white, not per color) - FIXED
	if (fullConfig.includeOverlays) {
		const overlays = generateOverlayColors();

		tokens.color.overlay = {
			black: {},
			white: {},
		};

		// Black overlays
		overlays.black.forEach((color: string, index: number) => {
			tokens.color.overlay.black[index + 1] = {
				value: color,
				type: "color",
			};
		});

		// White overlays
		overlays.white.forEach((color: string, index: number) => {
			tokens.color.overlay.white[index + 1] = {
				value: color,
				type: "color",
			};
		});
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
 * Generate Tailwind config format - WITH universal gray scale
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
	}

	// Add universal gray scale (only once)
	if (fullConfig.includeGrayScale) {
		const firstLightColor = colorSystem.light[colorSystem.colorNames[0]];
		if (firstLightColor) {
			tailwindConfig.theme.extend.colors.gray = {};

			firstLightColor.grayScale.forEach((color: string, index: number) => {
				tailwindConfig.theme.extend.colors.gray[index + 1] = color;
			});

			tailwindConfig.theme.extend.colors.gray.DEFAULT = firstLightColor.grayScale[8]; // Step 9 (index 8)
			tailwindConfig.theme.extend.colors.gray.surface = firstLightColor.graySurface;
		}
	}

	// Add universal overlays (only black and white, not per color) - FIXED
	if (fullConfig.includeOverlays) {
		const overlays = generateOverlayColors();

		tailwindConfig.theme.extend.colors.overlay = {
			black: {},
			white: {},
		};

		// Black overlays
		overlays.black.forEach((color: string, index: number) => {
			tailwindConfig.theme.extend.colors.overlay.black[index + 1] = color;
		});

		// White overlays
		overlays.white.forEach((color: string, index: number) => {
			tailwindConfig.theme.extend.colors.overlay.white[index + 1] = color;
		});

		// Add default overlay colors (middle steps)
		tailwindConfig.theme.extend.colors.overlay.black.DEFAULT = overlays.black[8]; // Step 9
		tailwindConfig.theme.extend.colors.overlay.white.DEFAULT = overlays.white[8]; // Step 9
	}

	// Add background
	const firstLightColor = colorSystem.light[colorSystem.colorNames[0]];
	if (firstLightColor) {
		tailwindConfig.theme.extend.colors.background = firstLightColor.background;
	}

	return tailwindConfig;
}

/**
 * Generate JSON files as data structures (pure function - works in browser and Node.js)
 * Returns an array of file objects with name and content properties.
 * Consumers are responsible for writing to filesystem or handling download.
 */
export function generateJSONFiles(colorSystem: ColorSystem, config: JSONGenerationConfig = {}): JSONFileData[] {
	const fullConfig = { ...defaultJSONConfig, ...config };
	const files: JSONFileData[] = [];
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

				const lightJson = fullConfig.prettyPrint ? JSON.stringify(flatLight, null, 2) : JSON.stringify(flatLight);
				const darkJson = fullConfig.prettyPrint ? JSON.stringify(flatDark, null, 2) : JSON.stringify(flatDark);

				files.push(
					{ name: `colors-flat-light${fullConfig.fileExtension}`, content: lightJson },
					{ name: `colors-flat-dark${fullConfig.fileExtension}`, content: darkJson },
				);
				break;
			}

			case "nested": {
				// Generate nested format for both modes
				const nestedLight = generateNestedJSON(colorSystem, "light", fullConfig);
				const nestedDark = generateNestedJSON(colorSystem, "dark", fullConfig);

				const lightJson = fullConfig.prettyPrint ? JSON.stringify(nestedLight, null, 2) : JSON.stringify(nestedLight);
				const darkJson = fullConfig.prettyPrint ? JSON.stringify(nestedDark, null, 2) : JSON.stringify(nestedDark);

				files.push(
					{ name: `colors-nested-light${fullConfig.fileExtension}`, content: lightJson },
					{ name: `colors-nested-dark${fullConfig.fileExtension}`, content: darkJson },
				);
				break;
			}

			case "tokens": {
				// Generate design tokens format for both modes
				const tokensLight = generateDesignTokensJSON(colorSystem, "light", fullConfig);
				const tokensDark = generateDesignTokensJSON(colorSystem, "dark", fullConfig);

				const lightJson = fullConfig.prettyPrint ? JSON.stringify(tokensLight, null, 2) : JSON.stringify(tokensLight);
				const darkJson = fullConfig.prettyPrint ? JSON.stringify(tokensDark, null, 2) : JSON.stringify(tokensDark);

				files.push(
					{ name: `colors-tokens-light${fullConfig.fileExtension}`, content: lightJson },
					{ name: `colors-tokens-dark${fullConfig.fileExtension}`, content: darkJson },
				);
				break;
			}

			case "tailwind": {
				// Generate Tailwind config (includes both modes via CSS variables)
				const tailwindConfig = generateTailwindJSON(colorSystem, fullConfig);
				const tailwindJson = fullConfig.prettyPrint
					? JSON.stringify(tailwindConfig, null, 2)
					: JSON.stringify(tailwindConfig);

				files.push({ name: `colors-tailwind${fullConfig.fileExtension}`, content: tailwindJson });
				break;
			}

			case "collections": {
				// Generate collections format
				const collectionsData = generateCollectionsJSON(colorSystem, fullConfig);
				const collectionsJson = fullConfig.prettyPrint
					? JSON.stringify(collectionsData, null, 2)
					: JSON.stringify(collectionsData);

				files.push({ name: `colors-collections${fullConfig.fileExtension}`, content: collectionsJson });
				break;
			}
		}
	}

	// Generate single metadata file if enabled
	if (fullConfig.includeMetadata && fullConfig.separateMetadata) {
		const metadata = generateMetadataJSON(colorSystem, fullConfig);
		const metadataJson = fullConfig.prettyPrint ? JSON.stringify(metadata, null, 2) : JSON.stringify(metadata);

		files.push({ name: `colors-metadata${fullConfig.fileExtension}`, content: metadataJson });
	}

	return files;
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
