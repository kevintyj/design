import { useCallback, useEffect } from "react";
import { toast } from "../hooks/useToast";
import type { ColorSystem, ExportData, PluginMessage, SpacingSystem, UserPreferences } from "../types";
import { downloadFile, downloadZip } from "../utils/download";

interface UsePluginMessagingProps {
	setIsLoading: (loading: boolean) => void;
	colorSystem: ColorSystem | null;
	onClientStorageLoaded?: (data: {
		preferences: UserPreferences | null;
		colorSystem: ColorSystem | null;
		spacingSystem: SpacingSystem | null;
	}) => void;
}

export const usePluginMessaging = ({ setIsLoading, colorSystem, onClientStorageLoaded }: UsePluginMessagingProps) => {
	const handleExportDownload = useCallback(
		async (data: ExportData) => {
			try {
				const message = await downloadZip(data, colorSystem as any);
				toast.success(message);
			} catch (error) {
				toast.error(`${error}`);
			}
		},
		[colorSystem],
	);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { type, data, error, preference }: PluginMessage = event.data.pluginMessage || {};

			setIsLoading(false);

			if (error) {
				toast.error(`Error: ${error}`);
				return;
			}

			switch (type) {
				case "colors-imported":
					toast.success("Colors imported to Figma successfully!");
					break;
				case "export-complete":
					handleExportDownload(data);
					break;
				case "variables-exported-collections":
					// Trigger download of the exported variables in collections format
					downloadFile(JSON.stringify(data, null, 2), "collections.json", "application/json");
					toast.success("Figma variables exported as collections JSON successfully!");
					break;
				case "variables-exported-raw":
					// Trigger download of the exported variables in raw format
					downloadFile(JSON.stringify(data, null, 2), "figma-variables.json", "application/json");
					toast.success("Figma variables exported as raw JSON successfully!");
					break;
				case "variables-imported":
					toast.success("Figma variables imported successfully!");
					break;
				case "color-system-generated":
					toast.success("Color system generated successfully!");
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
						toast.info(JSON.stringify(data));
					}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [handleExportDownload, setIsLoading, onClientStorageLoaded]);

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
