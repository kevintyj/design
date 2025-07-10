import JSZip from "jszip";
import type { ColorSystem, ExportData } from "../types";

export const downloadFile = (content: string, filename: string, contentType: string) => {
	const blob = new Blob([content], { type: contentType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};

export const createExportZip = async (data: ExportData, colorSystem: ColorSystem | null): Promise<Blob> => {
	const zip = new JSZip();

	if (data.type === "css") {
		// For CSS export, create multiple files
		zip.file("colors.css", data.content);

		// Also create a README with usage instructions
		const readme = `# Color System Export

This export contains your color system as CSS custom properties.

## Usage

1. Include the \`colors.css\` file in your project
2. Use the CSS custom properties in your stylesheets:

\`\`\`css
.my-element {
  background-color: var(--color-blue);
  color: var(--color-background);
}
\`\`\`

## Dark Mode

The CSS includes automatic dark mode support using the \`[data-theme="dark"]\` selector.
Add \`data-theme="dark"\` to your HTML element to enable dark mode.

## Available Colors

${
	colorSystem
		? Object.keys(colorSystem.light)
				.map((color) => `- --color-${color}`)
				.join("\n")
		: ""
}
- --color-gray
- --color-background
`;

		zip.file("README.md", readme);
	} else {
		// For JSON export, just add the file
		zip.file(data.filename, data.content);
	}

	return await zip.generateAsync({ type: "blob" });
};

export const downloadZip = async (data: ExportData, colorSystem: ColorSystem | null) => {
	try {
		const blob = await createExportZip(data, colorSystem);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `color-system-${data.type}.zip`;
		a.click();
		URL.revokeObjectURL(url);

		return `${data.type.toUpperCase()} export completed successfully!`;
	} catch (error) {
		throw new Error(`Error creating export: ${error}`);
	}
};
