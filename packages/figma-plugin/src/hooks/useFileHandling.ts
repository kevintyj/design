import type { ColorSystem as ColorSystemCore } from "@kevintyj/design-color-core";
import { generateCollectionsJSON } from "@kevintyj/design-color-json";
import { convertSimpleCollectionOutputToRawFormat, isSimpleCollectionOutputFormat } from "@kevintyj/design-figma-json";
import type { SpacingSystem as SpacingSystemCore } from "@kevintyj/design-spacing-core";
import { generateCollectionsSpacingJSON } from "@kevintyj/design-spacing-json";
import { useCallback } from "react";
import { toast } from "../hooks/useToast";
import type { ColorSystem, SpacingSystem } from "../types";

interface UseFileHandlingProps {
	setColorSystem: (system: ColorSystem | null) => void;
	setSpacingSystem: (system: SpacingSystem | null) => void;
	setIsLoading: (loading: boolean) => void;
	sendPluginMessage: (type: string, data?: any) => void;
	setParsedVariables?: (variables: any) => void;
}

// Helper function to detect and transform figma-colors.json format
function transformFigmaColorsFormat(data: any): ColorSystem | null {
	// Check if this looks like the figma-colors.json format
	if (data.constantsLight && data.constantsDark && data.light && data.dark) {
		return {
			light: data.light,
			dark: data.dark,
			constants: {
				light: data.constantsLight,
				dark: data.constantsDark,
			},
		};
	}
	return null;
}

// Helper function to validate ColorSystem format
function isValidColorSystem(data: any): data is ColorSystem {
	return (
		data &&
		typeof data === "object" &&
		data.light &&
		data.dark &&
		data.constants &&
		data.constants.light &&
		data.constants.dark
	);
}

// Helper function to validate SpacingSystem format
function isValidSpacingSystem(data: any): data is SpacingSystem {
	return (
		data &&
		typeof data === "object" &&
		data.spacing &&
		typeof data.spacing === "object" &&
		typeof data.multiplier === "number" &&
		data.multiplier > 0
	);
}

// Helper function to transform various spacing file formats
function _transformSpacingFormat(data: any): SpacingSystem | null {
	// Check if it's already in the correct format
	if (isValidSpacingSystem(data)) {
		return data;
	}

	// Check if it's a TypeScript/JavaScript export format
	if (data.spacing && (data.spacingMultiplier || data.multiplier)) {
		return {
			spacing: data.spacing,
			multiplier: data.spacingMultiplier || data.multiplier,
			remValue: data.remValue,
		};
	}

	// Check if it's a direct spacing definitions object (legacy format)
	if (typeof data === "object" && !data.spacing && !data.multiplier) {
		// Assume it's a direct spacing object, use default multiplier
		return {
			spacing: data,
			multiplier: 4, // Default 4px multiplier
			remValue: 16,
		};
	}

	return null;
}

// Helper function to detect color-generation-json collections format specifically
function isColorGenerationJSONFormat(data: any): boolean {
	// Handle both new format (array) and old format (single object)
	if (data?.collections) {
		// New format: array of collections
		if (Array.isArray(data.collections)) {
			return data.collections.some(
				(collection: any) => collection.variables?.solid && typeof collection.variables.solid === "object",
			);
		}
		// Old format: single collection object (for backward compatibility)
		return (
			data.collections.$extensions?.["com.figma"] &&
			data.collections.colors &&
			data.collections.colors.$type === "color"
		);
	}
	return false;
}

// Helper function to detect spacing-generation-json collections format specifically
function isSpacingGenerationJSONFormat(data: any): boolean {
	// Handle both new format (array) and old format (single object)
	if (data?.collections) {
		// New format: array of collections
		if (Array.isArray(data.collections)) {
			return data.collections.some(
				(collection: any) =>
					collection.variables &&
					typeof collection.variables === "object" &&
					(collection.variables.spacing || collection.variables["spacing-px"] || collection.variables["spacing-rem"]),
			);
		}
		// Old format: single collection object (for backward compatibility)
		return (
			typeof data.collections.name === "string" &&
			Array.isArray(data.collections.modes) &&
			data.collections.variables &&
			typeof data.collections.variables === "object" &&
			(data.collections.variables.spacing ||
				data.collections.variables["spacing-px"] ||
				data.collections.variables["spacing-rem"])
		);
	}
	return false;
}

// Helper function to detect SimpleCollectionOutput from color-generation-json package
function isSimpleCollectionFormat(data: any): boolean {
	// Handle both new format (array) and old format (single object)
	if (data?.collections) {
		// New format: array of collections
		if (Array.isArray(data.collections)) {
			return data.collections.some(
				(collection: any) =>
					typeof collection.name === "string" &&
					Array.isArray(collection.modes) &&
					collection.variables &&
					typeof collection.variables === "object" &&
					collection.variables.solid &&
					typeof collection.variables.solid === "object",
			);
		}
		// Old format: single collection object (for backward compatibility)
		return (
			typeof data.collections.name === "string" &&
			Array.isArray(data.collections.modes) &&
			data.collections.variables &&
			typeof data.collections.variables === "object" &&
			data.collections.variables.solid &&
			typeof data.collections.variables.solid === "object"
		);
	}
	return false;
}

// Helper function to detect collections format (both old and new W3C format)
function isCollectionsFormat(data: any): boolean {
	// Check for color-generation-json format first
	if (isColorGenerationJSONFormat(data)) {
		return true;
	}

	// Check for SimpleCollectionOutput format (array of collections from figma-to-json)
	if (isSimpleCollectionOutputFormat(data)) {
		return true;
	}

	// Check for SimpleCollectionFormat from color-generation-json (single collection)
	if (isSimpleCollectionFormat(data)) {
		return true;
	}

	// Check for old format (array-based)
	const isOldFormat =
		data?.collections &&
		Array.isArray(data.collections) &&
		data.collections.length > 0 &&
		data.collections[0].variables &&
		(data.collections[0].variables.solid ||
			data.collections[0].variables.alpha ||
			data.collections[0].variables.overlays);

	// Check for other W3C format variants
	const isOtherW3CFormat =
		data?.collections &&
		!Array.isArray(data.collections) &&
		data.collections.$extensions &&
		data.collections.colors &&
		data.collections.colors.$type === "color";

	return isOldFormat || isOtherW3CFormat;
}

// Helper function to detect raw Figma variables format
function isRawFigmaVariablesFormat(data: any): boolean {
	return (
		data?.collections &&
		Array.isArray(data.collections) &&
		Array.isArray(data.variables) &&
		data.variables.every((v: any) => v.id && v.name && v.valuesByMode)
	);
}

// Helper function to convert new W3C format to raw Figma format
function convertW3CToRawFormat(collectionsData: any): any {
	const rawFormat: {
		collections: any[];
		variables: any[];
	} = {
		collections: [],
		variables: [],
	};

	const collection = collectionsData.collections;
	const collectionId = `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	// Extract modes from extensions
	const modes = collection.$extensions?.["com.figma"]?.modes || ["light", "dark"];
	const modeObjects = modes.map((mode: string, index: number) => ({
		modeId: `mode-${index}`,
		name: mode.toLowerCase(),
	}));

	rawFormat.collections.push({
		id: collectionId,
		name: "Generated Colors",
		modes: modeObjects,
	});

	// Process colors from W3C format
	if (collection.colors) {
		processW3CVariables(collection.colors, collectionId, modeObjects, rawFormat.variables);
	}

	return rawFormat;
}

// Helper function to process W3C format variables
function processW3CVariables(colors: any, collectionId: string, modes: any[], outputVariables: any[], prefix = "") {
	Object.entries(colors).forEach(([key, value]: [string, any]) => {
		if (key === "$type") return; // Skip type declarations

		if (value && typeof value === "object") {
			// Check if this is a variable definition (has $value and $extensions)
			if (value.$value && value.$extensions && value.$extensions["com.figma"]) {
				const variableName = prefix ? `${prefix}/${key}` : key;
				const variableId = `${variableName.replace(/[/\s]/g, "-")}-${Date.now()}`;

				// Create valuesByMode from the figma extensions
				const valuesByMode: any = {};
				const figmaExtensions = value.$extensions["com.figma"];

				if (figmaExtensions.modes) {
					modes.forEach((mode) => {
						const modeValue = figmaExtensions.modes[mode.name];
						if (modeValue !== undefined) {
							valuesByMode[mode.modeId] = modeValue;
						}
					});
				}

				outputVariables.push({
					id: variableId,
					name: variableName,
					variableCollectionId: collectionId,
					resolvedType: "COLOR",
					valuesByMode: valuesByMode,
					collection: {
						id: collectionId,
						name: "Generated Colors",
						modes: modes,
					},
				});
			} else {
				// Recursively process nested objects
				const newPrefix = prefix ? `${prefix}/${key}` : key;
				processW3CVariables(value, collectionId, modes, outputVariables, newPrefix);
			}
		}
	});
}

// Helper function to convert old collections format to raw Figma format
function convertOldCollectionsToRawFormat(collectionsData: any): any {
	const rawFormat: {
		collections: any[];
		variables: any[];
	} = {
		collections: [],
		variables: [],
	};

	// Process each collection
	collectionsData.collections.forEach((collection: any) => {
		const collectionId = `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Create modes based on the collection's modes or default to light/dark
		const modes = collection.modes
			? collection.modes.map((mode: string, index: number) => ({
					modeId: `mode-${index}`,
					name: mode.toLowerCase(),
				}))
			: [
					{ modeId: "light-mode", name: "light" },
					{ modeId: "dark-mode", name: "dark" },
				];

		rawFormat.collections.push({
			id: collectionId,
			name: collection.name || "Imported Collection",
			modes: modes,
		});

		// Process all variable categories flexibly
		if (collection.variables) {
			processVariableCategory(collection.variables, collectionId, collection.name, modes, rawFormat.variables);
		}
	});

	return rawFormat;
}

// Helper function to convert array of collections to raw Figma format (new format)
function convertCollectionsArrayToRawFormat(collectionsData: any): any {
	const rawFormat: {
		collections: any[];
		variables: any[];
	} = {
		collections: [],
		variables: [],
	};

	// Process each collection in the array
	collectionsData.collections.forEach((collection: any) => {
		const collectionId = `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Create modes based on the collection's modes
		const modes = collection.modes
			? collection.modes.map((mode: string, index: number) => ({
					modeId: `mode-${index}`,
					name: mode.toLowerCase(),
				}))
			: [{ modeId: "default", name: "default" }];

		rawFormat.collections.push({
			id: collectionId,
			name: collection.name || "Imported Collection",
			modes: modes,
		});

		// Process all variable categories flexibly
		if (collection.variables) {
			processVariableCategory(collection.variables, collectionId, collection.name, modes, rawFormat.variables);
		}
	});

	return rawFormat;
}

// Helper function to convert collections format to raw Figma format (handles both old and new formats)
function convertCollectionsToRawFormat(collectionsData: any): any {
	// Check if it's the new format (array of collections)
	if (collectionsData?.collections && Array.isArray(collectionsData.collections)) {
		return convertCollectionsArrayToRawFormat(collectionsData);
	}

	// Check if it's the SimpleCollectionFormat from color-generation-json (single collection)
	if (isSimpleCollectionFormat(collectionsData)) {
		return convertSimpleCollectionOutputToRawFormat(collectionsData);
	}

	// Check if it's the new W3C format
	if (
		collectionsData?.collections &&
		!Array.isArray(collectionsData.collections) &&
		collectionsData.collections.$extensions
	) {
		return convertW3CToRawFormat(collectionsData);
	}

	// Otherwise, use the old format converter
	return convertOldCollectionsToRawFormat(collectionsData);
}

// Recursive function to process any variable structure
function processVariableCategory(
	variables: any,
	collectionId: string,
	collectionName: string,
	modes: any[],
	outputVariables: any[],
	prefix = "",
) {
	Object.entries(variables).forEach(([key, value]: [string, any]) => {
		if (value && typeof value === "object") {
			// Check if this is a variable definition (has type and values)
			if (value.type && value.values) {
				const variableName = prefix ? `${prefix}/${key}` : key;
				const variableId = `${variableName.replace(/[/\s]/g, "-")}-${Date.now()}`;

				// Create valuesByMode from the values object
				const valuesByMode: any = {};
				modes.forEach((mode) => {
					const modeValue = value.values[mode.name];
					if (modeValue !== undefined) {
						valuesByMode[mode.modeId] = modeValue;
					}
				});

				outputVariables.push({
					id: variableId,
					name: variableName,
					variableCollectionId: collectionId,
					resolvedType: value.type.toUpperCase(),
					valuesByMode: valuesByMode,
					collection: {
						id: collectionId,
						name: collectionName || "Imported Collection",
						modes: modes,
					},
				});
			} else {
				// Recursively process nested objects
				const newPrefix = prefix ? `${prefix}/${key}` : key;
				processVariableCategory(value, collectionId, collectionName, modes, outputVariables, newPrefix);
			}
		}
	});
}

export const useFileHandling = ({
	setColorSystem,
	setSpacingSystem,
	setIsLoading,
	sendPluginMessage,
	setParsedVariables,
}: UseFileHandlingProps) => {
	const handleColorFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			setIsLoading(true);
			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;

					if (file.name.endsWith(".json")) {
						// Parse JSON file
						const parsed = JSON.parse(content);

						// Try to transform figma-colors.json format first
						const transformedColors = transformFigmaColorsFormat(parsed);
						if (transformedColors) {
							setColorSystem(transformedColors);
							toast.success("Figma colors file loaded and converted successfully!");
						} else if (isValidColorSystem(parsed)) {
							// Use as-is if it's already in the correct format
							setColorSystem(parsed);
							toast.success("JSON colors loaded successfully!");
						} else {
							toast.error("Invalid color system format. Please ensure the JSON file contains the correct structure.");
						}
					} else if (file.name.endsWith(".ts") || file.name.endsWith(".js")) {
						// For TypeScript/JavaScript files, we'll need to parse the exports
						toast.info("TypeScript/JavaScript file parsing not yet implemented. Please use JSON format.");
					}
				} catch (error) {
					toast.error(`Error parsing file: ${error}`);
				} finally {
					setIsLoading(false);
				}
			};

			reader.readAsText(file);
		},
		[setColorSystem, setIsLoading],
	);

	const _handleSpacingFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			setIsLoading(true);
			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;

					if (file.name.endsWith(".json")) {
						// Parse JSON file
						const parsed = JSON.parse(content);

						// Try to transform various spacing formats
						const transformedSpacing = _transformSpacingFormat(parsed);
						if (transformedSpacing) {
							// Validate the transformed spacing system
							try {
								// Validate the spacing system manually since import might have issues
								if (!transformedSpacing.spacing || typeof transformedSpacing.spacing !== "object") {
									throw new Error("Spacing definitions must be an object");
								}
								if (Object.keys(transformedSpacing.spacing).length === 0) {
									throw new Error("Spacing definitions cannot be empty");
								}
								if (typeof transformedSpacing.multiplier !== "number" || transformedSpacing.multiplier <= 0) {
									throw new Error("Multiplier must be a positive number");
								}
								// Validate spacing values
								for (const [name, value] of Object.entries(transformedSpacing.spacing)) {
									if (typeof value !== "number" || value < 0) {
										throw new Error(`Invalid spacing value for "${name}": must be a non-negative number`);
									}
								}
								setSpacingSystem(transformedSpacing);
								toast.success("Spacing system loaded successfully!");
							} catch (validationError) {
								toast.error(`Invalid spacing system: ${validationError}`);
							}
						} else {
							toast.error(
								"Invalid spacing system format. Please ensure the JSON file contains spacing definitions and multiplier.",
							);
						}
					} else if (file.name.endsWith(".ts") || file.name.endsWith(".js")) {
						// For TypeScript/JavaScript files, we'll need to parse the exports
						toast.info("TypeScript/JavaScript file parsing not yet implemented. Please use JSON format.");
					}
				} catch (error) {
					toast.error(`Error parsing file: ${error}`);
				} finally {
					setIsLoading(false);
				}
			};

			reader.readAsText(file);
		},
		[setSpacingSystem, setIsLoading],
	);

	// Legacy handleFileUpload for backward compatibility (defaults to color)
	const handleFileUpload = handleColorFileUpload;

	const handleFigmaVariablesUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			setIsLoading(true);
			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;
					const parsedData = JSON.parse(content);

					// Detect format and validate
					if (isColorGenerationJSONFormat(parsedData)) {
						// Handle color-generation-json format specifically
						const rawFormat = convertCollectionsToRawFormat(parsedData);
						if (setParsedVariables) {
							setParsedVariables(rawFormat);
							toast.success(
								`Color Generation JSON format detected! Found ${rawFormat.variables.length} color variables from the generated collections. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else if (isSpacingGenerationJSONFormat(parsedData)) {
						// Handle spacing-generation-json format specifically
						const rawFormat = convertCollectionsToRawFormat(parsedData);
						if (setParsedVariables) {
							setParsedVariables(rawFormat);
							toast.success(
								`Spacing Generation JSON format detected! Found ${rawFormat.variables.length} spacing variables from the generated collections. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else if (isCollectionsFormat(parsedData)) {
						// Handle other collections formats
						const rawFormat = convertCollectionsToRawFormat(parsedData);
						if (setParsedVariables) {
							setParsedVariables(rawFormat);
							toast.success(
								`Collections format detected! Found ${rawFormat.variables.length} variables. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else if (isRawFigmaVariablesFormat(parsedData)) {
						// Store raw format for preview
						if (setParsedVariables) {
							setParsedVariables(parsedData);
							toast.success(
								`Raw Figma variables format detected! Found ${parsedData.variables.length} variables. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else if (isSimpleCollectionFormat(parsedData)) {
						// Handle SimpleCollectionOutput format
						const rawFormat = convertSimpleCollectionOutputToRawFormat(parsedData);
						if (setParsedVariables) {
							setParsedVariables(rawFormat);
							toast.success(
								`Simple Collection format detected! Found ${rawFormat.variables.length} variables. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else {
						toast.error(
							"Invalid variables file format. Please use either color-generation-json collections, spacing-generation-json collections, other collections JSON, or raw Figma variables JSON format.",
						);
					}
				} catch (error) {
					toast.error(`Error parsing variables file: ${error}`);
				} finally {
					setIsLoading(false);
				}
			};

			reader.readAsText(file);
		},
		[setIsLoading, setParsedVariables],
	);

	const handleImportFromGeneratedColors = useCallback(
		(generatedColorSystem: ColorSystemCore) => {
			if (!generatedColorSystem) {
				toast.error("No generated color system available to import.");
				return;
			}

			setIsLoading(true);
			try {
				// Convert generated color system to collections format
				const collectionsConfig = generateCollectionsJSON(generatedColorSystem, {
					collectionName: "Generated Colors",
					includeAlpha: true,
					includeGrayScale: true,
					includeOverlays: true,
					prettyPrint: true,
				});

				// Convert collections format to raw format for variable import
				const rawFormat = convertCollectionsToRawFormat(collectionsConfig);

				// Set the parsed variables for preview and import
				if (setParsedVariables) {
					setParsedVariables(rawFormat);
					toast.success(
						`Generated colors prepared for import! Found ${rawFormat.variables.length} color variables from ${generatedColorSystem.colorNames.length} color scales. Review and click "Import to Figma" to proceed.`,
					);
				}
			} catch (error) {
				toast.error(`Error preparing generated colors for import: ${error}`);
			} finally {
				setIsLoading(false);
			}
		},
		[setIsLoading, setParsedVariables],
	);

	const handleImportFromGeneratedSpacing = useCallback(
		(generatedSpacingSystem: SpacingSystemCore) => {
			if (!generatedSpacingSystem) {
				toast.error("No generated spacing system available to import.");
				return;
			}

			setIsLoading(true);
			try {
				// Convert generated spacing system to collections format
				const collectionsConfig = generateCollectionsSpacingJSON(generatedSpacingSystem, {
					collectionName: "Generated Spacing",
					includePx: true,
					includeRem: true,
					prettyPrint: true,
				});

				// Convert collections format to raw format for variable import
				const rawFormat = convertCollectionsToRawFormat(collectionsConfig);

				// Set the parsed variables for preview and import
				if (setParsedVariables) {
					setParsedVariables(rawFormat);
					toast.success(
						`Generated spacing prepared for import! Found ${rawFormat.variables.length} spacing variables from ${Object.keys(generatedSpacingSystem.spacing.values).length} spacing values. Review and click "Import to Figma" to proceed.`,
					);
				}
			} catch (error) {
				toast.error(`Error preparing generated spacing for import: ${error}`);
			} finally {
				setIsLoading(false);
			}
		},
		[setIsLoading, setParsedVariables],
	);

	const handleImportToFigma = useCallback(
		(parsedVariables: any) => {
			if (!parsedVariables) {
				toast.error("No variables data to import.");
				return;
			}

			setIsLoading(true);
			sendPluginMessage("import-figma-variables", parsedVariables);
		},
		[setIsLoading, sendPluginMessage],
	);

	return {
		handleFileUpload,
		handleColorFileUpload,
		handleSpacingFileUpload: _handleSpacingFileUpload,
		handleFigmaVariablesUpload,
		handleImportToFigma, // Add this new function
		handleImportFromGeneratedColors, // Add this new function
		handleImportFromGeneratedSpacing, // Add this new function
	};
};
