import type React from "react";
import type { ColorSystem } from "../types";
import { StatusMessage } from "./StatusMessage";

interface ExportTabProps {
	colorSystem: ColorSystem | null;
	isLoading: boolean;
	onExportCSS: () => void;
	onExportJSON: () => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({ colorSystem, isLoading, onExportCSS, onExportJSON }) => {
	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12 pb-2">Export color system</h2>
			<div className="space-y-3">
				<p className="text-sm text-gray-11">Export your imported color system as CSS or JSON files.</p>

				<div className="flex space-x-3">
					<button
						type="button"
						onClick={onExportCSS}
						disabled={!colorSystem || isLoading}
						className="btn bg-blaze-9 hover:bg-blaze-10 text-[white] border-blaze-11"
					>
						{isLoading ? "Loading..." : "Export as CSS"}
					</button>
					<button
						type="button"
						onClick={onExportJSON}
						disabled={!colorSystem || isLoading}
						className="btn bg-blaze-9 hover:bg-blaze-10 text-[white] border-blaze-11"
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
	);
};
