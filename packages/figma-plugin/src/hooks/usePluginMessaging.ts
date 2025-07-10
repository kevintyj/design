import { useCallback, useEffect } from "react";
import type { ColorSystem, ExportData, PluginMessage } from "../types";
import { downloadFile, downloadZip } from "../utils/download";

interface UsePluginMessagingProps {
	setIsLoading: (loading: boolean) => void;
	setMessage: (message: string) => void;
	colorSystem: ColorSystem | null;
}

export const usePluginMessaging = ({ setIsLoading, setMessage, colorSystem }: UsePluginMessagingProps) => {
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
			const { type, data, error }: PluginMessage = event.data.pluginMessage || {};

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
				case "variables-exported":
					// Trigger download of the exported variables
					downloadFile(JSON.stringify(data, null, 2), "figma-variables.json", "application/json");
					setMessage("Figma variables exported successfully!");
					break;
				case "variables-imported":
					setMessage("Figma variables imported successfully!");
					break;
				default:
					if (data) {
						setMessage(JSON.stringify(data));
					}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [handleExportDownload, setIsLoading, setMessage]);

	const sendPluginMessage = useCallback((type: string, data?: any) => {
		parent.postMessage(
			{
				pluginMessage: { type, data },
			},
			"*",
		);
	}, []);

	return { sendPluginMessage };
};
