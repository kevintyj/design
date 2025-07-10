/**
 * Overlay generation utilities
 * Universal overlay colors for black and white overlays
 */

export interface OverlayColors {
	black: string[];
	white: string[];
}

/**
 * Generate universal overlay colors
 * These are the same for both light and dark modes
 */
export function generateOverlayColors(): OverlayColors {
	// Black overlay alpha values (hex format)
	const blackOverlayAlphas = ["03", "05", "0a", "12", "17", "1c", "24", "38", "6e", "78", "8f", "e8"];

	// White overlay alpha values (hex format)
	const whiteOverlayAlphas = ["00", "03", "08", "0d", "14", "1f", "2b", "3d", "61", "70", "96", "eb"];

	const blackOverlays = blackOverlayAlphas.map((alpha) => `#000000${alpha}`);
	const whiteOverlays = whiteOverlayAlphas.map((alpha) => `#ffffff${alpha}`);

	return {
		black: blackOverlays,
		white: whiteOverlays,
	};
}

/**
 * Get overlay alpha values for direct use
 */
export function getOverlayAlphas() {
	return {
		black: ["03", "05", "0a", "12", "17", "1c", "24", "38", "6e", "78", "8f", "e8"],
		white: ["00", "03", "08", "0d", "14", "1f", "2b", "3d", "61", "70", "96", "eb"],
	};
}

/**
 * Generate overlay colors for specific format
 */
export function generateOverlayColorsForFormat(format: "hex" | "p3"): OverlayColors {
	const overlayColors = generateOverlayColors();

	if (format === "hex") {
		return overlayColors;
	}

	// For P3 format, convert to P3 color space (though overlays are typically kept in hex)
	// For now, we'll keep them in hex format since overlays are universal
	return overlayColors;
}

/**
 * Get overlay color at specific step
 */
export function getOverlayColor(type: "black" | "white", step: number): string {
	const overlays = generateOverlayColors();
	const color = overlays[type][step - 1];

	if (!color) {
		throw new Error(`Invalid overlay step: ${step}. Must be between 1 and 12.`);
	}

	return color;
}
