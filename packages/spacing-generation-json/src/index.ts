// Import types from spacing core
export interface SpacingSystem {
	spacing: {
		values: Record<string, number>;
		remValues: Record<string, string>;
		pxValues: Record<string, string>;
		multiplier: number;
		metadata: {
			unit: "px";
			baseMultiplier: number;
			totalValues: number;
		};
	};
	sourceSpacing: any;
	metadata: {
		generatedAt: string;
		totalValues: number;
		config: any;
	};
}

export interface SpacingGenerationConfig {
	includeRem?: boolean;
	includePx?: boolean;
	remBase?: number;
}

// JSON-specific configuration
export interface JSONSpacingGenerationConfig extends SpacingGenerationConfig {
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

// Default JSON generation configuration
export const defaultJSONSpacingConfig: Required<JSONSpacingGenerationConfig> = {
	includeRem: true,
	includePx: true,
	remBase: 16,
	format: "all",
	includeMetadata: true,
	prettyPrint: true,
	fileExtension: ".json",
	separateMetadata: true,
	collectionName: "Generated Spacing",
};

// Import optimized utilities
// Utilities are now defined directly in this file for better performance

/**
 * Get sorted entries by spacing values with optimized performance
 */
function getSortedSpacingEntries(spacingValues: Record<string, number>): [string, number][] {
	const entries = Object.entries(spacingValues);
	return entries.sort(([, a], [, b]) => a - b);
}

/**
 * Optimized config merging
 */
function mergeConfig<T extends Record<string, any>>(defaults: Required<T>, override: Partial<T> = {}): Required<T> {
	return { ...defaults, ...override };
}

/**
 * Create prefixed key efficiently
 */
function createPrefixedKey(prefix: string, name: string, suffix?: string): string {
	return suffix ? `${prefix}-${name}-${suffix}` : `${prefix}-${name}`;
}

/**
 * Validate spacing configuration
 */
function validateSpacingConfig<T extends { remBase?: number }>(config: T): T {
	if (config.remBase !== undefined && (config.remBase <= 0 || !Number.isFinite(config.remBase))) {
		throw new Error(`Invalid remBase: ${config.remBase}. Must be a positive finite number.`);
	}
	return config;
}

/**
 * Batch process spacing entries efficiently
 */
function batchProcessSpacingEntries(
	sortedEntries: [string, number][],
	processors: {
		raw?: (name: string, value: number) => void;
		px?: (name: string, value: number, pxValue: string) => void;
		rem?: (name: string, value: number, remValue: string) => void;
	},
	options: {
		includePx: boolean;
		includeRem: boolean;
		remBase: number;
	},
): void {
	for (const [name, value] of sortedEntries) {
		// Process raw values
		if (processors.raw) {
			processors.raw(name, value);
		}

		// Process px values if needed
		if (options.includePx && processors.px) {
			const pxValue = `${value}px`;
			processors.px(name, value, pxValue);
		}

		// Process rem values if needed
		if (options.includeRem && processors.rem) {
			const remValue = `${(value / options.remBase).toFixed(4).replace(/\.?0+$/, "")}rem`;
			processors.rem(name, value, remValue);
		}
	}
}

/**
 * Create spacing variable for collections
 */
function createSpacingVariable(value: string | number, type: "string" | "number" = "number") {
	return {
		type,
		values: {
			default: value,
		},
	};
}

/**
 * Create a properly ordered object from spacing entries
 * This function bypasses JavaScript's automatic key ordering by using Map
 */
function _createOrderedSpacingObject<T>(
	entries: [string, T][],
	sorter: (a: [string, T], b: [string, T]) => number,
): Record<string, T> {
	// Sort the entries
	const sortedEntries = entries.sort(sorter);

	// Use a Map to maintain order, then convert to object
	const orderedMap = new Map(sortedEntries);
	return Object.fromEntries(orderedMap);
}

/**
 * Reorder object properties by spacing values (smallest to largest)
 * This solves JavaScript's object property ordering limitations
 */
function reorderBySpacingValues<T>(obj: Record<string, T>, spacingValues: Record<string, number>): Record<string, T> {
	const entries = Object.entries(obj);

	// Sort entries by their corresponding spacing pixel values
	const sortedEntries = entries.sort(([keyA], [keyB]) => {
		const valueA = spacingValues[keyA] ?? Infinity; // Unknown keys go to end
		const valueB = spacingValues[keyB] ?? Infinity;
		return valueA - valueB;
	});

	return Object.fromEntries(sortedEntries);
}

/**
 * Recursively reorder spacing-related objects by their values
 * This function can be applied to any spacing output to ensure consistent ordering
 */
export function reorderSpacingOutput(output: any, spacingValues: Record<string, number>): any {
	if (output === null || typeof output !== "object") {
		return output;
	}

	if (Array.isArray(output)) {
		return output.map((item) => reorderSpacingOutput(item, spacingValues));
	}

	const result: any = {};

	// Check if this object looks like a spacing values object
	const keys = Object.keys(output);
	const hasSpacingKeys = keys.some((key) => key in spacingValues);

	if (hasSpacingKeys) {
		// This looks like a spacing object - reorder by values
		const reordered = reorderBySpacingValues(output, spacingValues);
		for (const [key, value] of Object.entries(reordered)) {
			result[key] = reorderSpacingOutput(value, spacingValues);
		}
	} else {
		// Regular object - maintain order but recurse into values
		for (const [key, value] of Object.entries(output)) {
			result[key] = reorderSpacingOutput(value, spacingValues);
		}
	}

	return result;
}

/**
 * Generate comprehensive metadata JSON for spacing system
 */
export function generateSpacingMetadataJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): any {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };

	return {
		generatedAt: new Date().toISOString(),
		totalValues: spacingSystem.spacing.metadata.totalValues,
		multiplier: spacingSystem.spacing.multiplier,
		unit: spacingSystem.spacing.metadata.unit,
		baseFontSize: fullConfig.remBase, // More descriptive name
		remBase: fullConfig.remBase, // Keep for backward compatibility
		formats:
			fullConfig.format === "all" ? ["flat", "nested", "tokens", "tailwind", "collections"] : [fullConfig.format],
		config: {
			includeRem: fullConfig.includeRem,
			includePx: fullConfig.includePx,
			remBase: fullConfig.remBase,
			format: fullConfig.format,
			prettyPrint: fullConfig.prettyPrint,
		},
		systemMetadata: spacingSystem.metadata,
		// Enhanced metadata
		spacingInfo: {
			baseUnit: spacingSystem.spacing.metadata.unit,
			baseMultiplier: spacingSystem.spacing.multiplier,
			baseFontSize: fullConfig.remBase,
			totalSpacingValues: spacingSystem.spacing.metadata.totalValues,
			hasRemValues: fullConfig.includeRem,
			hasPxValues: fullConfig.includePx,
		},
	};
}

/**
 * Generate flat JSON format (all spacing values at root level)
 * Optimized for performance with batch processing
 */
export function generateFlatSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): Record<string, string | number> {
	// Use optimized config merging and validation
	const fullConfig = mergeConfig(defaultJSONSpacingConfig, validateSpacingConfig(config));
	const { values } = spacingSystem.spacing;
	const result: Record<string, string | number> = {};

	// Get sorted entries once
	const sortedEntries = getSortedSpacingEntries(values);

	// Use batch processing for optimal performance
	batchProcessSpacingEntries(
		sortedEntries,
		{
			raw: (name, value) => {
				result[createPrefixedKey("spacing", name)] = value;
			},
			px: (name, _value, pxValue) => {
				result[createPrefixedKey("spacing", name, "px")] = pxValue;
			},
			rem: (name, _value, remValue) => {
				result[createPrefixedKey("spacing", name, "rem")] = remValue;
			},
		},
		{
			includePx: fullConfig.includePx,
			includeRem: fullConfig.includeRem,
			remBase: fullConfig.remBase,
		},
	);

	// Apply final reordering to ensure consistent output
	return reorderSpacingOutput(result, values);
}

/**
 * Generate nested JSON format (organized by type)
 */
export function generateNestedSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): Record<string, any> {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const { values, pxValues, remValues, multiplier } = spacingSystem.spacing;

	// Use consistent sorting approach
	const sortedEntries = getSortedSpacingEntries(values);

	const result: Record<string, any> = {
		spacing: {
			multiplier,
			values: {},
		},
	};

	// Add raw values in sorted order
	result.spacing.values.raw = {};
	for (const [name, value] of sortedEntries) {
		result.spacing.values.raw[name] = value;
	}

	// Add px values in sorted order
	if (fullConfig.includePx) {
		result.spacing.values.px = {};
		for (const [name, _] of sortedEntries) {
			result.spacing.values.px[name] = pxValues[name];
		}
	}

	// Add rem values in sorted order
	if (fullConfig.includeRem) {
		result.spacing.values.rem = {};
		for (const [name, _] of sortedEntries) {
			result.spacing.values.rem[name] = remValues[name];
		}
	}

	if (fullConfig.includeMetadata) {
		result.spacing.metadata = spacingSystem.spacing.metadata;
	}

	// Apply final reordering to ensure consistent output
	return reorderSpacingOutput(result, values);
}

/**
 * Generate design tokens JSON format (W3C compatible)
 */
export function generateDesignTokensSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): any {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const { values, pxValues, remValues } = spacingSystem.spacing;

	const tokens: any = {
		spacing: {},
	};

	// Use consistent sorting approach
	const sortedEntries = getSortedSpacingEntries(values);

	// Generate tokens for each spacing value
	for (const [name, value] of sortedEntries) {
		tokens.spacing[name] = {
			$type: "dimension",
			$value: fullConfig.includePx ? pxValues[name] : `${value}px`,
		};

		// Add rem variant if enabled
		if (fullConfig.includeRem) {
			tokens.spacing[`${name}-rem`] = {
				$type: "dimension",
				$value: remValues[name],
			};
		}
	}

	if (fullConfig.includeMetadata) {
		tokens.$metadata = {
			generatedAt: spacingSystem.metadata.generatedAt,
			multiplier: spacingSystem.spacing.multiplier,
			totalValues: spacingSystem.spacing.metadata.totalValues,
		};
	}

	// Apply final reordering to ensure consistent output
	return reorderSpacingOutput(tokens, values);
}

/**
 * Generate Tailwind-compatible JSON format
 */
export function generateTailwindSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): any {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const { values, pxValues, remValues } = spacingSystem.spacing;

	const tailwindConfig: any = {
		theme: {
			spacing: {} as Record<string, string>,
		},
	};

	// Use consistent sorting approach
	const sortedEntries = getSortedSpacingEntries(values);

	// Build spacing object in sorted order
	for (const [name, _] of sortedEntries) {
		if (fullConfig.includeRem && !fullConfig.includePx) {
			// Rem only
			tailwindConfig.theme.spacing[name] = remValues[name];
		} else {
			// Px (default) or both (px takes precedence for Tailwind)
			tailwindConfig.theme.spacing[name] = pxValues[name];
		}
	}

	// Apply final reordering to ensure consistent output
	return reorderSpacingOutput(tailwindConfig, values);
}

/**
 * Generate collections JSON format (matching color collections format)
 *
 * NOTE: Due to JavaScript's object property ordering rules, integer-like keys
 * (0, 1, 2, etc.) will always be ordered numerically before string keys
 * (1px, 2px, etc.), regardless of their actual values. This is a fundamental
 * JavaScript engine behavior that cannot be overridden.
 */
export function generateCollectionsSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): any {
	// Use optimized config merging and validation
	const fullConfig = mergeConfig(defaultJSONSpacingConfig, validateSpacingConfig(config));
	const { values, pxValues, remValues } = spacingSystem.spacing;
	const collectionName = fullConfig.collectionName || "Generated Spacing";

	// Get sorted entries by value (this represents the desired logical order)
	const sortedEntries = getSortedSpacingEntries(values);

	const collection: any = {
		name: collectionName,
		modes: ["default"],
		variables: {
			spacing: {},
		},
	};

	// Add px and rem collections if enabled
	if (fullConfig.includePx) {
		collection.variables["spacing-px"] = {};
	}
	if (fullConfig.includeRem) {
		collection.variables["spacing-rem"] = {};
	}

	// Build spacing variables in sorted order for all formats
	for (const [name, value] of sortedEntries) {
		// Raw numeric values
		collection.variables.spacing[name] = createSpacingVariable(value);

		// Px values as numbers (not strings)
		if (fullConfig.includePx && pxValues[name]) {
			collection.variables["spacing-px"][name] = createSpacingVariable(value, "number");
		}

		// Rem values as numbers (not strings)
		if (fullConfig.includeRem && remValues[name]) {
			const remValue = value / fullConfig.remBase;
			collection.variables["spacing-rem"][name] = createSpacingVariable(remValue, "number");
		}
	}

	return {
		collections: [collection],
	};
}

/**
 * Generate JSON files from spacing system
 */
export function generateJSONFiles(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): JSONFileData[] {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const files: JSONFileData[] = [];

	const formats =
		fullConfig.format === "all" ? ["flat", "nested", "tokens", "tailwind", "collections"] : [fullConfig.format];

	for (const format of formats) {
		const jsonData = convertToJSON(spacingSystem, format as any, fullConfig);
		const content = fullConfig.prettyPrint ? JSON.stringify(jsonData, null, 2) : JSON.stringify(jsonData);

		files.push({
			name: `spacing-${format}${fullConfig.fileExtension}`,
			content,
		});
	}

	// Generate separate metadata file if requested
	if (fullConfig.separateMetadata && fullConfig.includeMetadata) {
		const metadataJSON = generateSpacingMetadataJSON(spacingSystem, fullConfig);
		const metadataContent = fullConfig.prettyPrint
			? JSON.stringify(metadataJSON, null, 2)
			: JSON.stringify(metadataJSON);

		files.push({
			name: `spacing-metadata${fullConfig.fileExtension}`,
			content: metadataContent,
		});
	}

	return files;
}

/**
 * Convert spacing system to specific JSON format
 */
export function convertToJSON(
	spacingSystem: SpacingSystem,
	format: "flat" | "nested" | "tokens" | "tailwind" | "collections",
	config: JSONSpacingGenerationConfig = {},
): any {
	switch (format) {
		case "flat":
			return generateFlatSpacingJSON(spacingSystem, config);
		case "nested":
			return generateNestedSpacingJSON(spacingSystem, config);
		case "tokens":
			return generateDesignTokensSpacingJSON(spacingSystem, config);
		case "tailwind":
			return generateTailwindSpacingJSON(spacingSystem, config);
		case "collections":
			return generateCollectionsSpacingJSON(spacingSystem, config);
		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}

/**
 * Generate utility functions object for JavaScript consumption
 */
export function generateSpacingUtilities(spacingSystem: SpacingSystem, config: JSONSpacingGenerationConfig = {}): any {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const { values, pxValues, remValues } = spacingSystem.spacing;

	return {
		// Get spacing value by name
		get: (name: string, format: "px" | "rem" | "value" = "px") => {
			if (!(name in values)) {
				throw new Error(`Spacing value not found: ${name}`);
			}

			switch (format) {
				case "px":
					return pxValues[name];
				case "rem":
					return remValues[name];
				case "value":
					return values[name];
				default:
					throw new Error(`Invalid format: ${format}`);
			}
		},

		// Get all spacing names
		names: Object.keys(values),

		// Get spacing by multiplier
		byMultiplier: (multiplier: number) => {
			const targetValue = spacingSystem.spacing.multiplier * multiplier;
			const match = Object.entries(values).find(([_, value]) => value === targetValue);
			return match ? match[0] : null;
		},

		// Convert px to rem
		pxToRem: (px: number) => `${(px / fullConfig.remBase).toFixed(4).replace(/\.?0+$/, "")}rem`,

		// Convert rem to px
		remToPx: (rem: string) => {
			const remValue = parseFloat(rem.replace("rem", ""));
			return remValue * fullConfig.remBase;
		},

		// Metadata
		metadata: spacingSystem.spacing.metadata,
	};
}
