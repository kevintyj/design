/// <reference types="@figma/plugin-typings" />

import { exportFigmaVariablesAsCollections, exportFigmaVariablesRaw } from "@design/figma-to-json";

interface ColorDefinition {
	[colorName: string]: string;
}

interface ColorSystem {
	light: ColorDefinition;
	dark: ColorDefinition;
	constants: {
		light: { gray: string; background: string };
		dark: { gray: string; background: string };
	};
}

interface FigmaVariableExport {
	id: string;
	name: string;
	variableCollectionId: string;
	resolvedType: string;
	valuesByMode: { [modeId: string]: any };
	collection?: {
		id: string;
		name: string;
		modes: { modeId: string; name: string }[];
	};
}

// Initialize the plugin UI
figma.showUI(__html__, { width: 720, height: 640 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
	try {
		switch (msg.type) {
			case "import-colors":
				await handleColorImport(msg.data);
				break;
			case "export-css":
				await handleCSSExport(msg.data);
				break;
			case "export-json":
				await handleJSONExport(msg.data);
				break;
			case "export-figma-variables-collections":
				await handleFigmaVariablesExportAsCollections();
				break;
			case "export-figma-variables-raw":
				await handleFigmaVariablesExportRaw();
				break;
			case "import-figma-variables":
				await handleFigmaVariablesImport(msg.data);
				break;
			case "load-client-storage":
				try {
					console.log("Received load-client-storage message:", msg);

					const preferencesKey = msg.data.preferencesKey;
					const colorSystemKey = msg.data.colorSystemKey;
					const generatedColorsKey = msg.data.generatedColorsKey;

					console.log("Loading client storage with keys:", preferencesKey, colorSystemKey, generatedColorsKey);

					if (!preferencesKey || !colorSystemKey) {
						console.error("Missing required keys:", { preferencesKey, colorSystemKey });
						return;
					}

					const preferences = await figma.clientStorage.getAsync(preferencesKey);
					const colorSystem = await figma.clientStorage.getAsync(colorSystemKey);
					const generatedColors = generatedColorsKey ? await figma.clientStorage.getAsync(generatedColorsKey) : null;

					figma.ui.postMessage({
						type: "client-storage-loaded",
						data: {
							preferences: preferences || null,
							colorSystem: colorSystem || null,
							generatedColors: generatedColors || null,
						},
					});
				} catch (error) {
					console.error("Error loading from client storage:", error);
				}
				break;
			case "save-color-system":
				try {
					await figma.clientStorage.setAsync(msg.data.key, msg.data.colorSystem);
				} catch (error) {
					console.error("Error saving color system:", error);
				}
				break;
			case "save-generated-colors":
				try {
					await figma.clientStorage.setAsync(msg.data.key, msg.data.generatedColors);
				} catch (error) {
					console.error("Error saving generated colors:", error);
				}
				break;
			case "save-preferences":
				try {
					await figma.clientStorage.setAsync(msg.data.key, msg.data.preferences);
				} catch (error) {
					console.error("Error saving preferences:", error);
				}
				break;
			case "remove-color-system":
				try {
					await figma.clientStorage.deleteAsync(msg.data.key);
				} catch (error) {
					console.error("Error removing color system:", error);
				}
				break;
			case "remove-generated-colors":
				try {
					await figma.clientStorage.deleteAsync(msg.data.key);
				} catch (error) {
					console.error("Error removing generated colors:", error);
				}
				break;
			default:
				console.log("Unknown message type:", msg.type);
		}
	} catch (error) {
		figma.ui.postMessage({
			type: "error",
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

// Import colors to Figma as local variables
async function handleColorImport(colorSystem: ColorSystem) {
	try {
		// Create or find a collection for our color system
		const collectionName = "Design System Colors";
		const collections = await figma.variables.getLocalVariableCollectionsAsync();
		let collection = collections.find((c) => c.name === collectionName);

		if (!collection) {
			collection = figma.variables.createVariableCollection(collectionName);
		}

		// Ensure we have light and dark modes
		const lightMode = collection.modes.find((m) => m.name === "Light") || collection.modes[0];
		let darkMode = collection.modes.find((m) => m.name === "Dark");

		if (!darkMode) {
			collection.addMode("Dark");
			darkMode = collection.modes.find((m) => m.name === "Dark")!;
		}

		// Rename default mode if needed
		if (lightMode.name !== "Light") {
			collection.renameMode(lightMode.modeId, "Light");
		}

		// Import light mode colors
		for (const [colorName, colorValue] of Object.entries(colorSystem.light)) {
			await importColorVariable(
				collection,
				colorName,
				colorValue,
				lightMode.modeId,
				darkMode.modeId,
				colorSystem.dark[colorName],
			);
		}

		// Import constants
		await importColorVariable(
			collection,
			"gray",
			colorSystem.constants.light.gray,
			lightMode.modeId,
			darkMode.modeId,
			colorSystem.constants.dark.gray,
		);
		await importColorVariable(
			collection,
			"background",
			colorSystem.constants.light.background,
			lightMode.modeId,
			darkMode.modeId,
			colorSystem.constants.dark.background,
		);

		figma.ui.postMessage({
			type: "colors-imported",
			data: { message: `Imported ${Object.keys(colorSystem.light).length + 2} color variables` },
		});
	} catch (error) {
		throw new Error(`Failed to import colors: ${error}`);
	}
}

// Helper function to create/update a color variable
async function importColorVariable(
	collection: VariableCollection,
	name: string,
	lightValue: string,
	lightModeId: string,
	darkModeId: string,
	darkValue?: string,
) {
	try {
		// Check if variable already exists
		let variable = figma.variables
			.getLocalVariables()
			.find((v) => v.name === name && v.variableCollectionId === collection.id);

		if (!variable) {
			variable = figma.variables.createVariable(name, collection, "COLOR");
		}

		// Convert hex to RGB
		const lightRgb = convertColorToFigmaRGB(lightValue);
		const darkRgb = darkValue ? convertColorToFigmaRGB(darkValue) : lightRgb;

		// Set values for both modes
		variable.setValueForMode(lightModeId, lightRgb);
		variable.setValueForMode(darkModeId, darkRgb);
	} catch (error) {
		console.error(`Failed to import variable ${name}:`, error);
	}
}

// Convert any hex format to RGB/RGBA object for Figma
// Supported formats:
// - 3-character hex: #abc, #f00 (expands to #aabbcc, #ff0000)
// - 6-character hex: #aabbcc, #ff0000 (returns RGB)
// - 8-character hex with alpha: #aabbccdd, #ff000080 (returns RGBA)
// Figma supports both RGB and RGBA color values in variables
function convertColorToFigmaRGB(colorString: string): RGB | RGBA {
	try {
		// Remove # if present and convert to lowercase
		const hex = colorString.replace("#", "").toLowerCase();

		// Validate hex characters
		if (!/^[0-9a-f]+$/.test(hex)) {
			throw new Error(`Invalid hex characters in: ${colorString}`);
		}

		let r: number, g: number, b: number, a: number | undefined;

		if (hex.length === 3) {
			// 3-character hex: #abc -> #aabbcc
			r = parseInt(hex[0] + hex[0], 16) / 255;
			g = parseInt(hex[1] + hex[1], 16) / 255;
			b = parseInt(hex[2] + hex[2], 16) / 255;
		} else if (hex.length === 6) {
			// 6-character hex: #aabbcc
			r = parseInt(hex.substring(0, 2), 16) / 255;
			g = parseInt(hex.substring(2, 4), 16) / 255;
			b = parseInt(hex.substring(4, 6), 16) / 255;
		} else if (hex.length === 8) {
			// 8-character hex with alpha: #aabbccdd
			r = parseInt(hex.substring(0, 2), 16) / 255;
			g = parseInt(hex.substring(2, 4), 16) / 255;
			b = parseInt(hex.substring(4, 6), 16) / 255;
			a = parseInt(hex.substring(6, 8), 16) / 255;
		} else {
			throw new Error(`Invalid hex length: ${hex.length} characters in ${colorString}`);
		}

		// Ensure values are within 0-1 range
		const clampedR = Math.max(0, Math.min(1, r));
		const clampedG = Math.max(0, Math.min(1, g));
		const clampedB = Math.max(0, Math.min(1, b));

		// Return RGBA if alpha is present, otherwise RGB
		if (a !== undefined) {
			const clampedA = Math.max(0, Math.min(1, a));
			return {
				r: clampedR,
				g: clampedG,
				b: clampedB,
				a: clampedA,
			};
		} else {
			return {
				r: clampedR,
				g: clampedG,
				b: clampedB,
			};
		}
	} catch (error) {
		console.error(`Failed to convert color ${colorString}:`, error);
		// Fallback to a default color (mid-gray) if conversion fails
		return { r: 0.5, g: 0.5, b: 0.5 };
	}
}

// Legacy function for backwards compatibility - now supports alpha/transparency
function _hexToRgb(hex: string): RGB | RGBA {
	return convertColorToFigmaRGB(hex);
}

// Convert RGB to hex
function _rgbToHex(rgb: RGB): string {
	const toHex = (c: number) => {
		const hex = Math.round(c * 255).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};
	return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Handle CSS export
async function handleCSSExport(colorSystem: ColorSystem) {
	try {
		let cssContent = ":root {\n";

		// Light mode variables
		for (const [colorName, colorValue] of Object.entries(colorSystem.light)) {
			cssContent += `  --color-${colorName}: ${colorValue};\n`;
		}
		cssContent += `  --color-gray: ${colorSystem.constants.light.gray};\n`;
		cssContent += `  --color-background: ${colorSystem.constants.light.background};\n`;
		cssContent += "}\n\n";

		// Dark mode variables
		cssContent += '[data-theme="dark"] {\n';
		for (const [colorName, colorValue] of Object.entries(colorSystem.dark)) {
			cssContent += `  --color-${colorName}: ${colorValue};\n`;
		}
		cssContent += `  --color-gray: ${colorSystem.constants.dark.gray};\n`;
		cssContent += `  --color-background: ${colorSystem.constants.dark.background};\n`;
		cssContent += "}\n";

		// Create a downloadable blob
		figma.ui.postMessage({
			type: "export-complete",
			data: {
				content: cssContent,
				filename: "colors.css",
				type: "css",
			},
		});
	} catch (error) {
		throw new Error(`Failed to export CSS: ${error}`);
	}
}

// Handle JSON export
async function handleJSONExport(colorSystem: ColorSystem) {
	try {
		const jsonContent = JSON.stringify(colorSystem, null, 2);

		figma.ui.postMessage({
			type: "export-complete",
			data: {
				content: jsonContent,
				filename: "colors.json",
				type: "json",
			},
		});
	} catch (error) {
		throw new Error(`Failed to export JSON: ${error}`);
	}
}

// Export current Figma variables as collections format using @design/figma-to-json
async function handleFigmaVariablesExportAsCollections() {
	try {
		// Use the new package to export all collections with full transparency support
		const collectionsData = await exportFigmaVariablesAsCollections({
			includeAllVariableTypes: false, // Only colors for now
			preserveVariableStructure: true,
			includeMetadata: true,
			prettyPrint: true,
		});

		if (collectionsData.collections.length === 0) {
			figma.ui.postMessage({
				type: "error",
				error: "No color variables found to export",
			});
			return;
		}

		figma.ui.postMessage({
			type: "variables-exported-collections",
			data: collectionsData,
		});
	} catch (error) {
		figma.ui.postMessage({
			type: "error",
			error: `Failed to export variables as collections: ${error}`,
		});
	}
}

// Export current Figma variables as raw format with full transparency support
async function handleFigmaVariablesExportRaw() {
	try {
		// Use the new package to export with full information including transparency
		const exportData = await exportFigmaVariablesRaw();

		figma.ui.postMessage({
			type: "variables-exported-raw",
			data: exportData,
		});
	} catch (error) {
		figma.ui.postMessage({
			type: "error",
			error: `Failed to export raw variables: ${error}`,
		});
	}
}

// Import Figma variables from JSON
async function handleFigmaVariablesImport(variablesData: any) {
	try {
		const { collections: importCollections, variables: importVariables } = variablesData;

		// Create or update collections
		const collectionMap = new Map<string, VariableCollection>();

		for (const importCollection of importCollections) {
			const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
			let collection = localCollections.find((c) => c.name === importCollection.name);

			if (!collection) {
				collection = figma.variables.createVariableCollection(importCollection.name);

				// Handle the default mode that Figma creates
				if (importCollection.modes && importCollection.modes.length > 0) {
					// Rename the default mode to match the first imported mode
					const defaultMode = collection.modes[0];
					const firstImportMode = importCollection.modes[0];

					if (defaultMode.name !== firstImportMode.name) {
						collection.renameMode(defaultMode.modeId, firstImportMode.name);
					}

					// Add remaining modes (skip the first one since we renamed the default)
					for (let i = 1; i < importCollection.modes.length; i++) {
						const importMode = importCollection.modes[i];
						const existingMode = collection.modes.find((m) => m.name === importMode.name);
						if (!existingMode) {
							collection.addMode(importMode.name);
						}
					}
				}
			} else {
				// For existing collections, add missing modes
				for (const importMode of importCollection.modes) {
					const existingMode = collection.modes.find((m) => m.name === importMode.name);
					if (!existingMode) {
						collection.addMode(importMode.name);
					}
				}
			}

			collectionMap.set(importCollection.id, collection);
		}

		// Import variables
		let importedCount = 0;
		for (const importVariable of importVariables) {
			const collection = collectionMap.get(importVariable.variableCollectionId);
			if (!collection) continue;

			// Check if variable already exists
			let variable = figma.variables
				.getLocalVariables()
				.find((v) => v.name === importVariable.name && v.variableCollectionId === collection.id);

			if (!variable) {
				variable = figma.variables.createVariable(importVariable.name, collection, "COLOR");
			}

			// Set values for each mode
			for (const [modeId, colorValue] of Object.entries(importVariable.valuesByMode)) {
				const mode = collection.modes.find((m) => {
					if (!importVariable.collection || !importVariable.collection.modes) {
						return false;
					}
					const importMode = importVariable.collection.modes.find(
						(im: { modeId: string; name: string }) => im.modeId === modeId,
					);
					return importMode && importMode.name === m.name;
				});

				if (mode && colorValue) {
					try {
						let rgbValue: RGB;

						// Handle different color value formats
						if (typeof colorValue === "string") {
							// Raw format: hex string
							rgbValue = convertColorToFigmaRGB(colorValue);
						} else if (
							typeof colorValue === "object" &&
							colorValue !== null &&
							"r" in colorValue &&
							"g" in colorValue &&
							"b" in colorValue &&
							typeof colorValue.r === "number" &&
							typeof colorValue.g === "number" &&
							typeof colorValue.b === "number"
						) {
							// Collections format: Figma color object
							rgbValue = {
								r: colorValue.r,
								g: colorValue.g,
								b: colorValue.b,
							};
						} else {
							console.warn(`Unsupported color value format for ${importVariable.name}:`, colorValue);
							continue;
						}

						variable.setValueForMode(mode.modeId, rgbValue);
					} catch (error) {
						console.error(`Failed to set value for variable ${importVariable.name}:`, error);
					}
				}
			}

			importedCount++;
		}

		figma.ui.postMessage({
			type: "variables-imported",
			data: { message: `Imported ${importedCount} variables` },
		});
	} catch (error) {
		throw new Error(`Failed to import Figma variables: ${error}`);
	}
}
