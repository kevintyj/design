import { useCallback, useEffect } from "react";
import type { ColorSystem, ExportData, PluginMessage, SpacingSystem, UserPreferences } from "../types";
import { downloadFile, downloadZip } from "../utils/download";

interface UsePluginMessagingProps {
	setIsLoading: (loading: boolean) => void;
	setMessage: (message: string) => void;
	colorSystem: ColorSystem | null;
	onClientStorageLoaded?: (data: {
		preferences: UserPreferences | null;
		colorSystem: ColorSystem | null;
		spacingSystem: SpacingSystem | null;
	}) => void;
}

export const usePluginMessaging = ({
	setIsLoading,
	setMessage,
	colorSystem,
	onClientStorageLoaded,
}: UsePluginMessagingProps) => {
	const handleExportDownload = useCallback(
		async (data: ExportData) => {
			try {
				const message = await downloadZip(data, colorSystem);
				setMessage(message);
			} catch (error) {
				setMessage(`${error}`);
			}
		},
		[colorSystem, setMessage],
	);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { type, data, error, preference }: PluginMessage = event.data.pluginMessage || {};

			setIsLoading(false);

			if (error) {
				setMessage(`Error: ${error}`);
				return;
			}

			switch (type) {
				case "colors-imported":
					setMessage("Colors imported to Figma successfully!");
					break;
				case "export-complete":
					handleExportDownload(data);
					break;
				case "variables-exported-collections":
					// Trigger download of the exported variables in collections format
					downloadFile(JSON.stringify(data, null, 2), "collections.json", "application/json");
					setMessage("Figma variables exported as collections JSON successfully!");
					break;
				case "variables-exported-raw":
					// Trigger download of the exported variables in raw format
					downloadFile(JSON.stringify(data, null, 2), "figma-variables.json", "application/json");
					setMessage("Figma variables exported as raw JSON successfully!");
					break;
				case "variables-imported":
					setMessage("Figma variables imported successfully!");
					break;
				case "color-system-generated":
					setMessage("Color system generated successfully!");
					break;
				case "client-storage-loaded":
					console.log("Client storage loaded message received:", {
						preferences: data.preferences,
						colorSystem: data.colorSystem,
					});
					if (onClientStorageLoaded) {
						onClientStorageLoaded({
							preferences: data.preferences || null,
							colorSystem: data.colorSystem || null,
							spacingSystem: data.spacingSystem || null,
						});
					}
					break;
				default:
					if (data) {
						setMessage(JSON.stringify(data));
					}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [handleExportDownload, setIsLoading, setMessage, onClientStorageLoaded]);

	const sendPluginMessage = useCallback((type: string, data?: any) => {
		console.log("Sending message:", { type, data });
		parent.postMessage(
			{
				pluginMessage: { type, data },
			},
			"*",
		);
	}, []);

	return { sendPluginMessage };
};
