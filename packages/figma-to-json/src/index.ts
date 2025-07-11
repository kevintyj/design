/// <reference types="@figma/plugin-typings" />

// Output format interfaces - matching color-generation-json format
export interface CollectionVariable {
	type: string;
	values: Record<string, string>;
}

export interface SimpleCollectionFormat {
	name: string;
	modes: string[];
	variables: Record<string, Record<string, CollectionVariable>>;
}

export interface SimpleCollectionOutput {
	collections: SimpleCollectionFormat[];
}

export interface FigmaToJsonConfig {
	includeAllVariableTypes?: boolean;
	preserveVariableStructure?: boolean;
	includeMetadata?: boolean;
	prettyPrint?: boolean;
}

export interface FigmaVariableExport {
	id: string;
	name: string;
	variableCollectionId: string;
	resolvedType: string;
	valuesByMode: Record<string, any>;
	collection: {
		id: string;
		name: string;
		modes: Array<{ modeId: string; name: string }>;
	};
}

export interface FigmaCollectionExport {
	id: string;
	name: string;
	modes: Array<{ modeId: string; name: string }>;
}

export interface RawFigmaExport {
	collections: FigmaCollectionExport[];
	variables: FigmaVariableExport[];
}

// Default configuration
const defaultConfig: Required<FigmaToJsonConfig> = {
	includeAllVariableTypes: false, // Only colors by default
	preserveVariableStructure: true,
	includeMetadata: true,
	prettyPrint: true,
};

/**
 * Convert RGBA color to hex string with alpha support
 */
function rgbaToHex(color: RGB | RGBA): string {
	const toHex = (c: number) => {
		const hex = Math.round(c * 255).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};

	const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;

	// Add alpha if present and not fully opaque
	if ("a" in color && color.a !== 1) {
		return hex + toHex(color.a);
	}

	return hex;
}

/**
 * Export all Figma variables as raw format with full information
 */
export async function exportFigmaVariablesRaw(): Promise<RawFigmaExport> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const variables = figma.variables.getLocalVariables();

	const exportData: RawFigmaExport = {
		collections: [],
		variables: [],
	};

	// Export collections with full mode information
	for (const collection of collections) {
		exportData.collections.push({
			id: collection.id,
			name: collection.name,
			modes: collection.modes.map((mode) => ({
				modeId: mode.modeId,
				name: mode.name,
			})),
		});
	}

	// Export variables with full information including transparency
	for (const variable of variables) {
		const collection = collections.find((c) => c.id === variable.variableCollectionId);
		if (!collection) continue;

		const exportVariable: FigmaVariableExport = {
			id: variable.id,
			name: variable.name,
			variableCollectionId: variable.variableCollectionId,
			resolvedType: variable.resolvedType,
			valuesByMode: {},
			collection: {
				id: collection.id,
				name: collection.name,
				modes: collection.modes.map((mode) => ({
					modeId: mode.modeId,
					name: mode.name,
				})),
			},
		};

		// Get values for each mode with full transparency support
		for (const mode of collection.modes) {
			try {
				const value = variable.valuesByMode[mode.modeId];
				if (value !== undefined) {
					if (variable.resolvedType === "COLOR" && typeof value === "object" && "r" in value) {
						// Convert RGBA/RGB to hex with alpha support
						exportVariable.valuesByMode[mode.modeId] = rgbaToHex(value as RGB | RGBA);
					} else {
						// For non-color types, store the raw value
						exportVariable.valuesByMode[mode.modeId] = value;
					}
				}
			} catch (error) {
				console.error(`Failed to export value for variable ${variable.name} in mode ${mode.name}:`, error);
			}
		}

		exportData.variables.push(exportVariable);
	}

	return exportData;
}

/**
 * Convert Figma variables to SimpleCollectionOutput format (matching color-generation-json)
 */
export async function exportFigmaVariablesAsCollections(
	config: FigmaToJsonConfig = {},
): Promise<SimpleCollectionOutput> {
	const fullConfig = { ...defaultConfig, ...config };
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const variables = figma.variables.getLocalVariables();

	const outputCollections: SimpleCollectionFormat[] = [];

	for (const collection of collections) {
		// Filter variables for this collection
		const collectionVariables = variables.filter((v) => v.variableCollectionId === collection.id);

		// Filter by type if needed
		const targetVariables = fullConfig.includeAllVariableTypes
			? collectionVariables
			: collectionVariables.filter((v) => v.resolvedType === "COLOR");

		if (targetVariables.length === 0) continue;

		const modes = collection.modes.map((m) => m.name);
		const variableGroups: Record<string, Record<string, CollectionVariable>> = {};

		for (const variable of targetVariables) {
			// Parse variable name to determine grouping
			const { groupName, variableName } = parseVariableName(variable.name, fullConfig.preserveVariableStructure);

			// Initialize group if needed
			if (!variableGroups[groupName]) {
				variableGroups[groupName] = {};
			}

			// Build values for all modes
			const values: Record<string, string> = {};
			for (const mode of collection.modes) {
				const value = variable.valuesByMode[mode.modeId];
				if (value !== undefined) {
					if (variable.resolvedType === "COLOR" && typeof value === "object" && "r" in value) {
						values[mode.name] = rgbaToHex(value as RGB | RGBA);
					} else {
						values[mode.name] = String(value);
					}
				}
			}

			variableGroups[groupName][variableName] = {
				type: variable.resolvedType.toLowerCase(),
				values: values,
			};
		}

		outputCollections.push({
			name: collection.name,
			modes: modes,
			variables: variableGroups,
		});
	}

	return {
		collections: outputCollections,
	};
}

/**
 * Check if data is in SimpleCollectionOutput format
 */
export function isSimpleCollectionOutputFormat(data: any): data is SimpleCollectionOutput {
	return (
		data?.collections &&
		Array.isArray(data.collections) &&
		data.collections.length > 0 &&
		typeof data.collections[0].name === "string" &&
		Array.isArray(data.collections[0].modes) &&
		data.collections[0].variables &&
		typeof data.collections[0].variables === "object"
	);
}

/**
 * Convert SimpleCollectionOutput format to raw Figma format for import
 */
export function convertSimpleCollectionOutputToRawFormat(data: SimpleCollectionOutput): RawFigmaExport {
	const rawFormat: RawFigmaExport = {
		collections: [],
		variables: [],
	};

	data.collections.forEach((collection) => {
		const collectionId = `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const modes = collection.modes.map((mode: string, index: number) => ({
			modeId: `mode-${index}`,
			name: mode.toLowerCase(),
		}));

		rawFormat.collections.push({
			id: collectionId,
			name: collection.name,
			modes: modes,
		});

		const addVariables = (variables: Record<string, CollectionVariable>, prefix: string = "") => {
			Object.entries(variables).forEach(([key, value]) => {
				if (value?.type && value?.values) {
					const variableName = prefix ? `${prefix}/${key}` : key;
					const variableId = `${variableName.replace(/[/\s]/g, "-")}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
					const valuesByMode: Record<string, any> = {};

					modes.forEach((mode) => {
						const modeValue = value.values[mode.name];
						if (modeValue !== undefined) {
							valuesByMode[mode.modeId] = modeValue;
						}
					});

					rawFormat.variables.push({
						id: variableId,
						name: variableName,
						variableCollectionId: collectionId,
						resolvedType: value.type.toUpperCase(),
						valuesByMode: valuesByMode,
						collection: {
							id: collectionId,
							name: collection.name,
							modes: modes,
						},
					});
				}
			});
		};

		Object.entries(collection.variables).forEach(([groupName, groupVariables]) => {
			// Handle root-level variables without prefix
			if (groupName === "__ROOT__") {
				addVariables(groupVariables, "");
			} else {
				addVariables(groupVariables, groupName);
			}
		});
	});

	return rawFormat;
}

/**
 * Parse variable name to determine grouping structure
 */
function parseVariableName(fullName: string, preserveStructure: boolean): { groupName: string; variableName: string } {
	if (!preserveStructure) {
		return {
			groupName: "colors",
			variableName: fullName,
		};
	}

	// Split by common separators
	const parts = fullName.split(/[/\-.]/);

	if (parts.length === 1) {
		// Single part variables remain ungrouped (use a special marker for root level)
		return {
			groupName: "__ROOT__",
			variableName: fullName,
		};
	}

	// Use first part as group, rest as variable name
	const groupName = parts[0];
	const variableName = parts.slice(1).join("/");

	return {
		groupName,
		variableName,
	};
}

/**
 * Export single collection format (for compatibility with existing code)
 */
export async function exportFigmaVariablesAsSingleCollection(
	collectionName?: string,
	config: FigmaToJsonConfig = {},
): Promise<{ collections: SimpleCollectionFormat }> {
	const result = await exportFigmaVariablesAsCollections(config);

	if (result.collections.length === 0) {
		throw new Error("No collections found to export");
	}

	// If specific collection requested, find it
	if (collectionName) {
		const targetCollection = result.collections.find((c) => c.name === collectionName);
		if (!targetCollection) {
			throw new Error(`Collection "${collectionName}" not found`);
		}
		return { collections: targetCollection };
	}

	// Otherwise return first collection
	return { collections: result.collections[0] };
}

/**
 * Utility function to download JSON content
 */
export function downloadJSON(data: any, filename: string, prettyPrint: boolean = true): void {
	const jsonString = prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data);

	// This would be used in the plugin context
	if (typeof figma !== "undefined" && figma.ui) {
		figma.ui.postMessage({
			type: "download-json",
			data: {
				content: jsonString,
				filename: filename,
				contentType: "application/json",
			},
		});
	}
}

// Re-export types for convenience
export interface RGB {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

export interface RGBA {
	readonly r: number;
	readonly g: number;
	readonly b: number;
	readonly a: number;
}
