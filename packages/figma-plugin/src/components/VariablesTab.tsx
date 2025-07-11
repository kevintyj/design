import type React from "react";
import { FileDropzone } from "./FileDropzone";

interface VariablesTabProps {
	isLoading: boolean;
	onExportVariablesAsCollections: () => void;
	onExportVariablesRaw: () => void;
	onImportVariables: (event: React.ChangeEvent<HTMLInputElement>) => void;
	parsedVariables?: any;
	onConfirmImport: () => void;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({
	isLoading,
	onExportVariablesAsCollections,
	onExportVariablesRaw,
	onImportVariables,
	parsedVariables,
	onConfirmImport,
}) => {
	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12 pb-2">Figma Variables Management</h2>

			<div className="space-y-6">
				{/* Export Variables */}
				<div>
					<h3 className="text-sm font-medium text-gray-12 mb-3">Export Current Variables</h3>

					{/* Primary Export - Collections Format */}
					<div className="mb-4">
						<p className="text-xs text-gray-11 mb-2">
							Export variables as design token collections (recommended format)
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
						<p className="text-xs text-gray-11 mb-2">Export raw Figma variables data (for debugging or advanced use)</p>
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
					<p className="text-xs text-gray-11 mb-3">
						Import variables from color-generation-json collections, other collections formats, or raw Figma variables
						JSON. The system will automatically detect the format and validate before importing.
					</p>
					<FileDropzone
						id="variables-file-upload"
						accept=".json"
						onChange={onImportVariables}
						label=""
						primaryText="Click to upload or drag & drop"
						secondaryText="Generated Collections JSON, Other Collections JSON, or Raw Variables JSON files"
					/>

					{/* Preview and Import Section */}
					{parsedVariables && (
						<div className="mt-4 p-4 border border-gray-6 rounded bg-gray-2">
							<h4 className="text-sm font-medium text-gray-12 mb-2">Preview Import</h4>
							<div className="text-xs text-gray-11 space-y-1 mb-3">
								<p>
									• <strong>Collections:</strong> {parsedVariables.collections?.length || 0}
								</p>
								<p>
									• <strong>Variables:</strong> {parsedVariables.variables?.length || 0}
								</p>
								{parsedVariables.collections?.length > 0 && (
									<p>
										• <strong>Collection names:</strong>{" "}
										{parsedVariables.collections.map((c: any) => c.name).join(", ")}
									</p>
								)}
							</div>
							<button
								type="button"
								onClick={onConfirmImport}
								disabled={isLoading}
								className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
							>
								{isLoading ? "Importing..." : "Import to Figma"}
							</button>
						</div>
					)}

					<div className="mt-3 text-xs text-gray-10 space-y-1">
						<p>
							• <strong>Color Generation JSON:</strong> Generated collections.json files from the color-generation-json
							package
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
	);
};
