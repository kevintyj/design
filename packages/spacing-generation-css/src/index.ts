// Import types from spacing core
import type { SpacingGenerationConfig, SpacingSystem } from "@kevintyj/design-spacing-core";

// CSS-specific configuration
export interface CSSSpacingGenerationConfig extends SpacingGenerationConfig {
	generateSeparateFiles?: boolean;
	generateCombinedFile?: boolean;
	prefix?: string;
	includeComments?: boolean;
	variant?: "full" | "px-only" | "rem-only";
}

// File data interface for pure functions
export interface CSSSpacingFileData {
	name: string;
	content: string;
}

// Default CSS generation configuration
export const defaultCSSSpacingConfig: Required<CSSSpacingGenerationConfig> = {
	includeRem: true,
	includePx: true,
	remBase: 16,
	generateSeparateFiles: true,
	generateCombinedFile: true,
	prefix: "--spacing",
	includeComments: true,
	variant: "full",
};

/**
 * Generate CSS custom properties for spacing scale
 */
export function generateCSSForSpacingSystem(
	spacingSystem: SpacingSystem,
	config: CSSSpacingGenerationConfig = {},
): string {
	const fullConfig = { ...defaultCSSSpacingConfig, ...config };
	let css = "";

	if (fullConfig.includeComments) {
		css += `/* Spacing Scale */\n`;
		css += `/* Base multiplier: ${spacingSystem.spacing.multiplier} */\n`;
		css += `/* Total values: ${spacingSystem.spacing.metadata.totalValues} */\n`;
	}

	switch (fullConfig.variant) {
		case "full":
			css += generateFullSpacingScale(spacingSystem, fullConfig);
			break;
		case "px-only":
			css += generatePxOnlySpacingScale(spacingSystem, fullConfig);
			break;
		case "rem-only":
			css += generateRemOnlySpacingScale(spacingSystem, fullConfig);
			break;
	}

	return css;
}

/**
 * Generate full spacing scale with both px and rem values
 */
function generateFullSpacingScale(spacingSystem: SpacingSystem, config: Required<CSSSpacingGenerationConfig>): string {
	const { prefix } = config;
	const { values, pxValues, remValues } = spacingSystem.spacing;
	let css = "";

	// Generate px values
	if (config.includePx) {
		if (config.includeComments) {
			css += `\n/* Pixel values */\n`;
		}
		for (const [name, _] of Object.entries(values)) {
			css += `${prefix}-${name}: ${pxValues[name]};\n`;
		}
	}

	// Generate rem values
	if (config.includeRem) {
		if (config.includeComments) {
			css += `\n/* REM values */\n`;
		}
		for (const [name, _] of Object.entries(values)) {
			css += `${prefix}-${name}-rem: ${remValues[name]};\n`;
		}
	}

	return css;
}

/**
 * Generate px-only spacing scale
 */
function generatePxOnlySpacingScale(
	spacingSystem: SpacingSystem,
	config: Required<CSSSpacingGenerationConfig>,
): string {
	const { prefix } = config;
	const { values, pxValues } = spacingSystem.spacing;
	let css = "";

	for (const [name, _] of Object.entries(values)) {
		css += `${prefix}-${name}: ${pxValues[name]};\n`;
	}

	return css;
}

/**
 * Generate rem-only spacing scale
 */
function generateRemOnlySpacingScale(
	spacingSystem: SpacingSystem,
	config: Required<CSSSpacingGenerationConfig>,
): string {
	const { prefix } = config;
	const { values, remValues } = spacingSystem.spacing;
	let css = "";

	for (const [name, _] of Object.entries(values)) {
		css += `${prefix}-${name}: ${remValues[name]};\n`;
	}

	return css;
}

/**
 * Generate CSS files from spacing system
 */
export function generateSpacingCSSFiles(
	spacingSystem: SpacingSystem,
	config: CSSSpacingGenerationConfig = {},
): CSSSpacingFileData[] {
	const fullConfig = { ...defaultCSSSpacingConfig, ...config };
	const files: CSSSpacingFileData[] = [];

	// Generate main spacing CSS
	const spacingCSS = generateCSSForSpacingSystem(spacingSystem, fullConfig);

	if (fullConfig.generateSeparateFiles) {
		// Generate separate files by variant
		if (fullConfig.variant === "full") {
			// Generate px-only file
			const pxCSS = generateCSSForSpacingSystem(spacingSystem, {
				...fullConfig,
				variant: "px-only",
			});
			files.push({
				name: "spacing-px.css",
				content: `:root {\n${pxCSS}}\n`,
			});

			// Generate rem-only file
			const remCSS = generateCSSForSpacingSystem(spacingSystem, {
				...fullConfig,
				variant: "rem-only",
			});
			files.push({
				name: "spacing-rem.css",
				content: `:root {\n${remCSS}}\n`,
			});
		}

		// Generate main file with chosen variant
		files.push({
			name: `spacing${fullConfig.variant !== "full" ? `-${fullConfig.variant}` : ""}.css`,
			content: `:root {\n${spacingCSS}}\n`,
		});
	}

	if (fullConfig.generateCombinedFile) {
		// Generate combined file with all variants
		const combinedCSS = [
			"/* Spacing System */",
			"/* Generated from spacing configuration */",
			"",
			":root {",
			spacingCSS,
			"}",
		].join("\n");

		files.push({
			name: "spacing-combined.css",
			content: combinedCSS,
		});
	}

	return files;
}

/**
 * Generate utility classes for spacing
 */
export function generateSpacingUtilityClasses(
	spacingSystem: SpacingSystem,
	config: CSSSpacingGenerationConfig = {},
): string {
	const fullConfig = { ...defaultCSSSpacingConfig, ...config };
	const { values, pxValues, remValues } = spacingSystem.spacing;
	let css = "";

	if (fullConfig.includeComments) {
		css += "/* Spacing Utility Classes */\n\n";
	}

	// Generate margin utilities
	if (fullConfig.includeComments) {
		css += "/* Margin utilities */\n";
	}
	for (const [name, _] of Object.entries(values)) {
		const value = fullConfig.variant === "rem-only" ? remValues[name] : pxValues[name];
		css += `.m-${name} { margin: ${value}; }\n`;
		css += `.mx-${name} { margin-left: ${value}; margin-right: ${value}; }\n`;
		css += `.my-${name} { margin-top: ${value}; margin-bottom: ${value}; }\n`;
		css += `.mt-${name} { margin-top: ${value}; }\n`;
		css += `.mr-${name} { margin-right: ${value}; }\n`;
		css += `.mb-${name} { margin-bottom: ${value}; }\n`;
		css += `.ml-${name} { margin-left: ${value}; }\n`;
	}

	css += "\n";

	// Generate padding utilities
	if (fullConfig.includeComments) {
		css += "/* Padding utilities */\n";
	}
	for (const [name, _] of Object.entries(values)) {
		const value = fullConfig.variant === "rem-only" ? remValues[name] : pxValues[name];
		css += `.p-${name} { padding: ${value}; }\n`;
		css += `.px-${name} { padding-left: ${value}; padding-right: ${value}; }\n`;
		css += `.py-${name} { padding-top: ${value}; padding-bottom: ${value}; }\n`;
		css += `.pt-${name} { padding-top: ${value}; }\n`;
		css += `.pr-${name} { padding-right: ${value}; }\n`;
		css += `.pb-${name} { padding-bottom: ${value}; }\n`;
		css += `.pl-${name} { padding-left: ${value}; }\n`;
	}

	css += "\n";

	// Generate gap utilities
	if (fullConfig.includeComments) {
		css += "/* Gap utilities */\n";
	}
	for (const [name, _] of Object.entries(values)) {
		const value = fullConfig.variant === "rem-only" ? remValues[name] : pxValues[name];
		css += `.gap-${name} { gap: ${value}; }\n`;
		css += `.gap-x-${name} { column-gap: ${value}; }\n`;
		css += `.gap-y-${name} { row-gap: ${value}; }\n`;
	}

	return css;
}
