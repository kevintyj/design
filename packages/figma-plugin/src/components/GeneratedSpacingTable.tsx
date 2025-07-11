import type { SpacingSystem } from "@design/spacing-generation-core";
import type React from "react";
import { spacingList } from "./SpacingConfigureTab";

interface GeneratedSpacingTableProps {
	generatedSpacingSystem: SpacingSystem;
}

interface SpacingGraphicProps {
	value: number;
}

export const SpacingGraphic: React.FC<SpacingGraphicProps> = ({ value }) => {
	return (
		<div
			className="flex items-center bg-blaze-a3 border-l border-r border-blaze-a7 h-4"
			style={{ width: `${value}px` }}
		>
			<div className="h-px w-full bg-blaze-a7" />
		</div>
	);
};

const GeneratedSpacingTable: React.FC<GeneratedSpacingTableProps> = ({ generatedSpacingSystem }) => {
	return (
		<div className="space-y-6 border-t border-gray-6 pt-6">
			<h2 className="text-base font-serif font-medium text-gray-12">Generated spacing system</h2>

			<div className="flex justify-between items-center mb-3">
				<h3 className="text-sm font-medium text-gray-12">Default</h3>
				<div className="text-xs text-gray-11">
					{Object.keys(generatedSpacingSystem.spacing.values).length} values •{" "}
					{generatedSpacingSystem.spacing.multiplier}px base multiplier
				</div>
			</div>

			<div className="space-y-2">
				{spacingList(generatedSpacingSystem.spacing.values, generatedSpacingSystem.spacing.remValues)}
			</div>

			<div className="mt-3 pt-3 border-t border-gray-6">
				<div className="text-xs text-gray-11">
					<div className="flex justify-between">
						<span>Generation completed:</span>
						<span className="font-mono">{new Date(generatedSpacingSystem.metadata.generatedAt).toLocaleString()}</span>
					</div>
					<div className="flex justify-between mt-1">
						<span>REM base:</span>
						<span className="font-mono">{generatedSpacingSystem.metadata.config.remBase}px</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GeneratedSpacingTable;
