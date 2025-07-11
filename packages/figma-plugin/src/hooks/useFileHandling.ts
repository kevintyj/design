import { useCallback } from "react";
import type { ColorSystem } from "../types";

interface UseFileHandlingProps {
	setColorSystem: (system: ColorSystem | null) => void;
	setIsLoading: (loading: boolean) => void;
	setMessage: (message: string) => void;
	sendPluginMessage: (type: string, data?: any) => void;
	setParsedVariables?: (variables: any) => void; // Add this new prop
}

// Interface for the figma-colors.json format
interface FigmaColorsFormat {
	constantsLight: { gray: string; background: string };
	constantsDark: { gray: string; background: string };
	light: { [colorName: string]: string };
	dark: { [colorName: string]: string };
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

// Helper function to detect collections format
function isCollectionsFormat(data: any): boolean {
	return (
		data?.collections &&
		Array.isArray(data.collections) &&
		data.collections.length > 0 &&
		data.collections[0].variables &&
		(data.collections[0].variables.solid ||
			data.collections[0].variables.alpha ||
			data.collections[0].variables.overlays)
	);
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

// Helper function to convert collections format to raw Figma format (flexible for any structure)
function convertCollectionsToRawFormat(collectionsData: any): any {
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
	setIsLoading,
	setMessage,
	sendPluginMessage,
	setParsedVariables,
}: UseFileHandlingProps) => {
	const handleFileUpload = useCallback(
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
							setMessage("Figma colors file loaded and converted successfully!");
						} else if (isValidColorSystem(parsed)) {
							// Use as-is if it's already in the correct format
							setColorSystem(parsed);
							setMessage("JSON colors loaded successfully!");
						} else {
							setMessage("Invalid color system format. Please ensure the JSON file contains the correct structure.");
						}
					} else if (file.name.endsWith(".ts") || file.name.endsWith(".js")) {
						// For TypeScript/JavaScript files, we'll need to parse the exports
						setMessage("TypeScript/JavaScript file parsing not yet implemented. Please use JSON format.");
					}
				} catch (error) {
					setMessage(`Error parsing file: ${error}`);
				} finally {
					setIsLoading(false);
				}
			};

			reader.readAsText(file);
		},
		[setColorSystem, setIsLoading, setMessage],
	);

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
					if (isCollectionsFormat(parsedData)) {
						// Convert collections format to raw format
						const rawFormat = convertCollectionsToRawFormat(parsedData);
						if (setParsedVariables) {
							setParsedVariables(rawFormat);
							setMessage(
								`Collections format detected! Found ${rawFormat.variables.length} variables. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else if (isRawFigmaVariablesFormat(parsedData)) {
						// Store raw format for preview
						if (setParsedVariables) {
							setParsedVariables(parsedData);
							setMessage(
								`Raw Figma variables format detected! Found ${parsedData.variables.length} variables. Review and click "Import to Figma" to proceed.`,
							);
						}
					} else {
						setMessage(
							"Invalid variables file format. Please use either collections JSON or raw Figma variables JSON format.",
						);
					}
				} catch (error) {
					setMessage(`Error parsing variables file: ${error}`);
				} finally {
					setIsLoading(false);
				}
			};

			reader.readAsText(file);
		},
		[setIsLoading, setMessage, setParsedVariables],
	);

	const handleImportToFigma = useCallback(
		(parsedVariables: any) => {
			if (!parsedVariables) {
				setMessage("No variables data to import.");
				return;
			}

			setIsLoading(true);
			sendPluginMessage("import-figma-variables", parsedVariables);
		},
		[setIsLoading, sendPluginMessage, setMessage],
	);

	return {
		handleFileUpload,
		handleFigmaVariablesUpload,
		handleImportToFigma, // Add this new function
	};
};
