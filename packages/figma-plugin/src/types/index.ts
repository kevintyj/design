// Types for the plugin
export interface ColorDefinition {
	[colorName: string]: string;
}

export interface ColorSystem {
	light: ColorDefinition;
	dark: ColorDefinition;
	constants: {
		light: { gray: string; background: string };
		dark: { gray: string; background: string };
	};
}

export interface FigmaVariable {
	id: string;
	name: string;
	variableCollectionId: string;
	resolvedType: string;
	valuesByMode: { [modeId: string]: any };
}

export type Tab = "configure" | "export" | "variables" | "preferences";

export interface UserPreferences {
	saveColorSystem: boolean;
	autoGenerateOnLoad: boolean;
}

export interface PluginMessage {
	type: string;
	data?: any;
	error?: string;
	preference?: boolean;
	preferences?: UserPreferences;
}

export interface ExportData {
	content: string;
	filename: string;
	type: "css" | "json";
}
