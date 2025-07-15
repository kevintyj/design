interface WindowConfigObject {
	width: number;
	height: number;
}

interface WindowConfig {
	default: WindowConfigObject;
	min?: WindowConfigObject;
	max?: WindowConfigObject;
}

export const WINDOW_CONFIG: WindowConfig = {
	default: {
		width: 720,
		height: 520,
	},
	min: {
		width: 720,
		height: 420,
	},
} as const;

// Storage keys used throughout the plugin
export const STORAGE_KEYS = {
	CLIENT_STORAGE: "figma-color-system",
	SPACING_STORAGE: "figma-spacing-system",
	PREFERENCES: "figma-preferences",
} as const;
