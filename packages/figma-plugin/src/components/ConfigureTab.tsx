import type React from "react";
import type { ColorSystem } from "../types";
import { FileDropzone } from "./FileDropzone";

interface ConfigureTabProps {
	colorSystem: ColorSystem | null;
	isLoading: boolean;
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onImportToFigma: () => void;
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
	isLoading,
	onFileUpload,
	onImportToFigma,
}) => {
	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12">Configure color system</h2>

			<div className="space-y-3 pt-4">
				<FileDropzone
					id="color-file-upload"
					accept=".json,.ts,.js"
					onChange={onFileUpload}
					label="Load Color System File"
					primaryText={colorSystem ? "Click to replace or drag & drop" : "Click to upload or drag & drop"}
					secondaryText="JSON, TypeScript, or JavaScript files"
				/>

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

				<button
					type="button"
					disabled={!colorSystem || isLoading}
					className="btn bg-blaze-9 hover:bg-blaze-10 text-[white] border-blaze-11"
				>
					{isLoading ? "Loading..." : "Generate full color scale"}
				</button>
			</div>
		</div>
	);
};
