// Type definitions for spacing inputs
export interface SpacingDefinition {
	[spacingName: string]: number;
}

export interface SpacingInput {
	spacing: SpacingDefinition;
	multiplier: number;
}

// Complete spacing scale output
export interface SpacingScale {
	values: Record<string, number>;
	remValues: Record<string, string>;
	pxValues: Record<string, string>;
	multiplier: number;
	metadata: {
		unit: "px";
		baseMultiplier: number;
		totalValues: number;
	};
}

// Configuration interface for generation options
export interface SpacingGenerationConfig {
	includeRem?: boolean;
	includePx?: boolean;
	remBase?: number; // Base font size for rem calculations (default: 16)
}

// Complete spacing system output
export interface SpacingSystem {
	spacing: SpacingScale;
	sourceSpacing: SpacingInput;
	metadata: {
		generatedAt: string;
		totalValues: number;
		config: Required<SpacingGenerationConfig>;
	};
}

// Default configuration
export const defaultSpacingConfig: Required<SpacingGenerationConfig> = {
	includeRem: true,
	includePx: true,
	remBase: 16,
};

/**
 * Optimized config merger with validation
 */
function mergeAndValidateConfig(
	spacingInput: SpacingInput & { remValue?: number },
	config: SpacingGenerationConfig = {},
): Required<SpacingGenerationConfig> {
	const fullConfig = {
		...defaultSpacingConfig,
		...config,
		// Use remValue from spacingInput if provided, otherwise use config or default
		remBase: config.remBase || (spacingInput as any).remValue || defaultSpacingConfig.remBase,
	};

	// Validate remBase
	if (fullConfig.remBase <= 0 || !Number.isFinite(fullConfig.remBase)) {
		throw new Error(`Invalid remBase: ${fullConfig.remBase}. Must be a positive finite number.`);
	}

	return fullConfig;
}

/**
 * Generate complete spacing scale from spacing definitions
 * Optimized for performance with batch processing
 */
export function generateSpacingSystem(
	spacingInput: SpacingInput & { remValue?: number },
	config: SpacingGenerationConfig = {},
): SpacingSystem {
	// Validate input before processing
	validateSpacingInput(spacingInput);

	const fullConfig = mergeAndValidateConfig(spacingInput, config);
	const spacingEntries = Object.entries(spacingInput.spacing);
	const totalValues = spacingEntries.length;

	// Pre-allocate objects for better performance
	const values: Record<string, number> = {};
	const remValues: Record<string, string> = {};
	const pxValues: Record<string, string> = {};

	// Sort once and process all formats in a single pass
	const sortedSpacingEntries = spacingEntries.sort(([, a], [, b]) => a - b);

	// Batch process all entries to reduce loop overhead
	for (const [name, value] of sortedSpacingEntries) {
		// All values in base.ts are already final pixel values
		values[name] = value;

		// Generate px values if needed
		if (fullConfig.includePx) {
			pxValues[name] = `${value}px`;
		}

		// Generate rem values if needed
		if (fullConfig.includeRem) {
			// Optimized rem calculation with cached base
			const remValue = value / fullConfig.remBase;
			remValues[name] = `${remValue.toFixed(4).replace(/\.?0+$/, "")}rem`;
		}
	}

	// Create spacing scale with optimized structure
	const spacingScale: SpacingScale = {
		values,
		remValues,
		pxValues,
		multiplier: spacingInput.multiplier,
		metadata: {
			unit: "px",
			baseMultiplier: spacingInput.multiplier,
			totalValues,
		},
	};

	// Generate metadata once
	const generatedAt = new Date().toISOString();

	return {
		spacing: spacingScale,
		sourceSpacing: spacingInput,
		metadata: {
			generatedAt,
			totalValues,
			config: fullConfig,
		},
	};
}

/**
 * Load spacing definitions from a TypeScript/JavaScript file
 */
export async function loadSpacingDefinitions(filePath: string): Promise<SpacingInput & { remValue?: number }> {
	try {
		// Import the spacing definitions dynamically
		const spacingModule = await import(filePath);

		// Try to find the spacing definitions in various export patterns
		const spacing = spacingModule.spacing || spacingModule._spacing;
		const multiplier = spacingModule.spacingMultiplier || spacingModule.multiplier || spacingModule._spacingMultiplier;
		const remValue = spacingModule.remValue || spacingModule._remValue;

		if (!spacing || multiplier === undefined) {
			throw new Error("Required spacing definitions not found. Expected: spacing, spacingMultiplier");
		}

		return {
			spacing,
			multiplier,
			remValue,
		};
	} catch (error) {
		throw new Error(`Failed to load spacing definitions from ${filePath}: ${error}`);
	}
}

/**
 * Create a spacing input from simple spacing object
 */
export function createSpacingInput(spacing: SpacingDefinition, multiplier: number): SpacingInput {
	return {
		spacing,
		multiplier,
	};
}

/**
 * Validate spacing input structure
 */
export function validateSpacingInput(spacingInput: SpacingInput): void {
	if (!spacingInput.spacing || typeof spacingInput.spacing !== "object") {
		throw new Error("Spacing definitions must be an object");
	}

	if (Object.keys(spacingInput.spacing).length === 0) {
		throw new Error("Spacing definitions cannot be empty");
	}

	if (typeof spacingInput.multiplier !== "number" || spacingInput.multiplier <= 0) {
		throw new Error("Multiplier must be a positive number");
	}

	// Validate spacing values
	for (const [name, value] of Object.entries(spacingInput.spacing)) {
		if (typeof value !== "number" || value < 0) {
			throw new Error(`Invalid spacing value for "${name}": must be a non-negative number`);
		}
	}
}

/**
 * Get spacing value by name
 */
export function getSpacingValue(
	spacingSystem: SpacingSystem,
	spacingName: string,
	format: "px" | "rem" | "value" = "px",
): string | number {
	const spacing = spacingSystem.spacing;

	if (!(spacingName in spacing.values)) {
		throw new Error(`Spacing value not found: ${spacingName}`);
	}

	switch (format) {
		case "px":
			return spacing.pxValues[spacingName] || `${spacing.values[spacingName]}px`;
		case "rem":
			return spacing.remValues[spacingName] || `${spacing.values[spacingName] / 16}rem`;
		case "value":
			return spacing.values[spacingName];
		default:
			throw new Error(`Invalid format: ${format}. Use "px", "rem", or "value"`);
	}
}

/**
 * Get all spacing names
 */
export function getSpacingNames(spacingSystem: SpacingSystem): string[] {
	return Object.keys(spacingSystem.spacing.values);
}

/**
 * Convert pixels to rem using the system's rem base
 */
export function pxToRem(pixels: number, remBase: number = 16): string {
	return `${(pixels / remBase).toFixed(4).replace(/\.?0+$/, "")}rem`;
}

/**
 * Convert rem to pixels using the system's rem base
 */
export function remToPx(rem: string, remBase: number = 16): number {
	const remValue = parseFloat(rem.replace("rem", ""));
	return remValue * remBase;
}
