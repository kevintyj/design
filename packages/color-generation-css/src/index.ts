import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateOverlayColors } from "@design/color-generation-core";

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

// CSS-specific configuration
export interface CSSGenerationConfig extends GenerationConfig {
	outputDir?: string;
	generateSeparateFiles?: boolean;
	generateCombinedFile?: boolean;
	prefix?: string;
	includeComments?: boolean;
	variant?: "full" | "clean" | "hexa-only" | "p3-only";
}

// Default CSS generation configuration
export const defaultCSSConfig: Required<CSSGenerationConfig> = {
	outputDir: "output",
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	includeOverlays: true,
	generateSeparateFiles: true,
	generateCombinedFile: true,
	prefix: "--color",
	includeComments: true,
	variant: "full",
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
 * Generate CSS custom properties for a single color scale
 */
export function generateCSSForColorScale(
	colorName: string,
	colorScale: ColorScale,
	appearance: "light" | "dark",
	config: CSSGenerationConfig = {},
): string {
	const fullConfig = { ...defaultCSSConfig, ...config };
	const _prefix = `${fullConfig.prefix}-${colorName}`;

	let css = "";

	if (fullConfig.includeComments) {
		css += `/* ${colorName.toUpperCase()} - ${appearance} mode */\n`;
	}

	switch (fullConfig.variant) {
		case "full":
			css += generateFullColorScale(colorName, colorScale, fullConfig);
			break;
		case "clean":
			css += generateCleanColorScale(colorName, colorScale, fullConfig);
			break;
		case "hexa-only":
			css += generateHexaOnlyColorScale(colorName, colorScale, fullConfig);
			break;
		case "p3-only":
			css += generateP3OnlyColorScale(colorName, colorScale, fullConfig);
			break;
	}

	return css;
}

/**
 * Generate full color scale (Version 1: current version without background duplication)
 */
function generateFullColorScale(
	colorName: string,
	colorScale: ColorScale,
	config: Required<CSSGenerationConfig>,
): string {
	const prefix = `${config.prefix}-${colorName}`;
	let css = "";

	// Accent scale (regular)
	colorScale.accentScale.forEach((color: string, index: number) => {
		css += `${prefix}-${index + 1}: ${color};\n`;
	});

	// Alpha accent scale
	if (config.includeAlpha) {
		colorScale.accentScaleAlpha.forEach((color: string, index: number) => {
			css += `${prefix}-a${index + 1}: ${color};\n`;
		});
	}

	// Wide gamut accent scale
	if (config.includeWideGamut) {
		colorScale.accentScaleWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-p3-${index + 1}: ${color};\n`;
		});
	}

	// Wide gamut alpha accent scale
	if (config.includeAlpha && config.includeWideGamut) {
		colorScale.accentScaleAlphaWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-p3-a${index + 1}: ${color};\n`;
		});
	}

	// NOTE: Gray scale is now generated universally, not per color

	// Special colors
	css += `${prefix}-contrast: ${colorScale.accentContrast};\n`;
	css += `${prefix}-surface: ${colorScale.accentSurface};\n`;

	if (config.includeWideGamut) {
		css += `${prefix}-surface-p3: ${colorScale.accentSurfaceWideGamut};\n`;
	}

	return css;
}

/**
 * Generate clean color scale (Version 2: without metadata but with background)
 */
function generateCleanColorScale(
	colorName: string,
	colorScale: ColorScale,
	config: Required<CSSGenerationConfig>,
): string {
	const prefix = `${config.prefix}-${colorName}`;
	let css = "";

	// Accent scale (regular)
	colorScale.accentScale.forEach((color: string, index: number) => {
		css += `${prefix}-${index + 1}: ${color};\n`;
	});

	// Alpha accent scale
	if (config.includeAlpha) {
		colorScale.accentScaleAlpha.forEach((color: string, index: number) => {
			css += `${prefix}-a${index + 1}: ${color};\n`;
		});
	}

	// Wide gamut accent scale
	if (config.includeWideGamut) {
		colorScale.accentScaleWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-p3-${index + 1}: ${color};\n`;
		});
	}

	// Wide gamut alpha accent scale
	if (config.includeAlpha && config.includeWideGamut) {
		colorScale.accentScaleAlphaWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-p3-a${index + 1}: ${color};\n`;
		});
	}

	// NOTE: Gray scale is now generated universally, not per color
	// NOTE: Special colors are removed from clean version

	return css;
}

/**
 * Generate universal overlays (only once, not per color)
 */
function generateUniversalOverlays(
	_colorSystem: ColorSystem,
	_appearance: "light" | "dark",
	config: Required<CSSGenerationConfig>,
): string {
	if (!config.includeOverlays) return "";

	// Only include overlays for appropriate variants
	if (config.variant === "p3-only") {
		// P3-only variant should not include overlays unless they're in P3 format
		// Overlays are typically in HEXA format, so skip for P3-only
		return "";
	}

	let css = "";

	if (config.includeComments) {
		css += `/* Universal overlays */\n`;
	}

	// Generate overlays using the overlay generation utility
	const overlays = generateOverlayColors();

	// Black overlays
	overlays.black.forEach((color: string, index: number) => {
		css += `${config.prefix}-overlay-black-${index + 1}: ${color};\n`;
	});

	// White overlays
	overlays.white.forEach((color: string, index: number) => {
		css += `${config.prefix}-overlay-white-${index + 1}: ${color};\n`;
	});

	return css;
}

/**
 * Generate HEXA only color scale (Version 3: solid and alpha colors as HEXA)
 */
function generateHexaOnlyColorScale(
	colorName: string,
	colorScale: ColorScale,
	config: Required<CSSGenerationConfig>,
): string {
	const prefix = `${config.prefix}-${colorName}`;
	let css = "";

	// Accent scale (regular HEXA only)
	colorScale.accentScale.forEach((color: string, index: number) => {
		// Only include HEX colors (filter out P3/OKLCH)
		if (color.startsWith("#")) {
			css += `${prefix}-${index + 1}: ${color};\n`;
		}
	});

	// Alpha accent scale (HEXA with alpha only)
	if (config.includeAlpha) {
		colorScale.accentScaleAlpha.forEach((color: string, index: number) => {
			// Only include HEX colors (filter out P3/OKLCH)
			if (color.startsWith("#")) {
				css += `${prefix}-a${index + 1}: ${color};\n`;
			}
		});
	}

	return css;
}

/**
 * Generate P3 only color scale (Version 4: solid and alpha colors using P3)
 */
function generateP3OnlyColorScale(
	colorName: string,
	colorScale: ColorScale,
	config: Required<CSSGenerationConfig>,
): string {
	const prefix = `${config.prefix}-${colorName}`;
	let css = "";

	// Wide gamut accent scale (P3)
	colorScale.accentScaleWideGamut.forEach((color: string, index: number) => {
		css += `${prefix}-${index + 1}: ${color};\n`;
	});

	// Wide gamut alpha accent scale (P3 with alpha)
	if (config.includeAlpha) {
		colorScale.accentScaleAlphaWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-a${index + 1}: ${color};\n`;
		});
	}

	// NOTE: Gray scale is now generated universally, not per color

	return css;
}

/**
 * Generate universal gray colors (only once, not per color)
 */
function generateUniversalGrayColors(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config: Required<CSSGenerationConfig>,
): string {
	if (!config.includeGrayScale) return "";

	const colorScales = appearance === "light" ? colorSystem.light : colorSystem.dark;
	const firstColor = colorScales[colorSystem.colorNames[0]];

	if (!firstColor) return "";

	let css = "";

	if (config.includeComments) {
		css += `/* Universal gray colors */\n`;
	}

	// Generate based on variant
	switch (config.variant) {
		case "full":
			// Gray scale (HEXA)
			firstColor.grayScale.forEach((color: string, index: number) => {
				css += `${config.prefix}-gray-${index + 1}: ${color};\n`;
			});

			if (config.includeAlpha) {
				firstColor.grayScaleAlpha.forEach((color: string, index: number) => {
					css += `${config.prefix}-gray-a${index + 1}: ${color};\n`;
				});
			}

			if (config.includeWideGamut) {
				firstColor.grayScaleWideGamut.forEach((color: string, index: number) => {
					css += `${config.prefix}-gray-p3-${index + 1}: ${color};\n`;
				});
			}

			if (config.includeAlpha && config.includeWideGamut) {
				firstColor.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					css += `${config.prefix}-gray-p3-a${index + 1}: ${color};\n`;
				});
			}

			// Gray surface colors
			css += `${config.prefix}-gray-surface: ${firstColor.graySurface};\n`;
			if (config.includeWideGamut) {
				css += `${config.prefix}-gray-surface-p3: ${firstColor.graySurfaceWideGamut};\n`;
			}
			break;

		case "clean":
			// Gray scale (HEXA)
			firstColor.grayScale.forEach((color: string, index: number) => {
				css += `${config.prefix}-gray-${index + 1}: ${color};\n`;
			});

			if (config.includeAlpha) {
				firstColor.grayScaleAlpha.forEach((color: string, index: number) => {
					css += `${config.prefix}-gray-a${index + 1}: ${color};\n`;
				});
			}

			if (config.includeWideGamut) {
				firstColor.grayScaleWideGamut.forEach((color: string, index: number) => {
					css += `${config.prefix}-gray-p3-${index + 1}: ${color};\n`;
				});
			}

			if (config.includeAlpha && config.includeWideGamut) {
				firstColor.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					css += `${config.prefix}-gray-p3-a${index + 1}: ${color};\n`;
				});
			}
			break;

		case "hexa-only":
			// Only HEXA gray colors (filter out P3/OKLCH)
			firstColor.grayScale.forEach((color: string, index: number) => {
				if (color.startsWith("#")) {
					css += `${config.prefix}-gray-${index + 1}: ${color};\n`;
				}
			});

			if (config.includeAlpha) {
				firstColor.grayScaleAlpha.forEach((color: string, index: number) => {
					if (color.startsWith("#")) {
						css += `${config.prefix}-gray-a${index + 1}: ${color};\n`;
					}
				});
			}
			break;

		case "p3-only":
			// Only P3 gray colors (filter out HEX)
			firstColor.grayScaleWideGamut.forEach((color: string, index: number) => {
				if (color.startsWith("oklch") || color.startsWith("color(display-p3")) {
					css += `${config.prefix}-gray-${index + 1}: ${color};\n`;
				}
			});

			if (config.includeAlpha) {
				firstColor.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
					if (color.startsWith("oklch") || color.startsWith("color(display-p3")) {
						css += `${config.prefix}-gray-a${index + 1}: ${color};\n`;
					}
				});
			}
			break;
	}

	return css;
}

/**
 * Generate CSS custom properties for all colors
 */
export function generateCSSForColorSystem(
	colorSystem: ColorSystem,
	appearance: "light" | "dark",
	config: CSSGenerationConfig = {},
): string {
	const fullConfig = { ...defaultCSSConfig, ...config };

	let css = "";

	if (fullConfig.includeComments && fullConfig.variant === "full") {
		css += `/* Generated color scales - ${appearance} mode */\n`;
		css += `/* Configuration: alpha=${fullConfig.includeAlpha}, wideGamut=${fullConfig.includeWideGamut}, grayScale=${fullConfig.includeGrayScale}, overlays=${fullConfig.includeOverlays} */\n\n`;
	}

	const colorScales = appearance === "light" ? colorSystem.light : colorSystem.dark;

	// Generate individual color scales (without gray)
	for (const colorName of colorSystem.colorNames) {
		const colorScale = colorScales[colorName];
		if (colorScale) {
			css += generateCSSForColorScale(colorName, colorScale, appearance, config);
			css += "\n";
		}
	}

	// Add universal gray colors (only once)
	const grayCSS = generateUniversalGrayColors(colorSystem, appearance, fullConfig);
	if (grayCSS) {
		css += grayCSS;
		css += "\n";
	}

	// Add universal overlays (for ALL variants)
	const overlaysCSS = generateUniversalOverlays(colorSystem, appearance, fullConfig);
	if (overlaysCSS) {
		css += overlaysCSS;
		css += "\n";
	}

	// Add background color only once at the end
	const firstColor = colorScales[colorSystem.colorNames[0]];
	if (firstColor) {
		css += `${fullConfig.prefix}-background: ${firstColor.background};\n`;
	}

	return css;
}

/**
 * Generate CSS files from a color system
 */
export function generateCSSFiles(colorSystem: ColorSystem, config: CSSGenerationConfig = {}): string[] {
	const fullConfig = { ...defaultCSSConfig, ...config };
	const outputDir = fullConfig.outputDir;

	// Ensure output directory exists
	ensureDirectoryExists(outputDir);

	const generatedFiles: string[] = [];

	// Generate all four versions
	const versions = [
		{ variant: "full", suffix: "full" },
		{ variant: "clean", suffix: "clean" },
		{ variant: "hexa-only", suffix: "hexa" },
		{ variant: "p3-only", suffix: "p3" },
	] as const;

	for (const version of versions) {
		const versionConfig = { ...fullConfig, variant: version.variant };

		// Generate CSS content for this version
		const lightCSS = `:root {\n${generateCSSForColorSystem(colorSystem, "light", versionConfig)}}`;
		const darkCSS = `@media (prefers-color-scheme: dark) {\n  :root {\n${generateCSSForColorSystem(
			colorSystem,
			"dark",
			versionConfig,
		)
			.split("\n")
			.map((line) => (line ? `  ${line}` : line))
			.join("\n")}  }\n}`;

		// Generate combined CSS file
		const combinedCSS = generateCombinedCSS(lightCSS, darkCSS, colorSystem, versionConfig, version.suffix);

		const files: Array<{ name: string; content: string }> = [];

		// Generate separate files if requested
		if (fullConfig.generateSeparateFiles) {
			files.push(
				{ name: `colors-${version.suffix}-light.css`, content: lightCSS },
				{ name: `colors-${version.suffix}-dark.css`, content: darkCSS },
			);
		}

		// Generate combined file if requested
		if (fullConfig.generateCombinedFile) {
			files.push({ name: `colors-${version.suffix}-combined.css`, content: combinedCSS });
		}

		// Write the files
		for (const file of files) {
			const filePath = join(outputDir, file.name);
			writeFileSync(filePath, file.content);
			generatedFiles.push(filePath);
		}
	}

	return generatedFiles;
}

/**
 * Generate combined CSS with documentation
 */
function generateCombinedCSS(
	lightCSS: string,
	darkCSS: string,
	_colorSystem: ColorSystem,
	config: Required<CSSGenerationConfig>,
	suffix: string,
): string {
	let docComments = "";

	if (config.includeComments && config.variant === "full") {
		docComments = `
/* 
Color Scale Usage Guide:

Regular Colors:
- ${config.prefix}-{name}-{1-12}: Main color scale (1=lightest, 12=darkest)
- ${config.prefix}-{name}-contrast: Accessible text color for this color
- ${config.prefix}-{name}-surface: Subtle background using this color

${
	config.includeAlpha
		? `Alpha Variants:
- ${config.prefix}-{name}-a{1-12}: Semi-transparent versions of main colors
- ${config.prefix}-{name}-gray-a{1-12}: Semi-transparent gray variants

`
		: ""
}${
	config.includeWideGamut
		? `Wide Gamut P3:
- ${config.prefix}-{name}-p3-{1-12}: P3 color space versions for modern displays
- ${config.prefix}-{name}-p3-a{1-12}: P3 alpha variants
- ${config.prefix}-{name}-surface-p3: P3 surface colors

`
		: ""
}${
	config.includeGrayScale
		? `Gray Scales:
- ${config.prefix}-{name}-gray-{1-12}: Contextual gray scale for each color
- ${config.prefix}-{name}-gray-surface: Gray surface variants

`
		: ""
}${
	config.includeOverlays
		? `Overlays:
- ${config.prefix}-{name}-overlay-black-{1-12}: Black overlay variants
- ${config.prefix}-{name}-overlay-white-{1-12}: White overlay variants

`
		: ""
}Examples:
- Primary button: background-color: var(${config.prefix}-blue-9);
- Subtle background: background-color: var(${config.prefix}-blue-1);
- Hover state: background-color: var(${config.prefix}-blue-10);
- Text on colored bg: color: var(${config.prefix}-blue-contrast);
${config.includeAlpha ? `- Semi-transparent overlay: background-color: var(${config.prefix}-blue-a9);` : ""}
*/`;
	}

	const versionDescription =
		{
			full: "Complete color system with all variants",
			clean: "Clean color system without metadata",
			hexa: "HEXA solid and alpha colors only",
			p3: "P3 solid and alpha colors only",
		}[suffix] || "Color system";

	return `/* Auto-generated color scales - ${versionDescription} */
/* Generated with: alpha=${config.includeAlpha}, wideGamut=${config.includeWideGamut}, grayScale=${config.includeGrayScale}, overlays=${config.includeOverlays} */

/* Light mode (default) */
${lightCSS}

/* Dark mode (automatic based on system preference) */
${darkCSS}
${docComments}`;
}

/**
 * Generate utility classes for Tailwind CSS or similar frameworks
 */
export function generateUtilityClasses(colorSystem: ColorSystem, config: CSSGenerationConfig = {}): string {
	const fullConfig = { ...defaultCSSConfig, ...config };
	let css = "";

	if (fullConfig.includeComments) {
		css += "/* Utility classes for color scales */\n\n";
	}

	for (const colorName of colorSystem.colorNames) {
		// Background utilities
		for (let i = 1; i <= 12; i++) {
			css += `.bg-${colorName}-${i} { background-color: var(${fullConfig.prefix}-${colorName}-${i}); }\n`;
			if (fullConfig.includeAlpha) {
				css += `.bg-${colorName}-a${i} { background-color: var(${fullConfig.prefix}-${colorName}-a${i}); }\n`;
			}
		}

		// Text utilities
		for (let i = 1; i <= 12; i++) {
			css += `.text-${colorName}-${i} { color: var(${fullConfig.prefix}-${colorName}-${i}); }\n`;
			if (fullConfig.includeAlpha) {
				css += `.text-${colorName}-a${i} { color: var(${fullConfig.prefix}-${colorName}-a${i}); }\n`;
			}
		}

		// Border utilities
		for (let i = 1; i <= 12; i++) {
			css += `.border-${colorName}-${i} { border-color: var(${fullConfig.prefix}-${colorName}-${i}); }\n`;
			if (fullConfig.includeAlpha) {
				css += `.border-${colorName}-a${i} { border-color: var(${fullConfig.prefix}-${colorName}-a${i}); }\n`;
			}
		}

		css += "\n";
	}

	return css;
}
