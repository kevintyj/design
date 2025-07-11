import type { ColorSystem as ColorSystemCore } from "@design/color-generation-core";
import type React from "react";
import { useCallback } from "react";
import type { ColorSystem, UserPreferences } from "../types";
import { FileDropzone } from "./FileDropzone";
import GeneratedColorTable from "./GeneratedColorTable";

interface ConfigureTabProps {
	colorSystem: ColorSystem | null;
	generatedColorSystem: ColorSystemCore | null;
	isLoading: boolean;
	preferences: UserPreferences;
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onImportToFigma: () => void;
	onGenerateColorSystem: () => void;
	onPreferenceChange: (key: keyof UserPreferences, enabled: boolean) => void;
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

export const ConfigureTab: React.FC<ConfigureTabProps> = ({
	colorSystem,
	generatedColorSystem,
	isLoading,
	preferences,
	onFileUpload,
	onImportToFigma,
	onGenerateColorSystem,
	onPreferenceChange,
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

			{/* Save preferences */}
			<div className="space-y-2 pt-3 pb-2">
				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="save-color-system"
						checked={preferences.saveColorSystem}
						onChange={(e) => onPreferenceChange("saveColorSystem", e.target.checked)}
						className="checkbox"
					/>
					<label htmlFor="save-color-system" className="text-sm text-gray-11 cursor-pointer">
						Save color configuration to Figma storage
					</label>
				</div>

				<div className="flex items-center gap-2 ml-6">
					<input
						type="checkbox"
						id="auto-generate-on-load"
						checked={preferences.autoGenerateOnLoad}
						onChange={(e) => onPreferenceChange("autoGenerateOnLoad", e.target.checked)}
						disabled={!preferences.saveColorSystem}
						className="checkbox"
					/>
					<label
						htmlFor="auto-generate-on-load"
						className={`text-sm cursor-pointer ${preferences.saveColorSystem ? "text-gray-11" : "text-gray-9"}`}
					>
						Auto-generate color scales when loading saved configuration
					</label>
				</div>
			</div>

			<div className="space-y-3 pt-2">
				<div className="flex gap-2">
					<div className="flex-1">
						<FileDropzone
							id="color-file-upload"
							accept=".json,.ts,.js"
							onChange={handleFileUpload}
							label="Load Color System File"
							primaryText={colorSystem ? "Click to replace or drag & drop" : "Click to upload or drag & drop"}
							secondaryText="JSON, TypeScript, or JavaScript files"
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

				<div className="flex gap-2">
					<button
						type="button"
						disabled={!colorSystem || isLoading}
						onClick={onGenerateColorSystem}
						className="btn bg-blaze-9 hover:bg-blaze-10 text-[white] border-blaze-11"
					>
						{isLoading ? "Loading..." : "Generate full color scale"}
					</button>

					{colorSystem && (
						<button
							type="button"
							onClick={onResetColorSystem}
							className="btn bg-red-9 hover:bg-red-10 text-[white] border-red-11"
						>
							Reset
						</button>
					)}
				</div>

				{generatedColorSystem && <GeneratedColorTable generatedColorSystem={generatedColorSystem} />}
			</div>
		</div>
	);
};
