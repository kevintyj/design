import type React from "react";
import { useCallback, useState } from "react";
import { useFileHandling } from "../hooks/useFileHandling";
import { usePluginMessaging } from "../hooks/usePluginMessaging";
import type { ColorSystem, Tab } from "../types";
import { ConfigureTab } from "./ConfigureTab";
import { ExportTab } from "./ExportTab";
import { StatusMessage } from "./StatusMessage";
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

export const SystemManagerPlugin: React.FC = () => {
	const [activeTab, setActiveTab] = useState<Tab>("configure");
	const [colorSystem, setColorSystem] = useState<ColorSystem | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string>("");

	const { sendPluginMessage } = usePluginMessaging({
		setIsLoading,
		setMessage,
		colorSystem,
	});

	const { handleFileUpload, handleFigmaVariablesUpload } = useFileHandling({
		setColorSystem,
		setIsLoading,
		setMessage,
		sendPluginMessage,
	});

	// Handle color import to Figma
	const handleImportToFigma = useCallback(() => {
		if (!colorSystem) {
			setMessage("Please load a color system first.");
			return;
		}

		setIsLoading(true);
		sendPluginMessage("import-colors", colorSystem);
	}, [colorSystem, sendPluginMessage]);

	// Handle export as CSS
	const handleExportCSS = useCallback(() => {
		if (!colorSystem) {
			setMessage("Please load a color system first.");
			return;
		}

		sendPluginMessage("export-css", colorSystem);
	}, [colorSystem, sendPluginMessage]);

	// Handle export as JSON
	const handleExportJSON = useCallback(() => {
		if (!colorSystem) {
			setMessage("Please load a color system first.");
			return;
		}

		sendPluginMessage("export-json", colorSystem);
	}, [colorSystem, sendPluginMessage]);

	// Handle Figma variables export
	const handleExportFigmaVariables = useCallback(() => {
		setIsLoading(true);
		sendPluginMessage("export-figma-variables");
	}, [sendPluginMessage]);

	const renderTabContent = () => {
		switch (activeTab) {
			case "configure":
				return (
					<ConfigureTab
						colorSystem={colorSystem}
						isLoading={isLoading}
						onFileUpload={handleFileUpload}
						onImportToFigma={handleImportToFigma}
					/>
				);
			case "export":
				return (
					<ExportTab
						colorSystem={colorSystem}
						isLoading={isLoading}
						onExportCSS={handleExportCSS}
						onExportJSON={handleExportJSON}
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
			default:
				return null;
		}
	};

	return (
		<div className="w-full h-full bg-white">
			{/* Header */}
			<div className="fixed top-0 left-0 right-0 px-5 pt-2 border-b border-gray-7 bg-gray-2">
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
							{!colorSystem && (
								<span className="bg-red-3 border border-red-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-red-11">
									None
								</span>
							)}
							{colorSystem && (
								<span className="bg-green-3 border border-green-7 px-1.5 py-0.5 text-[0.625rem] font-mono font-medium text-green-11">
									Color system
								</span>
							)}
						</div>
					</div>
				</div>

				<nav className="flex gap-x-2 pt-2">
					{tabButton("Configure", () => setActiveTab("configure"), activeTab === "configure")}
					{tabButton("Export", () => setActiveTab("export"), activeTab === "export")}
					{tabButton("Variables", () => setActiveTab("variables"), activeTab === "variables")}
				</nav>
			</div>

			{/* Content */}
			<div className="pb-16 pt-24">
				{renderTabContent()}
				<div className="fixed bottom-0 left-0 right-0 px-5 py-4">
					<StatusMessage message={message} />
				</div>
			</div>
		</div>
	);
};
