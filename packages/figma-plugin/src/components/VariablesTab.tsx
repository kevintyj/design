import type React from "react";
import { FileDropzone } from "./FileDropzone";

interface VariablesTabProps {
	isLoading: boolean;
	onExportVariables: () => void;
	onImportVariables: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({ isLoading, onExportVariables, onImportVariables }) => {
	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12 pb-2">Export figma variables</h2>

			<div className="space-y-4">
				{/* Export Variables */}
				<div className="py-4">
					<h3 className="text-sm font-medium text-gray-12">Export Current Variables</h3>
					<p className="text-xs text-gray-11 mb-3">
						Export all color variables from your current Figma file as a JSON collection.
					</p>
					<button
						type="button"
						onClick={onExportVariables}
						disabled={isLoading}
						className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
					>
						{isLoading ? "Exporting..." : "Export Variables"}
					</button>
				</div>

				{/* Import Variables */}
				<div className="border-t border-b border-gray-6 py-6">
					<h3 className="text-sm font-medium text-gray-12">Import Variables Collection</h3>
					<p className="text-xs text-gray-11 mb-3">Import variables from a JSON collection file to your Figma file.</p>
					<FileDropzone
						id="variables-file-upload"
						accept=".json"
						onChange={onImportVariables}
						label=""
						primaryText="Click to upload or drag & drop"
						secondaryText="JSON collection files"
					/>
				</div>
			</div>
		</div>
	);
};
