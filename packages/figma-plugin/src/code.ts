/// <reference types="@figma/plugin-typings" />

// Import types and utilities from our color generation packages
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
			case "export-figma-variables":
				await handleFigmaVariablesExport();
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
		let collection = figma.variables.getLocalVariableCollections().find((c) => c.name === collectionName);

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
		const lightRgb = hexToRgb(lightValue);
		const darkRgb = darkValue ? hexToRgb(darkValue) : lightRgb;

		// Set values for both modes
		variable.setValueForMode(lightModeId, lightRgb);
		variable.setValueForMode(darkModeId, darkRgb);
	} catch (error) {
		console.error(`Failed to import variable ${name}:`, error);
	}
}

// Convert hex color to RGB object for Figma
function hexToRgb(hex: string): RGB {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		throw new Error(`Invalid hex color: ${hex}`);
	}

	return {
		r: parseInt(result[1], 16) / 255,
		g: parseInt(result[2], 16) / 255,
		b: parseInt(result[3], 16) / 255,
	};
}

// Convert RGB to hex
function rgbToHex(rgb: RGB): string {
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

// Export current Figma variables
async function handleFigmaVariablesExport() {
	try {
		const collections = figma.variables.getLocalVariableCollections();
		const variables = figma.variables.getLocalVariables();

		const exportData: {
			collections: any[];
			variables: FigmaVariableExport[];
		} = {
			collections: [],
			variables: [],
		};

		// Export collections
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

		// Export variables (focusing on color variables for now)
		for (const variable of variables) {
			if (variable.resolvedType === "COLOR") {
				const collection = collections.find((c) => c.id === variable.variableCollectionId);

				const exportVariable: FigmaVariableExport = {
					id: variable.id,
					name: variable.name,
					variableCollectionId: variable.variableCollectionId,
					resolvedType: variable.resolvedType,
					valuesByMode: {},
					collection: collection
						? {
								id: collection.id,
								name: collection.name,
								modes: collection.modes.map((mode) => ({
									modeId: mode.modeId,
									name: mode.name,
								})),
							}
						: undefined,
				};

				// Get values for each mode
				for (const collection of collections) {
					if (collection.id === variable.variableCollectionId) {
						for (const mode of collection.modes) {
							try {
								const value = variable.valuesByMode[mode.modeId];
								if (value && typeof value === "object" && "r" in value) {
									exportVariable.valuesByMode[mode.modeId] = rgbToHex(value as RGB);
								}
							} catch (error) {
								console.error(`Failed to export value for variable ${variable.name} in mode ${mode.name}:`, error);
							}
						}
					}
				}

				exportData.variables.push(exportVariable);
			}
		}

		figma.ui.postMessage({
			type: "variables-exported",
			data: exportData,
		});
	} catch (error) {
		throw new Error(`Failed to export Figma variables: ${error}`);
	}
}

// Export current Figma variables as collections format
async function handleFigmaVariablesExportAsCollections() {
	try {
		const collections = figma.variables.getLocalVariableCollections();
		const variables = figma.variables.getLocalVariables();

		if (collections.length === 0 || variables.length === 0) {
			figma.ui.postMessage({
				type: "error",
				error: "No variables found to export",
			});
			return;
		}

		const collectionsFormat = {
			collections: collections.map((collection) => ({
				name: collection.name,
				modes: collection.modes.map((mode) => mode.name),
				variables: {
					solid: {} as Record<string, any>,
					alpha: {} as Record<string, any>,
					overlays: {
						black: {} as Record<string, any>,
						white: {} as Record<string, any>,
					},
				},
			})),
		};

		// Process variables by collection
		for (const variable of variables) {
			if (variable.resolvedType === "COLOR") {
				const collection = collections.find((c) => c.id === variable.variableCollectionId);
				if (!collection) continue;

				const collectionIndex = collections.findIndex((c) => c.id === collection.id);
				const targetCollection = collectionsFormat.collections[collectionIndex];

				// Parse variable name to determine category and step
				const nameParts = variable.name.split("/");
				let category = "solid";
				let colorName = nameParts[0];
				const step = nameParts[1] || "1";

				// Detect alpha or overlay variables
				if (colorName.includes("-alpha")) {
					category = "alpha";
					colorName = colorName.replace("-alpha", "");
				} else if (colorName.startsWith("overlay-")) {
					category = "overlays";
					const overlayType = colorName.replace("overlay-", "");
					colorName = overlayType;
				}

				// Get values for all modes
				const values: Record<string, string> = {};
				for (const mode of collection.modes) {
					const value = variable.valuesByMode[mode.modeId];
					if (value && typeof value === "object" && "r" in value) {
						values[mode.name.toLowerCase()] = rgbToHex(value as RGB);
					}
				}

				// Store in appropriate category
				if (category === "overlays") {
					if (!targetCollection.variables.overlays[colorName]) {
						targetCollection.variables.overlays[colorName] = {};
					}
					targetCollection.variables.overlays[colorName][step] = {
						type: "color",
						values: values,
					};
				} else {
					const targetCategory =
						category === "alpha" ? targetCollection.variables.alpha : targetCollection.variables.solid;
					if (!targetCategory[colorName]) {
						targetCategory[colorName] = {};
					}
					targetCategory[colorName][step] = {
						type: "color",
						values: values,
					};
				}
			}
		}

		figma.ui.postMessage({
			type: "variables-exported-collections",
			data: collectionsFormat,
		});
	} catch (error) {
		figma.ui.postMessage({
			type: "error",
			error: `Failed to export variables as collections: ${error}`,
		});
	}
}

// Export current Figma variables as raw format (existing functionality)
async function handleFigmaVariablesExportRaw() {
	try {
		const collections = figma.variables.getLocalVariableCollections();
		const variables = figma.variables.getLocalVariables();

		const exportData: {
			collections: any[];
			variables: FigmaVariableExport[];
		} = {
			collections: [],
			variables: [],
		};

		// Export collections
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

		// Export variables (focusing on color variables for now)
		for (const variable of variables) {
			if (variable.resolvedType === "COLOR") {
				const collection = collections.find((c) => c.id === variable.variableCollectionId);

				const exportVariable: FigmaVariableExport = {
					id: variable.id,
					name: variable.name,
					variableCollectionId: variable.variableCollectionId,
					resolvedType: variable.resolvedType,
					valuesByMode: {},
					collection: collection
						? {
								id: collection.id,
								name: collection.name,
								modes: collection.modes.map((mode) => ({
									modeId: mode.modeId,
									name: mode.name,
								})),
							}
						: undefined,
				};

				// Get values for each mode
				for (const collection of collections) {
					if (collection.id === variable.variableCollectionId) {
						for (const mode of collection.modes) {
							try {
								const value = variable.valuesByMode[mode.modeId];
								if (value && typeof value === "object" && "r" in value) {
									exportVariable.valuesByMode[mode.modeId] = rgbToHex(value as RGB);
								}
							} catch (error) {
								console.error(`Failed to export value for variable ${variable.name} in mode ${mode.name}:`, error);
							}
						}
					}
				}

				exportData.variables.push(exportVariable);
			}
		}

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
			let collection = figma.variables.getLocalVariableCollections().find((c) => c.name === importCollection.name);

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
			for (const [modeId, hexValue] of Object.entries(importVariable.valuesByMode)) {
				const mode = collection.modes.find((m) => {
					if (!importVariable.collection || !importVariable.collection.modes) {
						return false;
					}
					const importMode = importVariable.collection.modes.find(
						(im: { modeId: string; name: string }) => im.modeId === modeId,
					);
					return importMode && importMode.name === m.name;
				});

				if (mode && typeof hexValue === "string") {
					try {
						const rgbValue = hexToRgb(hexValue);
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
