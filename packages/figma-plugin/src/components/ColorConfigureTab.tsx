import type { ColorSystem as ColorSystemCore } from "@design/color-generation-core";
import { TrashIcon } from "lucide-react";
import type React from "react";
import { useCallback } from "react";
import type { ColorSystem } from "../types";
import { FileDropzone } from "./FileDropzone";
import GeneratedColorTable from "./GeneratedColorTable";

interface ConfigureTabProps {
	colorSystem: ColorSystem | null;
	generatedColorSystem: ColorSystemCore | null;
	isLoading: boolean;
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onGenerateColorSystem: () => void;
	onResetColorSystem: () => void;
}

const colorList = (colorSystem: ColorSystem) => {
	return Object.keys(colorSystem.light).map((color) => {
		return (
			<div key={color} className="flex gap-2 font-mono text-xs text-gray-11 bg-gray-2 rounded-md p-1 my-1">
				<div className="flex items-center gap-2">
					<div
						className="w-4 h-4 flex items-center justify-center rounded"
						style={{ backgroundColor: colorSystem.constants.light.background }}
					>
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: colorSystem.light[color] }}></div>
					</div>
					<div
						className="w-4 h-4 flex items-center justify-center rounded"
						style={{ backgroundColor: colorSystem.constants.dark.background }}
					>
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: colorSystem.dark[color] }}></div>
					</div>
				</div>
				<span className="w-full">{color}</span>
			</div>
		);
	});
};

export const ColorConfigureTab: React.FC<ConfigureTabProps> = ({
	colorSystem,
	generatedColorSystem,
	isLoading,
	onFileUpload,
	onGenerateColorSystem,
	onResetColorSystem,
}) => {
	// Create a wrapper that resets the input value after processing
	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			onFileUpload(event);
			// Reset the input value so the same file can be selected again
			if (event.target) {
				event.target.value = "";
			}
		},
		[onFileUpload],
	);

	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12">Configure color system</h2>
			<p className="text-sm text-gray-11 pt-1 pb-3">
				Upload a colors-figma.json file or TypeScript/JavaScript file containing color definitions. For spacing
				configuration, use the <strong>Spacing</strong> tab.
			</p>

			<div className="space-y-3 pt-4">
				<div className="flex gap-2">
					<div className="flex-1 relative">
						{colorSystem && (
							<button
								type="button"
								onClick={onResetColorSystem}
								className="btn bg-red-9 hover:bg-red-10 text-[white] border-red-11 absolute right-0 flex items-center gap-x-2 top-[-4px] text-xs"
							>
								<TrashIcon className="w-3.5 h-3.5" />
								Reset
							</button>
						)}
						<FileDropzone
							id="color-file-upload"
							accept=".json,.ts,.js"
							onChange={handleFileUpload}
							label="Load Color System File"
							primaryText={colorSystem ? "Click to replace or drag & drop" : "Click to upload or drag & drop"}
							secondaryText="colors-figma.json, TypeScript, or JavaScript files"
						/>
					</div>
				</div>

				{colorSystem && (
					<>
						<div className="bg-green-3 border border-green-7 px-4 py-2">
							<p className="text-xs font-mono text-green-11">
								Color system loaded:
								<br />
								{Object.keys(colorSystem.light).length} colors
								<br />
								{Object.keys(colorSystem.constants.light).length} constants
							</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-gray-12 pb-1">Loaded colors:</h3>
							{colorList(colorSystem)}
						</div>
					</>
				)}

				<div className="flex gap-2 pb-6">
					<button
						type="button"
						disabled={!colorSystem || isLoading}
						onClick={onGenerateColorSystem}
						className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
					>
						{isLoading ? "Loading..." : "Generate full color scale"}
					</button>
				</div>

				{generatedColorSystem && <GeneratedColorTable generatedColorSystem={generatedColorSystem} />}
			</div>
		</div>
	);
};
