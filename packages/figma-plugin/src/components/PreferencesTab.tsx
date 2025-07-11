import type React from "react";
import type { UserPreferences } from "../types";

interface PreferencesTabProps {
	preferences: UserPreferences;
	onPreferenceChange: (key: keyof UserPreferences, enabled: boolean) => void;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({ preferences, onPreferenceChange }) => {
	return (
		<div className="py-3 px-5">
			<h2 className="text-base font-serif font-medium text-gray-12">User Preferences</h2>

			<div className="space-y-4 pt-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="save-color-system"
							checked={preferences.saveColorSystem}
							onChange={(e) => onPreferenceChange("saveColorSystem", e.target.checked)}
							className="checkbox"
						/>
						<label htmlFor="save-color-system" className="text-sm text-gray-11 cursor-pointer">
							Save color configuration to Figma storage
						</label>
					</div>

					<div className="flex items-center gap-2 ml-6">
						<input
							type="checkbox"
							id="auto-generate-on-load"
							checked={preferences.autoGenerateOnLoad}
							onChange={(e) => onPreferenceChange("autoGenerateOnLoad", e.target.checked)}
							disabled={!preferences.saveColorSystem}
							className="checkbox"
						/>
						<label
							htmlFor="auto-generate-on-load"
							className={`text-sm cursor-pointer ${preferences.saveColorSystem ? "text-gray-11" : "text-gray-9"}`}
						>
							Auto-generate color scales when loading saved configuration
						</label>
					</div>
				</div>

				<div className="pt-2 space-y-2">
					<p className="text-sm text-gray-11">
						<strong>Save color configuration:</strong> When enabled, your color system will be saved to Figma's local
						storage and automatically loaded when you open the plugin.
					</p>
					<p className="text-sm text-gray-11">
						<strong>Auto-generate on load:</strong> When enabled, color scales will be automatically generated when a
						saved configuration is loaded.
					</p>
				</div>
			</div>
		</div>
	);
};
