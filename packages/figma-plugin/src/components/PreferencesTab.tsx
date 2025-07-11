import type React from "react";
import type { UserPreferences } from "../types";
import { CheckboxField } from "./CheckboxField";

interface PreferencesTabProps {
	preferences: UserPreferences;
	onPreferenceChange: (key: keyof UserPreferences, enabled: boolean) => void;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({ preferences, onPreferenceChange }) => {
	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12">User Preferences</h2>

			<div className="space-y-6 pt-4">
				{/* Color Preferences */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-gray-12">Color System</h3>

					<CheckboxField
						id="save-color-system"
						label="Save color configuration to Figma storage"
						checked={preferences.saveColorSystem}
						onChange={(checked) => onPreferenceChange("saveColorSystem", checked)}
					/>

					<CheckboxField
						id="auto-generate-on-load"
						label="Auto-generate color scales when loading saved configuration"
						checked={preferences.autoGenerateOnLoad}
						onChange={(checked) => onPreferenceChange("autoGenerateOnLoad", checked)}
						disabled={!preferences.saveColorSystem}
						indented={true}
					/>
				</div>

				{/* Spacing Preferences */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-gray-12">Spacing System</h3>

					<CheckboxField
						id="save-spacing-system"
						label="Save spacing configuration to Figma storage"
						checked={preferences.saveSpacingSystem}
						onChange={(checked) => onPreferenceChange("saveSpacingSystem", checked)}
					/>

					<CheckboxField
						id="auto-generate-spacing-on-load"
						label="Auto-generate spacing scales when loading saved configuration"
						checked={preferences.autoGenerateSpacingOnLoad}
						onChange={(checked) => onPreferenceChange("autoGenerateSpacingOnLoad", checked)}
						disabled={!preferences.saveSpacingSystem}
						indented={true}
					/>
				</div>

				{/* Explanations */}
				<div className="pt-3 space-y-2 border-t border-gray-6">
					<p className="text-sm text-gray-11">
						<strong>Save configuration:</strong> When enabled, your color and spacing systems will be saved to Figma's
						local storage and automatically loaded when you open the plugin.
					</p>
					<p className="text-sm text-gray-11">
						<strong>Auto-generate on load:</strong> When enabled, scales will be automatically generated when a saved
						configuration is loaded, giving you immediate access to your design tokens.
					</p>
				</div>
			</div>
		</div>
	);
};
