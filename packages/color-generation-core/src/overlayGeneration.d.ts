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
export declare function generateOverlayColors(): OverlayColors;
/**
 * Get overlay alpha values for direct use
 */
export declare function getOverlayAlphas(): {
	black: string[];
	white: string[];
};
/**
 * Generate overlay colors for specific format
 */
export declare function generateOverlayColorsForFormat(format: "hex" | "p3"): OverlayColors;
/**
 * Get overlay color at specific step
 */
export declare function getOverlayColor(type: "black" | "white", step: number): string;
