import type { ColorSystem as GeneratedColorSystem } from "@design/color-generation-core";
import type React from "react";
import type { ColorSystem } from "../types";
import { StatusMessage } from "./StatusMessage";

interface ExportTabProps {
	colorSystem: ColorSystem | null;
	generatedColorSystem: GeneratedColorSystem | null;
	isLoading: boolean;
	onExportCSS: () => void;
	onExportJSON: () => void;
	onExportGeneratedCSS: () => void;
	onExportGeneratedJSON: () => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
	colorSystem,
	generatedColorSystem,
	isLoading,
	onExportCSS,
	onExportJSON,
	onExportGeneratedCSS,
	onExportGeneratedJSON,
}) => {
	return (
		<div className="py-3 px-5 space-y-6">
			{/* Original color system export */}
			<div>
				<h2 className="text-base font-serif font-medium text-gray-12 pb-2">Export color system</h2>
				<div className="space-y-3">
					<p className="text-sm text-gray-11">Export your imported color system as CSS or JSON files.</p>

					<div className="flex space-x-3">
						<button
							type="button"
							onClick={onExportCSS}
							disabled={!colorSystem || isLoading}
							className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
						>
							{isLoading ? "Loading..." : "Export as CSS"}
						</button>
						<button
							type="button"
							onClick={onExportJSON}
							disabled={!colorSystem || isLoading}
							className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
						>
							{isLoading ? "Loading..." : "Export as JSON"}
						</button>
					</div>

					{!colorSystem && (
						<StatusMessage
							message="Please import a color system first to enable export."
							type="warning"
							dismissible={false}
						/>
					)}
				</div>
			</div>

			{/* Generated color scales export */}
			<div className="border-t border-gray-6 pt-6">
				<h2 className="text-base font-serif font-medium text-gray-12 pb-2">Export generated color scales</h2>
				<div className="space-y-3">
					<p className="text-sm text-gray-11">
						Export your generated color scales as comprehensive CSS or JSON files with multiple variants and formats.
					</p>

					<div className="flex space-x-3">
						<button
							type="button"
							onClick={onExportGeneratedCSS}
							disabled={!generatedColorSystem || isLoading}
							className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
						>
							{isLoading ? "Loading..." : "Export Scales as CSS"}
						</button>
						<button
							type="button"
							onClick={onExportGeneratedJSON}
							disabled={!generatedColorSystem || isLoading}
							className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
						>
							{isLoading ? "Loading..." : "Export Scales as JSON"}
						</button>
					</div>

					{!generatedColorSystem && (
						<StatusMessage
							message="Please generate color scales first to enable export."
							type="warning"
							dismissible={false}
						/>
					)}

					{generatedColorSystem && (
						<div className="text-xs text-gray-10 space-y-1">
							<p>• CSS export includes: full, clean, hexa-only, and P3-only variants</p>
							<p>• JSON export includes: flat, nested, tokens, Tailwind, and collections formats</p>
							<p>• All exports are packaged as ZIP files with documentation</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
