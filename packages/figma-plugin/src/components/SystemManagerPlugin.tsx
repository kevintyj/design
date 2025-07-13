import { type ColorSystem as CoreColorSystem, generateColorSystem } from "@kevintyj/design-color-core";
import { convertColorToJSON, generateCollectionsJSON } from "@kevintyj/design-color-json";

import { type SpacingSystem as CoreSpacingSystem, generateSpacingSystem } from "@kevintyj/design-spacing-core";
import { generateSpacingCSSFiles } from "@kevintyj/design-spacing-css";
import { generateSpacingJSONFiles } from "@kevintyj/design-spacing-json";

import { useCallback, useEffect, useState } from "react";
import { useFileHandling } from "../hooks/useFileHandling";
import { usePluginMessaging } from "../hooks/usePluginMessaging";
import type { ColorSystem, SpacingSystem, Tab, UserPreferences } from "../types";
import { downloadFile, downloadGeneratedColorScalesZip } from "../utils/download";
import { ColorConfigureTab } from "./ColorConfigureTab";
import { ExportTab } from "./ExportTab";
import { PreferencesTab } from "./PreferencesTab";
import { SpacingConfigureTab } from "./SpacingConfigureTab";
import { StatusMessage } from "./StatusMessage";
import { VariablesTab } from "./VariablesTab";

const CLIENT_STORAGE_KEY = "figma-color-system";
const _SPACING_STORAGE_KEY = "figma-spacing-system";
const PREFERENCES_KEY = "figma-preferences";

const tabButton = (label: string, onClick: () => void, active?: boolean) => (
	<button
		type="button"
		onClick={onClick}
		className={`flex items-center h-8 text-sm font-medium border-b-0 transition-all duration-80 cursor-pointer ${
			active ? "text-gray-12 border-b-2 border-blaze-11" : "text-gray-10 hover:text-gray-11 border-transparent"
		}`}
	>
		<span className="text-xs px-3 py-1 hover:pb-2 rounded transition-all duration-80">{label}</span>
	</button>
);

const returnGeneratedColorSystem = async (colorSystem: ColorSystem): Promise<CoreColorSystem> => {
	const colorInput = {
		light: colorSystem.light,
		dark: colorSystem.dark,
		constants: {
			light: colorSystem.constants.light,
			dark: colorSystem.constants.dark,
		},
	};

	// Generate the complete color system with scales
	const generatedColorSystem = generateColorSystem(colorInput);
	console.log("Generated Color System:", generatedColorSystem);

	// You can also log specific scales
	console.log("Available colors:", generatedColorSystem.colorNames);

	// Example: Get a specific color scale
	generatedColorSystem.colorNames.forEach((colorName: string) => {
		const lightScale = generatedColorSystem.light[colorName];
		const darkScale = generatedColorSystem.dark[colorName];

		console.log(`${colorName} light scale:`, lightScale);
		console.log(`${colorName} dark scale:`, darkScale);
	});

	return generatedColorSystem;
};

const returnGeneratedSpacingSystem = async (spacingSystem: SpacingSystem): Promise<CoreSpacingSystem> => {
	const spacingInput = {
		spacing: spacingSystem.spacing,
		multiplier: spacingSystem.multiplier,
	};

	// Generate the complete spacing system with scales
	const generatedSpacingSystem = generateSpacingSystem(spacingInput, {
		includeRem: true,
		includePx: true,
		remBase: spacingSystem.remValue ?? 16,
	});
	console.log("Generated Spacing System:", generatedSpacingSystem);

	// You can also log specific scales
	console.log("Available spacing:", generatedSpacingSystem.spacing);

	// Example: Get a specific spacing scale
	Object.entries(generatedSpacingSystem.spacing.values).forEach(([key, value]) => {
		console.log(`${key}: ${value}`);
	});

	return generatedSpacingSystem;
};

// Helper function to convert SimpleCollectionFormat to raw Figma format (moved from useFileHandling for reuse)
function _convertSimpleCollectionToRawFormat(data: any): any {
	const collection = data.collections;
	const collectionId = `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	// Create modes from the collection modes
	const modes = collection.modes.map((mode: string, index: number) => ({
		modeId: `mode-${index}`,
		name: mode.toLowerCase(),
	}));

	const rawFormat: {
		collections: any[];
		variables: any[];
	} = {
		collections: [
			{
				id: collectionId,
				name: collection.name,
				modes: modes,
			},
		],
		variables: [],
	};

	// Helper function to add variables from a variable group
	const addVariables = (variables: any, prefix: string = "") => {
		Object.entries(variables).forEach(([key, value]: [string, any]) => {
			if (value && typeof value === "object") {
				// Check if this is a variable definition (has type and values)
				if (value.type && value.values) {
					const variableName = prefix ? `${prefix}/${key}` : key;
					const variableId = `${variableName.replace(/[/\s]/g, "-")}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

					// Create valuesByMode from the values object
					const valuesByMode: any = {};
					modes.forEach((mode: { modeId: string; name: string }) => {
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
				} else {
					// Recursively process nested objects
					const newPrefix = prefix ? `${prefix}/${key}` : key;
					addVariables(value, newPrefix);
				}
			}
		});
	};

	// Process solid variables
	if (collection.variables.solid) {
		addVariables(collection.variables.solid, "solid");
	}

	// Process alpha variables
	if (collection.variables.alpha) {
		addVariables(collection.variables.alpha, "alpha");
	}

	// Process overlay variables
	if (collection.variables.overlays) {
		addVariables(collection.variables.overlays, "overlays");
	}

	return rawFormat;
}

export const SystemManagerPlugin: React.FC = () => {
	const [activeTab, setActiveTab] = useState<Tab>("color");
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string>("");
	const [messageKey, setMessageKey] = useState(0);

	// Color System
	const [colorSystem, setColorSystem] = useState<ColorSystem | null>(null);
	const [generatedColorSystem, setGeneratedColorSystem] = useState<CoreColorSystem | null>(null);

	// Spacing System
	const [spacingSystem, setSpacingSystem] = useState<SpacingSystem | null>(null);
	const [generatedSpacingSystem, setGeneratedSpacingSystem] = useState<CoreSpacingSystem | null>(null);

	// Preferences
	const [preferences, setPreferences] = useState<UserPreferences>({
		saveColorSystem: false,
		autoGenerateOnLoad: false,
		saveSpacingSystem: false,
		autoGenerateSpacingOnLoad: false,
	});
	const [parsedVariables, setParsedVariables] = useState<any>(null);

	// Wrapper function that increments messageKey every time a message is set
	const setMessageWithKey = useCallback((newMessage: string) => {
		setMessageKey((prev) => prev + 1);
		setMessage(newMessage);
	}, []);

	// Add client storage loaded handler
	const handleClientStorageLoaded = useCallback(
		async (data: {
			preferences: UserPreferences | null;
			colorSystem: ColorSystem | null;
			spacingSystem: SpacingSystem | null;
		}) => {
			console.log("Handling client storage loaded:", data);
			if (data.preferences) {
				setPreferences(data.preferences);
			}
			if (data.colorSystem && data.preferences?.saveColorSystem) {
				setColorSystem(data.colorSystem);
				setMessageWithKey("Color system loaded from Figma storage");

				// Auto-generate color scales if preference is enabled
				if (data.preferences?.autoGenerateOnLoad) {
					setIsLoading(true);
					try {
						const generatedColorSystem = await returnGeneratedColorSystem(data.colorSystem);
						setGeneratedColorSystem(generatedColorSystem);
						setMessageWithKey("Color system loaded and scales auto-generated from Figma storage");
					} catch (error) {
						setMessageWithKey(`Error auto-generating color scales: ${error}`);
					} finally {
						setIsLoading(false);
					}
				}
			}
			if (data.spacingSystem && data.preferences?.saveSpacingSystem) {
				setSpacingSystem(data.spacingSystem);
				setMessageWithKey("Spacing system loaded from Figma storage");

				// Auto-generate spacing scales if preference is enabled
				if (data.preferences?.autoGenerateSpacingOnLoad) {
					setIsLoading(true);
					try {
						const generatedSpacingSystem = await returnGeneratedSpacingSystem(data.spacingSystem);
						setGeneratedSpacingSystem(generatedSpacingSystem);
						setMessageWithKey("Spacing system loaded and scales auto-generated from Figma storage");
					} catch (error) {
						setMessageWithKey(`Error auto-generating spacing scales: ${error}`);
					} finally {
						setIsLoading(false);
					}
				}
			}
		},
		[setMessageWithKey],
	);

	const { sendPluginMessage } = usePluginMessaging({
		setIsLoading,
		setMessage: setMessageWithKey,
		colorSystem,
		onClientStorageLoaded: handleClientStorageLoaded,
	});

	// Load saved preferences and data from figma.clientStorage on component mount
	useEffect(() => {
		console.log("Sending load-client-storage message with keys:", {
			preferencesKey: PREFERENCES_KEY,
			colorSystemKey: CLIENT_STORAGE_KEY,
			spacingSystemKey: _SPACING_STORAGE_KEY,
		});

		sendPluginMessage("load-client-storage", {
			preferencesKey: PREFERENCES_KEY,
			colorSystemKey: CLIENT_STORAGE_KEY,
			spacingSystemKey: _SPACING_STORAGE_KEY,
		});
	}, [sendPluginMessage]);

	// Save color system to figma.clientStorage when it changes and save is enabled
	useEffect(() => {
		if (preferences.saveColorSystem && colorSystem) {
			sendPluginMessage("save-color-system", {
				key: CLIENT_STORAGE_KEY,
				colorSystem: colorSystem,
			});
			setMessageWithKey("Color system saved to Figma storage");
		}
	}, [colorSystem, preferences.saveColorSystem, setMessageWithKey, sendPluginMessage]);

	// Save spacing system to figma.clientStorage when it changes and save is enabled
	useEffect(() => {
		if (preferences.saveSpacingSystem && spacingSystem) {
			sendPluginMessage("save-spacing-system", {
				key: _SPACING_STORAGE_KEY,
				spacingSystem: spacingSystem,
			});
			setMessageWithKey("Spacing system saved to Figma storage");
		}
	}, [spacingSystem, preferences.saveSpacingSystem, setMessageWithKey, sendPluginMessage]);

	// Save preferences to figma.clientStorage when they change
	useEffect(() => {
		sendPluginMessage("save-preferences", {
			key: PREFERENCES_KEY,
			preferences: preferences,
		});
	}, [preferences, sendPluginMessage]);

	// Handle preference changes
	const handlePreferenceChange = useCallback(
		(key: keyof UserPreferences, enabled: boolean) => {
			setPreferences((prev) => ({ ...prev, [key]: enabled }));

			if (key === "saveColorSystem") {
				if (enabled && colorSystem) {
					// Immediately save the current color system when checkbox is checked
					sendPluginMessage("save-color-system", {
						key: CLIENT_STORAGE_KEY,
						colorSystem: colorSystem,
					});
					setMessageWithKey("Color system saved to Figma storage");
				} else if (!enabled) {
					// Clear saved color system when disabled
					sendPluginMessage("remove-color-system", {
						key: CLIENT_STORAGE_KEY,
					});
					setMessageWithKey("Color system removed from Figma storage");
				}
			}

			if (key === "saveSpacingSystem") {
				if (enabled && spacingSystem) {
					// Immediately save the current spacing system when checkbox is checked
					sendPluginMessage("save-spacing-system", {
						key: _SPACING_STORAGE_KEY,
						spacingSystem: spacingSystem,
					});
					setMessageWithKey("Spacing system saved to Figma storage");
				} else if (!enabled) {
					// Clear saved spacing system when disabled
					sendPluginMessage("remove-spacing-system", {
						key: _SPACING_STORAGE_KEY,
					});
					setMessageWithKey("Spacing system removed from Figma storage");
				}
			}
		},
		[setMessageWithKey, sendPluginMessage, colorSystem, spacingSystem],
	);

	const {
		handleFileUpload,
		handleColorFileUpload,
		handleSpacingFileUpload,
		handleFigmaVariablesUpload,
		handleImportToFigma,
		handleImportFromGeneratedColors,
		handleImportFromGeneratedSpacing,
	} = useFileHandling({
		setColorSystem,
		setSpacingSystem,
		setIsLoading,
		setMessage: setMessageWithKey,
		sendPluginMessage,
		setParsedVariables,
	});

	// Create a handler that passes the generated color system
	const handleImportFromGeneratedColorsWithSystem = useCallback(() => {
		if (!generatedColorSystem) {
			setMessageWithKey("No generated color system available to import.");
			return;
		}
		handleImportFromGeneratedColors(generatedColorSystem);
	}, [generatedColorSystem, handleImportFromGeneratedColors, setMessageWithKey]);

	// Create a handler that passes the generated spacing system
	const _handleImportFromGeneratedSpacingWithSystem = useCallback(() => {
		if (!generatedSpacingSystem) {
			setMessageWithKey("No generated spacing system available to import.");
			return;
		}
		handleImportFromGeneratedSpacing(generatedSpacingSystem);
	}, [generatedSpacingSystem, handleImportFromGeneratedSpacing, setMessageWithKey]);

	// Handle export as CSS
	const handleExportCSS = useCallback(() => {
		if (!colorSystem) {
			setMessageWithKey("Please load a color system first.");
			return;
		}

		sendPluginMessage("export-css", colorSystem);
	}, [colorSystem, sendPluginMessage, setMessageWithKey]);

	// Handle export as JSON
	const handleExportJSON = useCallback(() => {
		if (!colorSystem) {
			setMessageWithKey("Please load a color system first.");
			return;
		}

		sendPluginMessage("export-json", colorSystem);
	}, [colorSystem, sendPluginMessage, setMessageWithKey]);

	// Handle Figma variables export
	const _handleExportFigmaVariables = useCallback(() => {
		setIsLoading(true);
		sendPluginMessage("export-figma-variables");
	}, [sendPluginMessage]);

	// Handle Figma variables export as collections format
	const handleExportFigmaVariablesAsCollections = useCallback(() => {
		setIsLoading(true);
		sendPluginMessage("export-figma-variables-collections");
	}, [sendPluginMessage]);

	// Handle Figma variables export as raw format
	const handleExportFigmaVariablesRaw = useCallback(() => {
		setIsLoading(true);
		sendPluginMessage("export-figma-variables-raw");
	}, [sendPluginMessage]);

	const handleGenerateColorSystem = useCallback(async () => {
		setIsLoading(true);
		if (!colorSystem) {
			setMessageWithKey("Please load a color system first.");
			return;
		}
		const generatedColorSystem = await returnGeneratedColorSystem(colorSystem);
		setGeneratedColorSystem(generatedColorSystem);
		sendPluginMessage("color-system-generated");
		setIsLoading(false);
	}, [colorSystem, setMessageWithKey, sendPluginMessage]);

	const handleGenerateSpacingSystem = useCallback(async () => {
		setIsLoading(true);
		if (!spacingSystem) {
			setMessageWithKey("Please load a spacing system first.");
			return;
		}
		const generatedSpacingSystem = await returnGeneratedSpacingSystem(spacingSystem);
		setGeneratedSpacingSystem(generatedSpacingSystem);
		sendPluginMessage("spacing-system-generated");
		setIsLoading(false);
	}, [spacingSystem, setMessageWithKey, sendPluginMessage]);

	// Add reset handler
	const handleResetColorSystem = useCallback(() => {
		setColorSystem(null);
		setGeneratedColorSystem(null);

		// Also clear from Figma storage if save is enabled
		if (preferences.saveColorSystem) {
			sendPluginMessage("remove-color-system", {
				key: CLIENT_STORAGE_KEY,
			});
			setMessageWithKey("Color system reset and removed from Figma storage");
		} else {
			setMessageWithKey("Color system reset");
		}
	}, [setMessageWithKey, preferences.saveColorSystem, sendPluginMessage]);

	const handleResetSpacingSystem = useCallback(() => {
		setSpacingSystem(null);
		setGeneratedSpacingSystem(null);

		// Also clear from Figma storage if save is enabled
		if (preferences.saveSpacingSystem) {
			sendPluginMessage("remove-spacing-system", {
				key: _SPACING_STORAGE_KEY,
			});
			setMessageWithKey("Spacing system reset and removed from Figma storage");
		} else {
			setMessageWithKey("Spacing system reset");
		}
	}, [setMessageWithKey, preferences.saveSpacingSystem, sendPluginMessage]);

	// Handle export generated color scales as CSS
	const handleExportGeneratedCSS = useCallback(async () => {
		if (!generatedColorSystem) {
			setMessageWithKey("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			const message = await downloadGeneratedColorScalesZip(generatedColorSystem, "css");
			setMessageWithKey(message);
		} catch (error) {
			setMessageWithKey(`Error exporting generated CSS: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem, setMessageWithKey]);

	// Handle export generated color scales as JSON
	const handleExportGeneratedJSON = useCallback(async () => {
		if (!generatedColorSystem) {
			setMessageWithKey("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			const message = await downloadGeneratedColorScalesZip(generatedColorSystem, "json");
			setMessageWithKey(message);
		} catch (error) {
			setMessageWithKey(`Error exporting generated JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem, setMessageWithKey]);

	// Handle export generated color scales as Tailwind JSON
	const handleExportTailwindJSON = useCallback(async () => {
		if (!generatedColorSystem) {
			setMessageWithKey("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			const tailwindConfig = convertColorToJSON(generatedColorSystem, "tailwind", undefined, { prettyPrint: true });
			const jsonContent = JSON.stringify(tailwindConfig, null, 2);

			downloadFile(jsonContent, "tailwind-colors.json", "application/json");
			setMessageWithKey("Tailwind JSON export completed successfully!");
		} catch (error) {
			setMessageWithKey(`Error exporting Tailwind JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem, setMessageWithKey]);

	// Handle export generated color scales as Collections JSON
	const handleExportCollectionsJSON = useCallback(async () => {
		if (!generatedColorSystem) {
			setMessageWithKey("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			// Debug logging to understand the data structure
			console.log("Generated Color System for Collections Export:", generatedColorSystem);
			console.log("Color Names:", generatedColorSystem.colorNames);
			console.log("Light Colors Keys:", Object.keys(generatedColorSystem.light));
			console.log("Dark Colors Keys:", Object.keys(generatedColorSystem.dark));

			// Log first few colors to check data integrity
			generatedColorSystem.colorNames.forEach((colorName: string, index: number) => {
				if (index < 5) {
					// Log first 5 colors
					console.log(`Color ${colorName}:`, {
						light: generatedColorSystem.light[colorName] ? "exists" : "missing",
						dark: generatedColorSystem.dark[colorName] ? "exists" : "missing",
						lightAccentScale: generatedColorSystem.light[colorName]?.accentScale?.length || 0,
						darkAccentScale: generatedColorSystem.dark[colorName]?.accentScale?.length || 0,
					});
				}
			});

			const collectionsConfig = generateCollectionsJSON(generatedColorSystem, {
				collectionName: "Generated Colors",
				includeAlpha: true,
				includeGrayScale: true,
				includeOverlays: true,
				prettyPrint: true,
			});

			// Debug the output
			console.log("Collections Config Output:", collectionsConfig);
			console.log("Solid Colors Keys:", Object.keys(collectionsConfig.collections[0].variables.solid));

			const jsonContent = JSON.stringify(collectionsConfig, null, 2);

			downloadFile(jsonContent, "collections.json", "application/json");
			setMessageWithKey("Collections JSON export completed successfully!");
		} catch (error) {
			console.error("Collections export error:", error);
			setMessageWithKey(`Error exporting Collections JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem, setMessageWithKey]);

	// Handle export original spacing system as CSS
	const handleExportSpacingCSS = useCallback(() => {
		if (!spacingSystem) {
			setMessageWithKey("Please load a spacing system first.");
			return;
		}

		sendPluginMessage("export-spacing-css", spacingSystem);
	}, [spacingSystem, sendPluginMessage, setMessageWithKey]);

	// Handle export original spacing system as JSON
	const handleExportSpacingJSON = useCallback(() => {
		if (!spacingSystem) {
			setMessageWithKey("Please load a spacing system first.");
			return;
		}

		sendPluginMessage("export-spacing-json", spacingSystem);
	}, [spacingSystem, sendPluginMessage, setMessageWithKey]);

	// Handle export generated spacing utilities as CSS
	const handleExportGeneratedSpacingCSS = useCallback(async () => {
		if (!generatedSpacingSystem) {
			setMessageWithKey("Please generate spacing utilities first.");
			return;
		}

		setIsLoading(true);
		try {
			const cssFiles = generateSpacingCSSFiles(generatedSpacingSystem, {
				variant: "full",
				includeRem: true,
			});

			// Create a ZIP file with all CSS variants
			const JSZip = (await import("jszip")).default;
			const zip = new JSZip();

			cssFiles.forEach((file) => {
				zip.file(file.name, file.content);
			});

			// Add README
			const readme = `# Generated Spacing Utilities CSS Export

This export contains your generated spacing utilities as CSS files.

## Files Included

${cssFiles.map((file) => `- ${file.name} - Spacing utilities`).join("\n")}

## Usage

Include the CSS files in your project:

\`\`\`html
<link rel="stylesheet" href="spacing-combined.css">
\`\`\`

## Generated At

${new Date().toISOString()}
`;

			zip.file("README.md", readme);

			const blob = await zip.generateAsync({ type: "blob" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "spacing-utilities-css.zip";
			a.click();
			URL.revokeObjectURL(url);

			setMessageWithKey("Spacing utilities CSS export completed successfully!");
		} catch (error) {
			setMessageWithKey(`Error exporting spacing utilities CSS: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem, setMessageWithKey]);

	// Handle export generated spacing utilities as JSON
	const handleExportGeneratedSpacingJSON = useCallback(async () => {
		if (!generatedSpacingSystem) {
			setMessageWithKey("Please generate spacing utilities first.");
			return;
		}

		setIsLoading(true);
		try {
			const jsonFiles = generateSpacingJSONFiles(generatedSpacingSystem, {
				format: "all",
				prettyPrint: true,
				includeMetadata: true,
			});

			// Create a ZIP file with all JSON formats
			const JSZip = (await import("jszip")).default;
			const zip = new JSZip();

			jsonFiles.forEach((file) => {
				zip.file(file.name, file.content);
			});

			// Add metadata
			const metadata = {
				generatedAt: new Date().toISOString(),
				totalSpacingValues: Object.keys(generatedSpacingSystem.spacing.values).length,
				multiplier: generatedSpacingSystem.spacing.multiplier,
				remBase: 16, // Default rem base
				formats: ["flat", "nested", "tokens", "tailwind", "collections"],
			};
			zip.file("metadata.json", JSON.stringify(metadata, null, 2));

			const blob = await zip.generateAsync({ type: "blob" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "spacing-utilities-json.zip";
			a.click();
			URL.revokeObjectURL(url);

			setMessageWithKey("Spacing utilities JSON export completed successfully!");
		} catch (error) {
			setMessageWithKey(`Error exporting spacing utilities JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem, setMessageWithKey]);

	// Handle export generated spacing utilities as Tailwind JSON
	const handleExportSpacingTailwindJSON = useCallback(async () => {
		if (!generatedSpacingSystem) {
			setMessageWithKey("Please generate spacing utilities first.");
			return;
		}

		setIsLoading(true);
		try {
			const jsonFiles = generateSpacingJSONFiles(generatedSpacingSystem, {
				format: "tailwind",
				prettyPrint: true,
				includeRem: false, // Tailwind typically uses px values
			});

			const tailwindFile = jsonFiles.find((file) => file.name.includes("tailwind"));
			if (!tailwindFile) {
				throw new Error("Tailwind format not generated");
			}

			downloadFile(tailwindFile.content, "tailwind-spacing.json", "application/json");
			setMessageWithKey("Tailwind spacing JSON export completed successfully!");
		} catch (error) {
			setMessageWithKey(`Error exporting Tailwind spacing JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem, setMessageWithKey]);

	// Handle export generated spacing utilities as Collections JSON
	const handleExportSpacingCollectionsJSON = useCallback(async () => {
		if (!generatedSpacingSystem) {
			setMessageWithKey("Please generate spacing utilities first.");
			return;
		}

		setIsLoading(true);
		try {
			const jsonFiles = generateSpacingJSONFiles(generatedSpacingSystem, {
				format: "collections",
				prettyPrint: true,
			});

			const collectionsFile = jsonFiles.find((file) => file.name.includes("collections"));
			if (!collectionsFile) {
				throw new Error("Collections format not generated");
			}

			downloadFile(collectionsFile.content, "spacing-collections.json", "application/json");
			setMessageWithKey("Spacing collections JSON export completed successfully!");
		} catch (error) {
			setMessageWithKey(`Error exporting spacing collections JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem, setMessageWithKey]);

	const handleConfirmImport = useCallback(() => {
		handleImportToFigma(parsedVariables);
		setParsedVariables(null); // Clear after import
	}, [handleImportToFigma, parsedVariables]);

	const renderTabContent = () => {
		switch (activeTab) {
			case "color":
				return (
					<ColorConfigureTab
						colorSystem={colorSystem}
						generatedColorSystem={generatedColorSystem}
						isLoading={isLoading}
						onFileUpload={handleFileUpload}
						onGenerateColorSystem={handleGenerateColorSystem}
						onResetColorSystem={handleResetColorSystem}
					/>
				);
			case "spacing":
				return (
					<SpacingConfigureTab
						spacingSystem={spacingSystem}
						generatedSpacingSystem={generatedSpacingSystem}
						isLoading={isLoading}
						onFileUpload={handleSpacingFileUpload}
						onGenerateSpacingSystem={handleGenerateSpacingSystem}
						onResetSpacingSystem={handleResetSpacingSystem}
					/>
				);
			case "export":
				return (
					<ExportTab
						colorSystem={colorSystem}
						spacingSystem={spacingSystem}
						generatedColorSystem={generatedColorSystem}
						generatedSpacingSystem={generatedSpacingSystem}
						isLoading={isLoading}
						onExportCSS={handleExportCSS}
						onExportJSON={handleExportJSON}
						onExportGeneratedCSS={handleExportGeneratedCSS}
						onExportGeneratedJSON={handleExportGeneratedJSON}
						onExportTailwindJSON={handleExportTailwindJSON}
						onExportCollectionsJSON={handleExportCollectionsJSON}
						onExportSpacingCSS={handleExportSpacingCSS}
						onExportSpacingJSON={handleExportSpacingJSON}
						onExportGeneratedSpacingCSS={handleExportGeneratedSpacingCSS}
						onExportGeneratedSpacingJSON={handleExportGeneratedSpacingJSON}
						onExportSpacingTailwindJSON={handleExportSpacingTailwindJSON}
						onExportSpacingCollectionsJSON={handleExportSpacingCollectionsJSON}
					/>
				);
			case "variables":
				return (
					<VariablesTab
						isLoading={isLoading}
						onExportVariablesAsCollections={handleExportFigmaVariablesAsCollections}
						onExportVariablesRaw={handleExportFigmaVariablesRaw}
						onImportVariables={handleFigmaVariablesUpload}
						parsedVariables={parsedVariables}
						onConfirmImport={handleConfirmImport}
						generatedColorSystem={generatedColorSystem}
						onImportFromGeneratedColors={handleImportFromGeneratedColorsWithSystem}
						generatedSpacingSystem={generatedSpacingSystem}
						onImportFromGeneratedSpacing={_handleImportFromGeneratedSpacingWithSystem}
					/>
				);
			case "preferences":
				return <PreferencesTab preferences={preferences} onPreferenceChange={handlePreferenceChange} />;
			default:
				return null;
		}
	};

	return (
		<div className="w-full h-full bg-white">
			{/* Header */}
			<div className="fixed top-0 left-0 right-0 px-5 pt-2 border-b border-gray-7 bg-gray-2 z-50">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-lg font-serif font-medium text-gray-12">Design System Manager</h1>
						<a
							href="https://github.com/kevintyj/design"
							className="text-xs text-blaze-11 hover:underline decoration-blaze-7"
							target="_blank"
							rel="noopener noreferrer"
						>
							View documentation
						</a>
					</div>
					<div className="flex flex-col items-end gap-y-1 pt-1">
						<span className="text-xs text-gray-11">Loaded configurations</span>
						<div className="flex gap-x-2">
							{!colorSystem && !generatedColorSystem && !spacingSystem && !generatedSpacingSystem && (
								<span className="bg-red-3 border border-red-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-red-11">
									None
								</span>
							)}
							{colorSystem && (
								<span className="bg-green-3 border border-green-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-green-11">
									Color system
								</span>
							)}
							{generatedColorSystem && (
								<span className="bg-green-3 border border-green-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-green-11">
									Color scales
								</span>
							)}
							{spacingSystem && (
								<span className="bg-blue-3 border border-blue-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-blue-11">
									Spacing system
								</span>
							)}
							{generatedSpacingSystem && (
								<span className="bg-blue-3 border border-blue-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-blue-11">
									Spacing scales
								</span>
							)}
						</div>
					</div>
				</div>

				<nav className="flex gap-x-2 pt-2">
					{tabButton("Color", () => setActiveTab("color"), activeTab === "color")}
					{tabButton("Spacing", () => setActiveTab("spacing"), activeTab === "spacing")}
					{tabButton("Export", () => setActiveTab("export"), activeTab === "export")}
					{tabButton("Variables", () => setActiveTab("variables"), activeTab === "variables")}
					{tabButton("Preferences", () => setActiveTab("preferences"), activeTab === "preferences")}
				</nav>
			</div>

			{/* Content */}
			<div className="pb-8 pt-24">
				{renderTabContent()}
				<div className="px-5 py-6 mt-auto">
					<div className="flex items-center gap-x-2 py-2">
						<img
							src="https://raw.githubusercontent.com/kevintyj/design/refs/heads/main/assets/icon.svg"
							alt="Logo"
							className="w-6 h-6"
						/>
						<h3 className="font-serif text-gray-12">@kevintyj/design</h3>
					</div>
					<span className="text-xs font-mono text-gray-11">
						By{" "}
						<a
							href="https://kevintyj.com"
							className="text-blaze-11 hover:underline decoration-blaze-7"
							target="_blank"
							rel="noopener noreferrer"
						>
							Kevin Taeyoon Jin
						</a>{" "}
						❤️‍🔥
					</span>
				</div>
				<div className="fixed bottom-0 left-0 right-0 px-5 py-4">
					<StatusMessage message={message} messageKey={messageKey} />
				</div>
			</div>
		</div>
	);
};
