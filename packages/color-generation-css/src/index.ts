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

// CSS-specific configuration
export interface CSSGenerationConfig extends GenerationConfig {
	outputDir?: string;
	generateSeparateFiles?: boolean;
	generateCombinedFile?: boolean;
	prefix?: string;
	includeComments?: boolean;
}

// Default CSS generation configuration
export const defaultCSSConfig: Required<CSSGenerationConfig> = {
	outputDir: "output",
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	generateSeparateFiles: true,
	generateCombinedFile: true,
	prefix: "--color",
	includeComments: true,
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
	const prefix = `${fullConfig.prefix}-${colorName}`;

	let css = "";

	if (fullConfig.includeComments) {
		css += `/* ${colorName.toUpperCase()} - ${appearance} mode */\n`;
	}

	// Accent scale (regular)
	colorScale.accentScale.forEach((color: string, index: number) => {
		css += `${prefix}-${index + 1}: ${color};\n`;
	});

	// Alpha accent scale
	if (fullConfig.includeAlpha) {
		colorScale.accentScaleAlpha.forEach((color: string, index: number) => {
			css += `${prefix}-a${index + 1}: ${color};\n`;
		});
	}

	// Wide gamut accent scale
	if (fullConfig.includeWideGamut) {
		colorScale.accentScaleWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-p3-${index + 1}: ${color};\n`;
		});
	}

	// Wide gamut alpha accent scale
	if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
		colorScale.accentScaleAlphaWideGamut.forEach((color: string, index: number) => {
			css += `${prefix}-p3-a${index + 1}: ${color};\n`;
		});
	}

	// Gray scale (if enabled)
	if (fullConfig.includeGrayScale) {
		colorScale.grayScale.forEach((color: string, index: number) => {
			css += `${prefix}-gray-${index + 1}: ${color};\n`;
		});

		if (fullConfig.includeAlpha) {
			colorScale.grayScaleAlpha.forEach((color: string, index: number) => {
				css += `${prefix}-gray-a${index + 1}: ${color};\n`;
			});
		}

		if (fullConfig.includeWideGamut) {
			colorScale.grayScaleWideGamut.forEach((color: string, index: number) => {
				css += `${prefix}-gray-p3-${index + 1}: ${color};\n`;
			});
		}

		if (fullConfig.includeAlpha && fullConfig.includeWideGamut) {
			colorScale.grayScaleAlphaWideGamut.forEach((color: string, index: number) => {
				css += `${prefix}-gray-p3-a${index + 1}: ${color};\n`;
			});
		}
	}

	// Special colors
	css += `${prefix}-contrast: ${colorScale.accentContrast};\n`;
	css += `${prefix}-surface: ${colorScale.accentSurface};\n`;

	if (fullConfig.includeWideGamut) {
		css += `${prefix}-surface-p3: ${colorScale.accentSurfaceWideGamut};\n`;
		css += `${prefix}-gray-surface-p3: ${colorScale.graySurfaceWideGamut};\n`;
	}

	css += `${prefix}-gray-surface: ${colorScale.graySurface};\n`;
	css += `${fullConfig.prefix}-background: ${colorScale.background};\n`;

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

	if (fullConfig.includeComments) {
		css += `/* Generated color scales - ${appearance} mode */\n`;
		css += `/* Configuration: alpha=${fullConfig.includeAlpha}, wideGamut=${fullConfig.includeWideGamut}, grayScale=${fullConfig.includeGrayScale} */\n\n`;
	}

	const colorScales = appearance === "light" ? colorSystem.light : colorSystem.dark;

	for (const colorName of colorSystem.colorNames) {
		const colorScale = colorScales[colorName];
		if (colorScale) {
			css += generateCSSForColorScale(colorName, colorScale, appearance, config);
			css += "\n";
		}
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

	// Generate CSS content
	const lightCSS = `:root {\n${generateCSSForColorSystem(colorSystem, "light", fullConfig)}}`;
	const darkCSS = `@media (prefers-color-scheme: dark) {\n  :root {\n${generateCSSForColorSystem(
		colorSystem,
		"dark",
		fullConfig,
	)
		.split("\n")
		.map((line) => (line ? `  ${line}` : line))
		.join("\n")}  }\n}`;

	// Generate combined CSS file with comprehensive documentation
	const combinedCSS = generateCombinedCSS(lightCSS, darkCSS, colorSystem, fullConfig);

	const files: Array<{ name: string; content: string }> = [];

	// Generate separate files if requested
	if (fullConfig.generateSeparateFiles) {
		files.push({ name: "colors-light.css", content: lightCSS }, { name: "colors-dark.css", content: darkCSS });
	}

	// Generate combined file if requested
	if (fullConfig.generateCombinedFile) {
		files.push({ name: "colors-combined.css", content: combinedCSS });
	}

	// Write the files
	const generatedFiles: string[] = [];

	for (const file of files) {
		const filePath = join(outputDir, file.name);
		writeFileSync(filePath, file.content);
		generatedFiles.push(filePath);
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
): string {
	const docComments = config.includeComments
		? `
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
}Examples:
- Primary button: background-color: var(${config.prefix}-blue-9);
- Subtle background: background-color: var(${config.prefix}-blue-1);
- Hover state: background-color: var(${config.prefix}-blue-10);
- Text on colored bg: color: var(${config.prefix}-blue-contrast);
${config.includeAlpha ? `- Semi-transparent overlay: background-color: var(${config.prefix}-blue-a9);` : ""}
*/`
		: "";

	return `/* Auto-generated color scales */
/* Generated with: includeAlpha=${config.includeAlpha}, includeWideGamut=${config.includeWideGamut}, includeGrayScale=${config.includeGrayScale} */

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
