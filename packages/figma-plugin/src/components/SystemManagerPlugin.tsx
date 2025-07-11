import type { ColorSystem as ColorSystemCore } from "@design/color-generation-core";
import { generateColorSystem } from "@design/color-generation-core";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useFileHandling } from "../hooks/useFileHandling";
import { usePluginMessaging } from "../hooks/usePluginMessaging";
import type { ColorSystem, Tab, UserPreferences } from "../types";
import { downloadGeneratedColorScalesZip } from "../utils/download";
import { ConfigureTab } from "./ConfigureTab";
import { ExportTab } from "./ExportTab";
import { PreferencesTab } from "./PreferencesTab";
import { StatusMessage } from "./StatusMessage";
import { VariablesTab } from "./VariablesTab";

const CLIENT_STORAGE_KEY = "figma-color-system";
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

const returnGeneratedColorSystem = async (colorSystem: ColorSystem) => {
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
	generatedColorSystem.colorNames.forEach((colorName) => {
		const lightScale = generatedColorSystem.light[colorName];
		const darkScale = generatedColorSystem.dark[colorName];

		console.log(`${colorName} light scale:`, lightScale);
		console.log(`${colorName} dark scale:`, darkScale);
	});

	return generatedColorSystem;
};

export const SystemManagerPlugin: React.FC = () => {
	const [activeTab, setActiveTab] = useState<Tab>("configure");
	const [colorSystem, setColorSystem] = useState<ColorSystem | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string>("");
	const [messageKey, setMessageKey] = useState(0);
	const [generatedColorSystem, setGeneratedColorSystem] = useState<ColorSystemCore | null>(null);
	const [preferences, setPreferences] = useState<UserPreferences>({
		saveColorSystem: false,
		autoGenerateOnLoad: false,
	});

	// Wrapper function that increments messageKey every time a message is set
	const setMessageWithKey = useCallback((newMessage: string) => {
		setMessageKey((prev) => prev + 1);
		setMessage(newMessage);
	}, []);

	// Add client storage loaded handler
	const handleClientStorageLoaded = useCallback(
		async (data: { preferences: UserPreferences | null; colorSystem: ColorSystem | null }) => {
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
		});

		sendPluginMessage("load-client-storage", {
			preferencesKey: PREFERENCES_KEY,
			colorSystemKey: CLIENT_STORAGE_KEY,
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
		},
		[setMessageWithKey, sendPluginMessage, colorSystem],
	);

	const { handleFileUpload, handleFigmaVariablesUpload } = useFileHandling({
		setColorSystem,
		setIsLoading,
		setMessage: setMessageWithKey,
		sendPluginMessage,
	});

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
	const handleExportFigmaVariables = useCallback(() => {
		setIsLoading(true);
		sendPluginMessage("export-figma-variables");
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

	// Add reset handler
	const handleResetColorSystem = useCallback(() => {
		setColorSystem(null);
		setGeneratedColorSystem(null);
		setMessageWithKey("Color system reset");
	}, [setMessageWithKey]);

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

	const renderTabContent = () => {
		switch (activeTab) {
			case "configure":
				return (
					<ConfigureTab
						colorSystem={colorSystem}
						generatedColorSystem={generatedColorSystem}
						isLoading={isLoading}
						onFileUpload={handleFileUpload}
						onGenerateColorSystem={handleGenerateColorSystem}
						onResetColorSystem={handleResetColorSystem}
					/>
				);
			case "export":
				return (
					<ExportTab
						colorSystem={colorSystem}
						generatedColorSystem={generatedColorSystem}
						isLoading={isLoading}
						onExportCSS={handleExportCSS}
						onExportJSON={handleExportJSON}
						onExportGeneratedCSS={handleExportGeneratedCSS}
						onExportGeneratedJSON={handleExportGeneratedJSON}
					/>
				);
			case "variables":
				return (
					<VariablesTab
						isLoading={isLoading}
						onExportVariables={handleExportFigmaVariables}
						onImportVariables={handleFigmaVariablesUpload}
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
							{!colorSystem && !generatedColorSystem && (
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
						</div>
					</div>
				</div>

				<nav className="flex gap-x-2 pt-2">
					{tabButton("Configure", () => setActiveTab("configure"), activeTab === "configure")}
					{tabButton("Export", () => setActiveTab("export"), activeTab === "export")}
					{tabButton("Variables", () => setActiveTab("variables"), activeTab === "variables")}
					{tabButton("Preferences", () => setActiveTab("preferences"), activeTab === "preferences")}
				</nav>
			</div>

			{/* Content */}
			<div className="pb-8 pt-24">
				{renderTabContent()}
				<div className="px-5 py-6 mt-auto">
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
