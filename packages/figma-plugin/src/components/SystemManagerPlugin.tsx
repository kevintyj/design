import { type ColorSystem as CoreColorSystem, generateColorSystem } from "@kevintyj/design-color-core";
import { convertColorToJSON, generateCollectionsJSON } from "@kevintyj/design-color-json";
import { type SpacingSystem as CoreSpacingSystem, generateSpacingSystem } from "@kevintyj/design-spacing-core";
import { generateSpacingCSSFiles } from "@kevintyj/design-spacing-css";
import { generateSpacingJSONFiles } from "@kevintyj/design-spacing-json";

import { useCallback, useEffect, useState } from "react";
import { useFileHandling } from "../hooks/useFileHandling";
import { usePluginMessaging } from "../hooks/usePluginMessaging";
import { toast } from "../hooks/useToast";
import type { ColorSystem, SpacingSystem, Tab, UserPreferences } from "../types";
import { STORAGE_KEYS } from "../utils/constants";
import { downloadFile, downloadGeneratedColorScalesZip } from "../utils/download";
import { Badge } from "./Badge";
import { ColorConfigureTab } from "./ColorConfigureTab";
import { ExportTab } from "./ExportTab";
import { PreferencesTab } from "./PreferencesTab";
import { Resizer } from "./Resizer";
import { SpacingConfigureTab } from "./SpacingConfigureTab";
import { VariablesTab } from "./VariablesTab";

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

export const SystemManagerPlugin: React.FC = () => {
	const [activeTab, setActiveTab] = useState<Tab>("color");
	const [isLoading, setIsLoading] = useState(false);

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
				toast.success("Color system loaded from Figma storage");

				// Auto-generate color scales if preference is enabled
				if (data.preferences?.autoGenerateOnLoad) {
					setIsLoading(true);
					try {
						const generatedColorSystem = await returnGeneratedColorSystem(data.colorSystem);
						setGeneratedColorSystem(generatedColorSystem);
						toast.success("Color system loaded and scales auto-generated from Figma storage");
					} catch (error) {
						toast.error(`Error auto-generating color scales: ${error}`);
					} finally {
						setIsLoading(false);
					}
				}
			}
			if (data.spacingSystem && data.preferences?.saveSpacingSystem) {
				setSpacingSystem(data.spacingSystem);
				toast.success("Spacing system loaded from Figma storage");

				// Auto-generate spacing scales if preference is enabled
				if (data.preferences?.autoGenerateSpacingOnLoad) {
					setIsLoading(true);
					try {
						const generatedSpacingSystem = await returnGeneratedSpacingSystem(data.spacingSystem);
						setGeneratedSpacingSystem(generatedSpacingSystem);
						toast.success("Spacing system loaded and scales auto-generated from Figma storage");
					} catch (error) {
						toast.error(`Error auto-generating spacing scales: ${error}`);
					} finally {
						setIsLoading(false);
					}
				}
			}
		},
		[],
	);

	const { sendPluginMessage } = usePluginMessaging({
		setIsLoading,
		colorSystem,
		onClientStorageLoaded: handleClientStorageLoaded,
	});

	// Load saved preferences and data from figma.clientStorage on component mount
	useEffect(() => {
		console.log("Sending load-client-storage message with keys:", {
			preferencesKey: STORAGE_KEYS.PREFERENCES,
			colorSystemKey: STORAGE_KEYS.CLIENT_STORAGE,
			spacingSystemKey: STORAGE_KEYS.SPACING_STORAGE,
		});

		sendPluginMessage("load-client-storage", {
			preferencesKey: STORAGE_KEYS.PREFERENCES,
			colorSystemKey: STORAGE_KEYS.CLIENT_STORAGE,
			spacingSystemKey: STORAGE_KEYS.SPACING_STORAGE,
		});
	}, [sendPluginMessage]);

	// Save color system to figma.clientStorage when it changes and save is enabled
	useEffect(() => {
		if (preferences.saveColorSystem && colorSystem) {
			sendPluginMessage("save-color-system", {
				key: STORAGE_KEYS.CLIENT_STORAGE,
				colorSystem: colorSystem,
			});
			toast.success("Color system saved to Figma storage");
		}
	}, [colorSystem, preferences.saveColorSystem, sendPluginMessage]);

	// Save spacing system to figma.clientStorage when it changes and save is enabled
	useEffect(() => {
		if (preferences.saveSpacingSystem && spacingSystem) {
			sendPluginMessage("save-spacing-system", {
				key: STORAGE_KEYS.SPACING_STORAGE,
				spacingSystem: spacingSystem,
			});
			toast.success("Spacing system saved to Figma storage");
		}
	}, [spacingSystem, preferences.saveSpacingSystem, sendPluginMessage]);

	// Save preferences to figma.clientStorage when they change
	useEffect(() => {
		sendPluginMessage("save-preferences", {
			key: STORAGE_KEYS.PREFERENCES,
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
						key: STORAGE_KEYS.CLIENT_STORAGE,
						colorSystem: colorSystem,
					});
					toast.success("Color system saved to Figma storage");
				} else if (!enabled) {
					// Clear saved color system when disabled
					sendPluginMessage("remove-color-system", {
						key: STORAGE_KEYS.CLIENT_STORAGE,
					});
					toast.success("Color system removed from Figma storage");
				}
			}

			if (key === "saveSpacingSystem") {
				if (enabled && spacingSystem) {
					// Immediately save the current spacing system when checkbox is checked
					sendPluginMessage("save-spacing-system", {
						key: STORAGE_KEYS.SPACING_STORAGE,
						spacingSystem: spacingSystem,
					});
					toast.success("Spacing system saved to Figma storage");
				} else if (!enabled) {
					// Clear saved spacing system when disabled
					sendPluginMessage("remove-spacing-system", {
						key: STORAGE_KEYS.SPACING_STORAGE,
					});
					toast.success("Spacing system removed from Figma storage");
				}
			}
		},
		[sendPluginMessage, colorSystem, spacingSystem],
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
		sendPluginMessage,
		setParsedVariables,
	});

	// Create a handler that passes the generated color system
	const handleImportFromGeneratedColorsWithSystem = useCallback(() => {
		if (!generatedColorSystem) {
			toast.error("No generated color system available to import.");
			return;
		}
		handleImportFromGeneratedColors(generatedColorSystem);
	}, [generatedColorSystem, handleImportFromGeneratedColors]);

	// Create a handler that passes the generated spacing system
	const _handleImportFromGeneratedSpacingWithSystem = useCallback(() => {
		if (!generatedSpacingSystem) {
			toast.error("No generated spacing system available to import.");
			return;
		}
		handleImportFromGeneratedSpacing(generatedSpacingSystem);
	}, [generatedSpacingSystem, handleImportFromGeneratedSpacing]);

	// Handle export as CSS
	const handleExportCSS = useCallback(() => {
		if (!colorSystem) {
			toast.error("Please load a color system first.");
			return;
		}

		sendPluginMessage("export-css", colorSystem);
	}, [colorSystem, sendPluginMessage]);

	// Handle export as JSON
	const handleExportJSON = useCallback(() => {
		if (!colorSystem) {
			toast.error("Please load a color system first.");
			return;
		}

		sendPluginMessage("export-json", colorSystem);
	}, [colorSystem, sendPluginMessage]);

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
			toast.error("Please load a color system first.");
			return;
		}
		const generatedColorSystem = await returnGeneratedColorSystem(colorSystem);
		setGeneratedColorSystem(generatedColorSystem);
		sendPluginMessage("color-system-generated");
		setIsLoading(false);
	}, [colorSystem, sendPluginMessage]);

	const handleGenerateSpacingSystem = useCallback(async () => {
		setIsLoading(true);
		if (!spacingSystem) {
			toast.error("Please load a spacing system first.");
			return;
		}
		const generatedSpacingSystem = await returnGeneratedSpacingSystem(spacingSystem);
		setGeneratedSpacingSystem(generatedSpacingSystem);
		sendPluginMessage("spacing-system-generated");
		setIsLoading(false);
	}, [spacingSystem, sendPluginMessage]);

	// Add reset handler
	const handleResetColorSystem = useCallback(() => {
		setColorSystem(null);
		setGeneratedColorSystem(null);

		// Also clear from Figma storage if save is enabled
		if (preferences.saveColorSystem) {
			sendPluginMessage("remove-color-system", {
				key: STORAGE_KEYS.CLIENT_STORAGE,
			});
			toast.success("Color system reset and removed from Figma storage");
		} else {
			toast.success("Color system reset");
		}
	}, [preferences.saveColorSystem, sendPluginMessage]);

	const handleResetSpacingSystem = useCallback(() => {
		setSpacingSystem(null);
		setGeneratedSpacingSystem(null);

		// Also clear from Figma storage if save is enabled
		if (preferences.saveSpacingSystem) {
			sendPluginMessage("remove-spacing-system", {
				key: STORAGE_KEYS.SPACING_STORAGE,
			});
			toast.success("Spacing system reset and removed from Figma storage");
		} else {
			toast.success("Spacing system reset");
		}
	}, [preferences.saveSpacingSystem, sendPluginMessage]);

	// Handle export generated color scales as CSS
	const handleExportGeneratedCSS = useCallback(async () => {
		if (!generatedColorSystem) {
			toast.error("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			const message = await downloadGeneratedColorScalesZip(generatedColorSystem, "css");
			toast.success(message);
		} catch (error) {
			toast.error(`Error exporting generated CSS: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem]);

	// Handle export generated color scales as JSON
	const handleExportGeneratedJSON = useCallback(async () => {
		if (!generatedColorSystem) {
			toast.error("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			const message = await downloadGeneratedColorScalesZip(generatedColorSystem, "json");
			toast.success(message);
		} catch (error) {
			toast.error(`Error exporting generated JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem]);

	// Handle export generated color scales as Tailwind JSON
	const handleExportTailwindJSON = useCallback(async () => {
		if (!generatedColorSystem) {
			toast.error("Please generate color scales first.");
			return;
		}

		setIsLoading(true);
		try {
			const tailwindConfig = convertColorToJSON(generatedColorSystem, "tailwind", undefined, { prettyPrint: true });
			const jsonContent = JSON.stringify(tailwindConfig, null, 2);

			downloadFile(jsonContent, "tailwind-colors.json", "application/json");
			toast.success("Tailwind JSON export completed successfully!");
		} catch (error) {
			toast.error(`Error exporting Tailwind JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem]);

	// Handle export generated color scales as Collections JSON
	const handleExportCollectionsJSON = useCallback(async () => {
		if (!generatedColorSystem) {
			toast.error("Please generate color scales first.");
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
			toast.success("Collections JSON export completed successfully!");
		} catch (error) {
			console.error("Collections export error:", error);
			toast.error(`Error exporting Collections JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedColorSystem]);

	// Handle export original spacing system as CSS
	const handleExportSpacingCSS = useCallback(() => {
		if (!spacingSystem) {
			toast.error("Please load a spacing system first.");
			return;
		}

		sendPluginMessage("export-spacing-css", spacingSystem);
	}, [spacingSystem, sendPluginMessage]);

	// Handle export original spacing system as JSON
	const handleExportSpacingJSON = useCallback(() => {
		if (!spacingSystem) {
			toast.error("Please load a spacing system first.");
			return;
		}

		sendPluginMessage("export-spacing-json", spacingSystem);
	}, [spacingSystem, sendPluginMessage]);

	// Handle export generated spacing utilities as CSS
	const handleExportGeneratedSpacingCSS = useCallback(async () => {
		if (!generatedSpacingSystem) {
			toast.error("Please generate spacing utilities first.");
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

			toast.success("Spacing utilities CSS export completed successfully!");
		} catch (error) {
			toast.error(`Error exporting spacing utilities CSS: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem]);

	// Handle export generated spacing utilities as JSON
	const handleExportGeneratedSpacingJSON = useCallback(async () => {
		if (!generatedSpacingSystem) {
			toast.error("Please generate spacing utilities first.");
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

			toast.success("Spacing utilities JSON export completed successfully!");
		} catch (error) {
			toast.error(`Error exporting spacing utilities JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem]);

	// Handle export generated spacing utilities as Tailwind JSON
	const handleExportSpacingTailwindJSON = useCallback(async () => {
		if (!generatedSpacingSystem) {
			toast.error("Please generate spacing utilities first.");
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
			toast.success("Tailwind spacing JSON export completed successfully!");
		} catch (error) {
			toast.error(`Error exporting Tailwind spacing JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem]);

	// Handle export generated spacing utilities as Collections JSON
	const handleExportSpacingCollectionsJSON = useCallback(async () => {
		if (!generatedSpacingSystem) {
			toast.error("Please generate spacing utilities first.");
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
			toast.success("Spacing collections JSON export completed successfully!");
		} catch (error) {
			toast.error(`Error exporting spacing collections JSON: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [generatedSpacingSystem]);

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
			{/* Sonner Toaster positioned at bottom center */}
			{/* <Toaster position="bottom-center" richColors /> */}

			{/* Header */}
			<div className="fixed top-0 left-0 right-0 px-5 pt-2 border-b border-gray-7 bg-gray-2 z-50 h-24 flex flex-col justify-between items-center">
				<div className="flex items-start justify-between w-full">
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
								<Badge variant="error">None</Badge>
							)}
							{colorSystem && <Badge variant="success">Color system</Badge>}
							{generatedColorSystem && <Badge variant="success">Color scales</Badge>}
							{spacingSystem && <Badge variant="info">Spacing system</Badge>}
							{generatedSpacingSystem && <Badge variant="info">Spacing scales</Badge>}
						</div>
					</div>
				</div>

				<nav className="flex gap-x-2 pt-2 w-full">
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
			</div>
			<Resizer />
		</div>
	);
};
