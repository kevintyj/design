import type { SpacingSystem as SpacingSystemCore } from "@kevintyj/design-spacing-core";
import { TrashIcon } from "lucide-react";
import type React from "react";
import { useCallback } from "react";
import type { SpacingSystem } from "../types";
import { FileDropzone } from "./FileDropzone";
import GeneratedSpacingTable, { SpacingGraphic } from "./GeneratedSpacingTable";

interface SpacingConfigureTabProps {
	spacingSystem: SpacingSystem | null;
	generatedSpacingSystem: SpacingSystemCore | null;
	isLoading: boolean;
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onGenerateSpacingSystem: () => void;
	onResetSpacingSystem: () => void;
}

// Enhanced spacingList function with styling from GeneratedSpacingTable
export const spacingList = (spacingValues: Record<string, number>, remValues?: Record<string, string>) => {
	const spacingEntries = Object.entries(spacingValues).sort(([, a], [, b]) => a - b);

	return spacingEntries.map(([spacingName, value]) => {
		return (
			<div key={spacingName} className="flex items-center gap-3 p-2 bg-gray-2 rounded-md justify-between font-mono">
				<div className="flex items-center gap-3">
					<SpacingGraphic value={value} />
					<span className="text-sm text-blaze-a12">{spacingName}</span>
				</div>
				<div className="flex gap-2 text-xs w-full justify-end">
					<span className="text-gray-10">
						--spacing-{spacingName}: {value}px
					</span>
					{remValues?.[spacingName] && <span className="text-gray-10 w-18 text-right">{remValues[spacingName]}</span>}
					<span className="text-gray-11 w-10 text-right">{value}px</span>
				</div>
			</div>
		);
	});
};

export const SpacingConfigureTab: React.FC<SpacingConfigureTabProps> = ({
	spacingSystem,
	generatedSpacingSystem,
	isLoading,
	onFileUpload,
	onGenerateSpacingSystem,
	onResetSpacingSystem,
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
			<h2 className="text-base font-serif font-medium text-gray-12">Configure spacing system</h2>
			<p className="text-sm text-gray-11 pt-1 pb-3">
				Upload a JSON file or TypeScript/JavaScript file containing spacing definitions with a multiplier. For color
				configuration, use the <strong>Color</strong> tab.
			</p>

			<div className="space-y-3 pt-4">
				<div className="flex gap-2">
					<div className="flex-1 relative">
						{spacingSystem && (
							<button
								type="button"
								onClick={onResetSpacingSystem}
								className="btn bg-red-9 hover:bg-red-10 text-[white] border-red-11 absolute right-0 flex items-center gap-x-2 top-[-4px] text-xs"
							>
								<TrashIcon className="w-3.5 h-3.5" />
								Reset
							</button>
						)}
						<FileDropzone
							id="spacing-file-upload"
							accept=".json,.ts,.js"
							onChange={handleFileUpload}
							label="Load Spacing System File"
							primaryText={spacingSystem ? "Click to replace or drag & drop" : "Click to upload or drag & drop"}
							secondaryText="JSON, TypeScript, or JavaScript files"
						/>
					</div>
				</div>

				{spacingSystem && (
					<>
						<div className="bg-green-3 border border-green-7 px-4 py-2">
							<p className="text-xs font-mono text-green-11">
								Spacing system loaded:
								<br />
								{Object.keys(spacingSystem.spacing).length} spacing values
								<br />
								Base multiplier: {spacingSystem.multiplier}px
								<br />
								REM base: {spacingSystem.remValue}px
							</p>
						</div>
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-12 pb-1">Loaded spacing values:</h3>
							{spacingList(spacingSystem.spacing)}
						</div>
					</>
				)}

				<div className="flex gap-2 pb-6">
					<button
						type="button"
						disabled={!spacingSystem || isLoading}
						onClick={onGenerateSpacingSystem}
						className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
					>
						{isLoading ? "Loading..." : "Generate spacing utilities"}
					</button>
				</div>

				{generatedSpacingSystem && <GeneratedSpacingTable generatedSpacingSystem={generatedSpacingSystem} />}
			</div>
		</div>
	);
};
