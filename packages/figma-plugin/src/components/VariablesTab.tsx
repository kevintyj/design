import type { ColorSystem as ColorSystemCore } from "@kevintyj/design-color-core";
import type { SpacingSystem as SpacingSystemCore } from "@kevintyj/design-spacing-core";
import type React from "react";
import { FileDropzone } from "./FileDropzone";
import { StatusMessage } from "./StatusMessage";

interface VariablesTabProps {
	isLoading: boolean;
	onExportVariablesAsCollections: () => void;
	onExportVariablesRaw: () => void;
	onImportVariables: (event: React.ChangeEvent<HTMLInputElement>) => void;
	parsedVariables?: any;
	onConfirmImport: () => void;
	generatedColorSystem?: ColorSystemCore | null;
	onImportFromGeneratedColors?: () => void;
	generatedSpacingSystem?: SpacingSystemCore | null;
	onImportFromGeneratedSpacing?: () => void;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({
	isLoading,
	onExportVariablesAsCollections,
	onExportVariablesRaw,
	onImportVariables,
	parsedVariables,
	onConfirmImport,
	generatedColorSystem,
	onImportFromGeneratedColors,
	generatedSpacingSystem,
	onImportFromGeneratedSpacing,
}) => {
	return (
		<div className="py-3 px-5 flex gap-2 relative">
			<div className="pr-67">
				<h2 className="text-base font-serif font-medium text-gray-12 pb-2">Figma Variables Management</h2>

				<div className="space-y-6">
					{/* Export Variables */}
					<div>
						<h3 className="text-sm font-medium text-gray-12 mb-3">Export Current Variables</h3>

						{/* Primary Export - Collections Format */}
						<div className="mb-4">
							<p className="text-xs text-gray-11 mb-2">
								Export all variables (colors and spacing) as design token collections (recommended format)
							</p>
							<button
								type="button"
								onClick={onExportVariablesAsCollections}
								disabled={isLoading}
								className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
							>
								{isLoading ? "Exporting..." : "Export as Collections JSON"}
							</button>
						</div>

						{/* Secondary Export - Raw Format */}
						<div className="border-t border-gray-6 pt-4">
							<p className="text-xs text-gray-11 mb-2">
								Export raw Figma variables data (for debugging or advanced use)
							</p>
							<button
								type="button"
								onClick={onExportVariablesRaw}
								disabled={isLoading}
								className="btn bg-gray-9 hover:bg-gray-10 text-[white] border-gray-11"
							>
								{isLoading ? "Exporting..." : "Export Raw Variables JSON"}
							</button>
						</div>
					</div>

					{/* Import Variables */}
					<div className="border-t border-gray-6 pt-6">
						<h3 className="text-sm font-medium text-gray-12 mb-3">Import Variables</h3>

						{/* Import from Generated Colors */}
						<div className="mb-6">
							<h4 className="text-sm font-medium text-gray-12 mb-2">Import from Generated Colors</h4>
							<p className="text-xs text-gray-11 mb-3">
								Import variables directly from your currently generated color system. This will create variables for all
								colors including gray scales, accent colors, surfaces, and alpha variants.
							</p>

							{generatedColorSystem && (
								<div className="text-xs text-gray-11 space-y-1 mb-3">
									<p>
										• <strong>Colors:</strong> {generatedColorSystem.colorNames.join(", ")}
									</p>
									<p>
										• <strong>Total scales:</strong> {generatedColorSystem.metadata.totalScales}
									</p>
									<p>
										• <strong>Modes:</strong> Light, Dark
									</p>
								</div>
							)}

							<button
								type="button"
								onClick={onImportFromGeneratedColors}
								disabled={!generatedColorSystem || isLoading}
								className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
							>
								{isLoading ? "Importing..." : "Import Generated Colors as Variables"}
							</button>

							{!generatedColorSystem && (
								<div className="mt-3">
									<StatusMessage
										message="Please generate a color system first to enable color variable import."
										type="warning"
										dismissible={false}
									/>
								</div>
							)}
						</div>

						{/* Import from Generated Spacing */}
						<div className="mb-6">
							<h4 className="text-sm font-medium text-gray-12 mb-2">Import from Generated Spacing</h4>
							<p className="text-xs text-gray-11 mb-3">
								Import variables directly from your currently generated spacing system. This will create number
								variables for all spacing values including pixel values, rem values, and raw numeric values.
							</p>

							{generatedSpacingSystem && (
								<div className="text-xs text-gray-11 space-y-1 mb-3">
									<p>
										• <strong>Spacing values:</strong> {Object.keys(generatedSpacingSystem.spacing.values).length} total
									</p>
									<p>
										• <strong>Base multiplier:</strong> {generatedSpacingSystem.spacing.multiplier}px
									</p>
									<p>
										• <strong>Formats:</strong> Raw numbers, Pixel values, REM values
									</p>
								</div>
							)}

							<button
								type="button"
								onClick={onImportFromGeneratedSpacing}
								disabled={!generatedSpacingSystem || isLoading}
								className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
							>
								{isLoading ? "Importing..." : "Import Generated Spacing as Variables"}
							</button>

							{!generatedSpacingSystem && (
								<div className="mt-3">
									<StatusMessage
										message="Please generate a spacing system first to enable spacing variable import."
										type="warning"
										dismissible={false}
									/>
								</div>
							)}
						</div>

						{/* Import from File */}
						<div className={generatedColorSystem || generatedSpacingSystem ? "border-t border-gray-6 pt-4" : ""}>
							<h4 className="text-sm font-medium text-gray-12 mb-3">Import from File</h4>
							<p className="text-xs text-gray-11 mb-3">
								Import variables from color-generation-json collections, spacing-generation-json collections, other
								collections formats, or raw Figma variables JSON. The system will automatically detect the format and
								validate before importing.
							</p>
							<FileDropzone
								id="variables-file-upload"
								accept=".json"
								onChange={onImportVariables}
								label=""
								primaryText="Click to upload or drag & drop"
								secondaryText="Generated Collections JSON (colors & spacing), Other Collections JSON, or Raw Variables JSON files"
							/>
						</div>

						<div className="mt-3 text-xs text-gray-10 space-y-1">
							<p>
								• <strong>Generated Colors:</strong> Import directly from your current generated color system
							</p>
							<p>
								• <strong>Generated Spacing:</strong> Import directly from your current generated spacing system
							</p>
							<p>
								• <strong>Color Generation JSON:</strong> Generated collections.json files from the
								color-generation-json package
							</p>
							<p>
								• <strong>Spacing Generation JSON:</strong> Generated collections.json files from the
								spacing-generation-json package
							</p>
							<p>
								• <strong>Collections format:</strong> Compatible with other W3C design token collections
							</p>
							<p>
								• <strong>Raw format:</strong> Compatible with exported Figma variables JSON files
							</p>
							<p>• Files will be validated before import to ensure compatibility</p>
						</div>
					</div>
				</div>
			</div>
			{/* Preview and Import Section - keep the original logic */}
			<div className="fixed top-24 right-0 py-3 px-5 border-l border-gray-6 bg-gray-1 w-64 h-[calc(100vh-6rem)] flex flex-col gap-3">
				<h4 className="text-sm font-medium text-gray-12">Preview Import</h4>
				{parsedVariables ? (
					<div className="text-xs text-gray-11">
						<p>
							• <strong>Collections:</strong> {parsedVariables.collections?.length || 0}
						</p>
						<p>
							• <strong>Variables:</strong> {parsedVariables.variables?.length || 0}
						</p>
						{parsedVariables.collections?.length > 0 && (
							<p>
								• <strong>Collection names:</strong> {parsedVariables.collections.map((c: any) => c.name).join(", ")}
							</p>
						)}
					</div>
				) : (
					<StatusMessage message="No variables to import" type="info" dismissible={false} />
				)}
				<button
					type="button"
					onClick={onConfirmImport}
					disabled={isLoading}
					className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
				>
					{isLoading ? "Importing..." : "Import to Figma"}
				</button>
			</div>
		</div>
	);
};
