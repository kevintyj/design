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
		remBase: fullConfig.remBase,
		formats: fullConfig.format === "all" ? ["flat", "nested", "tokens", "tailwind"] : [fullConfig.format],
		config: {
			includeRem: fullConfig.includeRem,
			includePx: fullConfig.includePx,
			remBase: fullConfig.remBase,
			format: fullConfig.format,
			prettyPrint: fullConfig.prettyPrint,
		},
		systemMetadata: spacingSystem.metadata,
	};
}

/**
 * Generate flat JSON format (all spacing values at root level)
 */
export function generateFlatSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): Record<string, string | number> {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const { values, pxValues, remValues } = spacingSystem.spacing;
	const result: Record<string, string | number> = {};

	// Add raw values
	for (const [name, value] of Object.entries(values)) {
		result[`spacing-${name}`] = value;
	}

	// Add px values
	if (fullConfig.includePx) {
		for (const [name, value] of Object.entries(pxValues)) {
			result[`spacing-${name}-px`] = value;
		}
	}

	// Add rem values
	if (fullConfig.includeRem) {
		for (const [name, value] of Object.entries(remValues)) {
			result[`spacing-${name}-rem`] = value;
		}
	}

	return result;
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

	const result: Record<string, any> = {
		spacing: {
			multiplier,
			values: {},
		},
	};

	// Add raw values
	result.spacing.values.raw = values;

	// Add px values
	if (fullConfig.includePx) {
		result.spacing.values.px = pxValues;
	}

	// Add rem values
	if (fullConfig.includeRem) {
		result.spacing.values.rem = remValues;
	}

	if (fullConfig.includeMetadata) {
		result.spacing.metadata = spacingSystem.spacing.metadata;
	}

	return result;
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

	// Generate tokens for each spacing value
	for (const [name, value] of Object.entries(values)) {
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

	return tokens;
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

	// Use the format preferred by the config
	for (const [name, _] of Object.entries(values)) {
		if (fullConfig.includeRem && !fullConfig.includePx) {
			// Rem only
			tailwindConfig.theme.spacing[name] = remValues[name];
		} else {
			// Px (default) or both (px takes precedence for Tailwind)
			tailwindConfig.theme.spacing[name] = pxValues[name];
		}
	}

	if (fullConfig.includeMetadata) {
		(tailwindConfig.theme.spacing as any)["// metadata"] = {
			multiplier: spacingSystem.spacing.multiplier,
			totalValues: spacingSystem.spacing.metadata.totalValues,
			generatedAt: spacingSystem.metadata.generatedAt,
		};
	}

	return tailwindConfig;
}

/**
 * Generate collections JSON format (Figma-compatible)
 */
export function generateCollectionsSpacingJSON(
	spacingSystem: SpacingSystem,
	config: JSONSpacingGenerationConfig = {},
): any {
	const fullConfig = { ...defaultJSONSpacingConfig, ...config };
	const { values, pxValues, remValues } = spacingSystem.spacing;

	const collection: any = {
		[fullConfig.collectionName]: {
			$type: "spacing",
			$description: "Design system spacing scale",
			spacing: {} as Record<string, any>,
		},
	};

	// Generate spacing variables
	for (const [name, value] of Object.entries(values)) {
		collection[fullConfig.collectionName].spacing[name] = {
			$type: "dimension",
			$value: fullConfig.includePx ? pxValues[name] : `${value}px`,
		};

		// Add rem variant if enabled
		if (fullConfig.includeRem) {
			collection[fullConfig.collectionName].spacing[`${name}_rem`] = {
				$type: "dimension",
				$value: remValues[name],
			};
		}
	}

	if (fullConfig.includeMetadata) {
		collection[fullConfig.collectionName].$metadata = {
			generatedAt: spacingSystem.metadata.generatedAt,
			multiplier: spacingSystem.spacing.multiplier,
			totalValues: spacingSystem.spacing.metadata.totalValues,
		};
	}

	return { collections: collection };
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
