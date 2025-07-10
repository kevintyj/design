type ArrayOf12<T> = [T, T, T, T, T, T, T, T, T, T, T, T];
export interface ColorScale {
	accentScale: string[];
	accentScaleAlpha: string[];
	accentScaleWideGamut: string[];
	accentScaleAlphaWideGamut: string[];
	accentContrast: string;
	grayScale: string[];
	grayScaleAlpha: string[];
	grayScaleWideGamut: string[];
	grayScaleAlphaWideGamut: string[];
	graySurface: string;
	graySurfaceWideGamut: string;
	accentSurface: string;
	accentSurfaceWideGamut: string;
	background: string;
	overlays: {
		black: string[];
		white: string[];
	};
}
export interface GenerationConfig {
	includeAlpha?: boolean;
	includeWideGamut?: boolean;
	includeGrayScale?: boolean;
	includeOverlays?: boolean;
}
export declare const defaultConfig: Required<GenerationConfig>;
export declare const generateRadixColors: ({
	appearance,
	...args
}: {
	appearance: "light" | "dark";
	accent: string;
	gray: string;
	background: string;
}) => {
	accentScale: ArrayOf12<string>;
	accentScaleAlpha: ArrayOf12<string>;
	accentScaleWideGamut: ArrayOf12<string>;
	accentScaleAlphaWideGamut: ArrayOf12<string>;
	accentContrast: string;
	grayScale: ArrayOf12<string>;
	grayScaleAlpha: ArrayOf12<string>;
	grayScaleWideGamut: ArrayOf12<string>;
	grayScaleAlphaWideGamut: ArrayOf12<string>;
	graySurface: string;
	graySurfaceWideGamut: string;
	accentSurface: string;
	accentSurfaceWideGamut: string;
	background: string;
	overlays: import("./overlayGeneration").OverlayColors;
};
export declare function transposeProgressionStart(
	to: number,
	arr: number[],
	curve: [number, number, number, number],
): number[];
export declare function transposeProgressionEnd(
	to: number,
	arr: number[],
	curve: [number, number, number, number],
): number[];
export {};
