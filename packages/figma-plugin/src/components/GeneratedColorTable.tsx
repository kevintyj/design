import type { ColorSystem as ColorSystemCore } from "@kevintyj/design-color-core";

interface GeneratedColorTableProps {
	generatedColorSystem: ColorSystemCore;
}

interface ColorChipProps {
	color: string;
	colorP3?: string;
	scale: number;
	colorName: string;
	mode: "light" | "dark";
	isAlpha?: boolean;
	alphaColor?: string;
	alphaColorP3?: string;
	backgroundColor?: string;
	isFirst?: boolean;
	isLast?: boolean;
	isOnly?: boolean;
}

const ColorChip: React.FC<ColorChipProps> = ({
	color,
	colorP3,
	scale,
	colorName,
	mode,
	isAlpha = false,
	alphaColor,
	alphaColorP3,
	backgroundColor,
	isFirst = false,
	isLast = false,
	isOnly = false,
}) => {
	// Determine rounded corner classes based on position
	const cornerClasses = isOnly ? "rounded" : isFirst ? "rounded-t" : isLast ? "rounded-b" : "";

	return (
		<div className="flex items-center gap-3">
			<div
				className={`flex items-center gap-1 py-1.5 px-3 ${isFirst ? "pt-3" : isLast ? "pb-3" : ""} ${cornerClasses}`}
				style={{ backgroundColor: backgroundColor }}
			>
				{/* Main color chip with normal/P3 split */}
				<div className="w-6 h-6 flex-shrink-0 relative overflow-hidden rounded">
					{/* Left 50% - Normal color */}
					<div className="absolute inset-0 w-1/2" style={{ backgroundColor: color }} />
					{/* Right 50% - P3 color */}
					{colorP3 && <div className="absolute inset-0 left-1/2 w-1/2" style={{ backgroundColor: colorP3 }} />}
				</div>

				{/* Alpha chip with checkered background and normal/P3 split */}
				{isAlpha && (alphaColor || alphaColorP3) && (
					<div className="w-6 h-6 rounded flex-shrink-0 relative overflow-hidden">
						{/* Checkered pattern background */}
						<div
							className="absolute w-full h-full"
							style={{
								backgroundImage: `
									linear-gradient(45deg, rgba(128, 128, 128, 0.36) 25%, transparent 25%, transparent 75%, rgba(128, 128, 128, 0.36) 75%, rgba(128, 128, 128, 0.36)),
									linear-gradient(45deg, rgba(128, 128, 128, 0.36) 25%, transparent 25%, transparent 75%, rgba(128, 128, 128, 0.36) 75%, rgba(128, 128, 128, 0.36))
								`,
								backgroundSize: "8px 8px",
								backgroundRepeat: "repeat",
								backgroundPosition: "0 0, 4px 4px",
							}}
						/>
						{/* Alpha color overlay - split normal/P3 */}
						{alphaColor && <div className="absolute inset-0 w-1/2" style={{ backgroundColor: alphaColor }} />}
						{alphaColorP3 && (
							<div className="absolute inset-0 left-1/2 w-1/2" style={{ backgroundColor: alphaColorP3 }} />
						)}
					</div>
				)}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-end gap-2">
					<span className="text-xs font-medium text-gray-12 truncate">
						{colorName}
						{scale !== 0 ? `-${scale}` : ""}
					</span>
					<span className="text-[10px] text-gray-11 font-mono truncate">{color}</span>
					<span className="text-[10px] text-gray-11 font-mono truncate">{alphaColor}</span>
				</div>
				{colorP3 && <span className="text-[10px] text-gray-9 font-mono truncate">P3: {colorP3}</span>}
			</div>
		</div>
	);
};

interface ColorModeColumnProps {
	mode: "light" | "dark";
	colors: Array<{
		color: string;
		colorP3?: string;
		name: string;
		scale?: number;
		isAlpha?: boolean;
		alphaColor?: string;
		alphaColorP3?: string;
	}>;
	backgroundColor: string;
}

const ColorModeColumn: React.FC<ColorModeColumnProps> = ({ mode, colors, backgroundColor }) => (
	<div className="space-y-2">
		<h4 className="text-xs font-medium text-gray-11 uppercase tracking-wide">{mode}</h4>
		<div className="bg-gray-2 rounded p-2">
			{colors.map((colorData, index) => {
				const isFirst = index === 0;
				const isLast = index === colors.length - 1;
				const isOnly = colors.length === 1;

				return (
					<ColorChip
						key={`${colorData.name}-${mode}-${index}`}
						color={colorData.color}
						colorP3={colorData.colorP3}
						scale={colorData.scale ?? index + 1}
						colorName={colorData.name}
						mode={mode}
						isAlpha={colorData.isAlpha}
						alphaColor={colorData.alphaColor}
						alphaColorP3={colorData.alphaColorP3}
						backgroundColor={backgroundColor}
						isFirst={isFirst}
						isLast={isLast}
						isOnly={isOnly}
					/>
				);
			})}
		</div>
	</div>
);

interface ColorModeGridProps {
	title: string;
	lightColors: Array<{
		color: string;
		colorP3?: string;
		name: string;
		scale?: number;
		isAlpha?: boolean;
		alphaColor?: string;
		alphaColorP3?: string;
	}>;
	darkColors: Array<{
		color: string;
		colorP3?: string;
		name: string;
		scale?: number;
		isAlpha?: boolean;
		alphaColor?: string;
		alphaColorP3?: string;
	}>;
	lightBackgroundColor: string;
	darkBackgroundColor: string;
}

const ColorModeGrid: React.FC<ColorModeGridProps> = ({
	title,
	lightColors,
	darkColors,
	lightBackgroundColor,
	darkBackgroundColor,
}) => (
	<div className="space-y-4">
		<h3 className="text-sm font-semibold text-gray-12 capitalize border-b border-gray-6 pb-2">{title}</h3>
		<div className="grid grid-cols-2 gap-4">
			<ColorModeColumn mode="light" colors={lightColors} backgroundColor={lightBackgroundColor} />
			<ColorModeColumn mode="dark" colors={darkColors} backgroundColor={darkBackgroundColor} />
		</div>
	</div>
);

const GeneratedColorTable: React.FC<GeneratedColorTableProps> = ({ generatedColorSystem }) => {
	const { colorNames, light, dark } = generatedColorSystem;

	// Get first color to access grayscale (assuming all colors have same grayscale)
	const firstColorName = colorNames[0];
	const lightScale = light[firstColorName];
	const darkScale = dark[firstColorName];

	// Helper function to create color data arrays
	const createGrayScaleColors = (scale: any, _mode: "light" | "dark") =>
		scale.grayScale.map((color: string, index: number) => ({
			color,
			colorP3: scale.grayScaleWideGamut?.[index],
			name: "gray",
			scale: index + 1,
			isAlpha: !!(scale.grayScaleAlpha?.[index] || scale.grayScaleAlphaWideGamut?.[index]),
			alphaColor: scale.grayScaleAlpha?.[index],
			alphaColorP3: scale.grayScaleAlphaWideGamut?.[index],
		}));

	const createSurfaceColors = (scale: any) => [
		{
			color: scale.background,
			colorP3: undefined, // background doesn't have P3 variant in the schema
			name: "background",
			scale: 0,
			isAlpha: false,
		},
		{
			color: scale.graySurface,
			colorP3: scale.graySurfaceWideGamut,
			name: "gray-surface",
			scale: 0,
			isAlpha: false,
		},
	];

	const createAccentColors = (scale: any, colorName: string) =>
		scale.accentScale.map((color: string, index: number) => ({
			color,
			colorP3: scale.accentScaleWideGamut?.[index],
			name: colorName,
			scale: index + 1,
			isAlpha: !!(scale.accentScaleAlpha?.[index] || scale.accentScaleAlphaWideGamut?.[index]),
			alphaColor: scale.accentScaleAlpha?.[index],
			alphaColorP3: scale.accentScaleAlphaWideGamut?.[index],
		}));

	return (
		<div className="space-y-6 border-t border-gray-6 pt-6">
			<h2 className="text-base font-serif font-medium text-gray-12">Generated color system</h2>

			{/* Grayscale */}
			{lightScale && darkScale && (
				<ColorModeGrid
					title="Gray Scale"
					lightColors={createGrayScaleColors(lightScale, "light")}
					darkColors={createGrayScaleColors(darkScale, "dark")}
					lightBackgroundColor={lightScale.background}
					darkBackgroundColor={darkScale.background}
				/>
			)}

			{/* Background and Surface Colors */}
			{lightScale && darkScale && (
				<ColorModeGrid
					title="Background & Surface Colors"
					lightColors={createSurfaceColors(lightScale)}
					darkColors={createSurfaceColors(darkScale)}
					lightBackgroundColor={lightScale.background}
					darkBackgroundColor={darkScale.background}
				/>
			)}

			{/* Color Scales */}
			{colorNames.map((colorName) => (
				<ColorModeGrid
					key={colorName}
					title={colorName}
					lightColors={createAccentColors(light[colorName], colorName)}
					darkColors={createAccentColors(dark[colorName], colorName)}
					lightBackgroundColor={light[colorName].background}
					darkBackgroundColor={dark[colorName].background}
				/>
			))}
			<div className="mt-3 pt-3 border-t border-gray-6">
				<div className="text-xs text-gray-11">
					<div className="flex justify-between">
						<span>Generation completed:</span>
						<span className="font-mono">{new Date(generatedColorSystem.metadata.generatedAt).toLocaleString()}</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GeneratedColorTable;
