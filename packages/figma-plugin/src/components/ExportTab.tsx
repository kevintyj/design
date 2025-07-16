import type { ColorSystem as GeneratedColorSystem } from "@kevintyj/design-color-core";
import type { SpacingSystem as GeneratedSpacingSystem } from "@kevintyj/design-spacing-core";
import type React from "react";
import type { ColorSystem, SpacingSystem } from "../types";
import { Alert } from "./Alert";

interface ExportTabProps {
	colorSystem: ColorSystem | null;
	spacingSystem?: SpacingSystem | null;
	generatedColorSystem: GeneratedColorSystem | null;
	generatedSpacingSystem?: GeneratedSpacingSystem | null;
	isLoading: boolean;
	onExportCSS: () => void;
	onExportJSON: () => void;
	onExportGeneratedCSS: () => void;
	onExportGeneratedJSON: () => void;
	onExportTailwindJSON: () => void;
	onExportCollectionsJSON: () => void;
	onExportSpacingCSS: () => void;
	onExportSpacingJSON: () => void;
	onExportGeneratedSpacingCSS?: () => void;
	onExportGeneratedSpacingJSON?: () => void;
	onExportSpacingTailwindJSON?: () => void;
	onExportSpacingCollectionsJSON?: () => void;
}

// Reusable export section component
interface ExportSectionProps {
	title: string;
	description: string;
	children: React.ReactNode;
	system: any;
	systemName: string;
	className?: string;
}

const ExportSection: React.FC<ExportSectionProps> = ({
	title,
	description,
	children,
	system,
	systemName,
	className = "",
}) => (
	<div className={`space-y-2 ${className}`}>
		<h2 className="text-base font-serif font-medium text-gray-12">{title}</h2>
		<p className="text-sm text-gray-11">{description}</p>

		{children}

		{!system && <Alert variant="warning">Please import a {systemName} first to enable export.</Alert>}
	</div>
);

// Reusable button group component
interface ButtonGroupProps {
	title?: string;
	buttons: Array<{
		label: string;
		onClick: () => void;
		disabled: boolean;
		loading?: boolean;
	}>;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ title, buttons }) => (
	<div className="space-y-2">
		{title && <p className="text-xs font-medium text-gray-12">{title}</p>}
		<div className="flex space-x-3 flex-wrap gap-y-2">
			{buttons.map((button) => (
				<button
					key={button.label}
					type="button"
					onClick={button.onClick}
					disabled={button.disabled}
					className="btn bg-teal-9 hover:bg-teal-10 text-[white] border-teal-11"
				>
					{button.loading ? "Loading..." : button.label}
				</button>
			))}
		</div>
	</div>
);

export const ExportTab: React.FC<ExportTabProps> = ({
	colorSystem,
	spacingSystem,
	generatedColorSystem,
	generatedSpacingSystem,
	isLoading,
	onExportCSS,
	onExportJSON,
	onExportGeneratedCSS,
	onExportGeneratedJSON,
	onExportTailwindJSON,
	onExportCollectionsJSON,
	onExportSpacingCSS,
	onExportSpacingJSON,
	onExportGeneratedSpacingCSS,
	onExportGeneratedSpacingJSON,
	onExportSpacingTailwindJSON,
	onExportSpacingCollectionsJSON,
}) => {
	return (
		<div className="py-3 px-5 space-y-6">
			{/* Original color system export */}
			<ExportSection
				title="Export color system"
				description="Export your imported color system as CSS or JSON files."
				system={colorSystem}
				systemName="color system"
			>
				<ButtonGroup
					buttons={[
						{
							label: "Export as CSS",
							onClick: onExportCSS,
							disabled: !colorSystem || isLoading,
							loading: isLoading,
						},
						{
							label: "Export as JSON",
							onClick: onExportJSON,
							disabled: !colorSystem || isLoading,
							loading: isLoading,
						},
					]}
				/>
			</ExportSection>

			<ExportSection
				title="Export spacing system"
				description="Export your imported spacing system as CSS or JSON files."
				system={spacingSystem}
				systemName="spacing system"
				className="border-t border-gray-6 pt-6"
			>
				<ButtonGroup
					buttons={[
						{
							label: "Export as CSS",
							onClick: onExportSpacingCSS,
							disabled: !spacingSystem || isLoading,
							loading: isLoading,
						},
						{
							label: "Export as JSON",
							onClick: onExportSpacingJSON,
							disabled: !spacingSystem || isLoading,
							loading: isLoading,
						},
					]}
				/>
			</ExportSection>

			{/* Generated color scales export */}
			<ExportSection
				title="Export generated color scales"
				description="Export your generated color scales as comprehensive files or single format exports."
				system={generatedColorSystem}
				systemName="generated color system"
				className="border-t border-gray-6 pt-6"
			>
				<div className="space-y-3">
					{/* ZIP exports with multiple formats */}
					<ButtonGroup
						title="Multi-format exports (ZIP)"
						buttons={[
							{
								label: "Export Scales as CSS",
								onClick: onExportGeneratedCSS,
								disabled: !generatedColorSystem || isLoading,
								loading: isLoading,
							},
							{
								label: "Export Scales as JSON",
								onClick: onExportGeneratedJSON,
								disabled: !generatedColorSystem || isLoading,
								loading: isLoading,
							},
						]}
					/>

					{/* Single format exports */}
					<ButtonGroup
						title="Single format exports"
						buttons={[
							{
								label: "Export Tailwind JSON",
								onClick: onExportTailwindJSON,
								disabled: !generatedColorSystem || isLoading,
								loading: isLoading,
							},
							{
								label: "Export Collections JSON",
								onClick: onExportCollectionsJSON,
								disabled: !generatedColorSystem || isLoading,
								loading: isLoading,
							},
						]}
					/>

					{generatedColorSystem && (
						<div className="text-xs text-gray-10 space-y-1">
							<p>• CSS ZIP includes: full, clean, hexa-only, and P3-only variants</p>
							<p>• JSON ZIP includes: flat, nested, tokens, Tailwind, and collections formats</p>
							<p>• Tailwind JSON exports a single file compatible with Tailwind CSS</p>
							<p>• Collections JSON exports a single file compatible with design token collections</p>
						</div>
					)}
				</div>
			</ExportSection>

			{/* Generated spacing utilities export */}
			<ExportSection
				title="Export generated spacing utilities"
				description="Export your generated spacing utilities as comprehensive files or single format exports."
				system={generatedSpacingSystem}
				systemName="generated spacing system"
				className="border-t border-gray-6 pt-6"
			>
				<div className="space-y-3">
					{/* ZIP exports with multiple formats */}
					{onExportGeneratedSpacingCSS && onExportGeneratedSpacingJSON && (
						<ButtonGroup
							title="Multi-format exports (ZIP)"
							buttons={[
								{
									label: "Export Utilities as CSS",
									onClick: onExportGeneratedSpacingCSS,
									disabled: !generatedSpacingSystem || isLoading,
									loading: isLoading,
								},
								{
									label: "Export Utilities as JSON",
									onClick: onExportGeneratedSpacingJSON,
									disabled: !generatedSpacingSystem || isLoading,
									loading: isLoading,
								},
							]}
						/>
					)}

					{/* Single format exports */}
					{onExportSpacingTailwindJSON && onExportSpacingCollectionsJSON && (
						<ButtonGroup
							title="Single format exports"
							buttons={[
								{
									label: "Export Tailwind JSON",
									onClick: onExportSpacingTailwindJSON,
									disabled: !generatedSpacingSystem || isLoading,
									loading: isLoading,
								},
								{
									label: "Export Collections JSON",
									onClick: onExportSpacingCollectionsJSON,
									disabled: !generatedSpacingSystem || isLoading,
									loading: isLoading,
								},
							]}
						/>
					)}

					{generatedSpacingSystem && (
						<div className="text-xs text-gray-10 space-y-1">
							<p>• CSS ZIP includes: combined, px, rem, and numeric variants</p>
							<p>• JSON ZIP includes: flat, nested, tokens, Tailwind, and collections formats</p>
							<p>• Tailwind JSON exports a single file compatible with Tailwind CSS spacing</p>
							<p>• Collections JSON exports a single file compatible with design token collections</p>
							<p>• Spacing utilities include px, rem, and numeric values</p>
						</div>
					)}
				</div>
			</ExportSection>
		</div>
	);
};
