import { useCallback } from "react";
import type { ColorSystem } from "../types";

interface UseFileHandlingProps {
	setColorSystem: (system: ColorSystem | null) => void;
	setIsLoading: (loading: boolean) => void;
	setMessage: (message: string) => void;
	sendPluginMessage: (type: string, data?: any) => void;
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

export const useFileHandling = ({
	setColorSystem,
	setIsLoading,
	setMessage,
	sendPluginMessage,
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
					const variables = JSON.parse(content);

					sendPluginMessage("import-figma-variables", variables);
				} catch (error) {
					setMessage(`Error parsing variables file: ${error}`);
					setIsLoading(false);
				}
			};

			reader.readAsText(file);
		},
		[setIsLoading, setMessage, sendPluginMessage],
	);

	return {
		handleFileUpload,
		handleFigmaVariablesUpload,
	};
};
