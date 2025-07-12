import type { ColorSystem as GeneratedColorSystem } from "@kevintyj/design/color-generation-core";
import { generateCSSForColorSystem } from "@kevintyj/design/color-generation-css";
import { convertToJSON } from "@kevintyj/design/color-generation-json";
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

/**
 * Create a ZIP file containing generated color scales as CSS with multiple variants
 */
export const createGeneratedColorScalesCSS = async (generatedColorSystem: GeneratedColorSystem): Promise<Blob> => {
	const zip = new JSZip();

	// Generate all CSS variants
	const variants = [
		{ variant: "full", suffix: "full" },
		{ variant: "clean", suffix: "clean" },
		{ variant: "hexa-only", suffix: "hexa" },
		{ variant: "p3-only", suffix: "p3" },
	] as const;

	for (const { variant, suffix } of variants) {
		const config = { variant, includeComments: true };

		// Generate light mode CSS
		const lightCSS = `:root {\n${generateCSSForColorSystem(generatedColorSystem, "light", config)}}`;

		// Generate dark mode CSS
		const darkCSS = `@media (prefers-color-scheme: dark) {\n  :root {\n${generateCSSForColorSystem(
			generatedColorSystem,
			"dark",
			config,
		)
			.split("\n")
			.map((line) => (line ? `  ${line}` : line))
			.join("\n")}  }\n}`;

		// Combined CSS
		const combinedCSS = `/* Auto-generated color scales - ${suffix} variant */\n\n/* Light mode (default) */\n${lightCSS}\n\n/* Dark mode (automatic based on system preference) */\n${darkCSS}`;

		// Add files to ZIP
		zip.file(`colors-${suffix}-light.css`, lightCSS);
		zip.file(`colors-${suffix}-dark.css`, darkCSS);
		zip.file(`colors-${suffix}-combined.css`, combinedCSS);
	}

	// Add README
	const readme = `# Generated Color Scales Export

This export contains your generated color scales as CSS custom properties in multiple variants.

## Variants Included

1. **Full** - Complete color system with all variants
2. **Clean** - Clean color system without metadata  
3. **Hexa** - HEXA solid and alpha colors only
4. **P3** - P3 solid and alpha colors only

## File Structure

- \`colors-{variant}-light.css\` - Light mode only
- \`colors-{variant}-dark.css\` - Dark mode only  
- \`colors-{variant}-combined.css\` - Both modes with media queries

## Usage

Include the combined CSS file in your project:

\`\`\`html
<link rel="stylesheet" href="colors-full-combined.css">
\`\`\`

Or use individual files and handle mode switching yourself.

## Available Colors

${generatedColorSystem.colorNames.map((color) => `- --color-${color}-{1-12}`).join("\n")}
- --color-gray-{1-12}
- --color-background

## Generated At

${new Date().toISOString()}
`;

	zip.file("README.md", readme);

	return await zip.generateAsync({ type: "blob" });
};

/**
 * Create a ZIP file containing generated color scales as JSON in multiple formats
 */
export const createGeneratedColorScalesJSON = async (generatedColorSystem: GeneratedColorSystem): Promise<Blob> => {
	const zip = new JSZip();

	const formats = ["flat", "nested", "tokens", "tailwind", "collections"] as const;
	const modes = ["light", "dark"] as const;

	for (const format of formats) {
		if (format === "tailwind" || format === "collections") {
			// These formats include both modes
			const data = convertToJSON(generatedColorSystem, format, undefined, { prettyPrint: true });
			zip.file(`colors-${format}.json`, JSON.stringify(data, null, 2));
		} else {
			// These formats are mode-specific
			for (const mode of modes) {
				const data = convertToJSON(generatedColorSystem, format, mode, { prettyPrint: true });
				zip.file(`colors-${format}-${mode}.json`, JSON.stringify(data, null, 2));
			}
		}
	}

	// Add metadata
	const metadata = {
		generatedAt: new Date().toISOString(),
		totalColors: generatedColorSystem.colorNames.length,
		totalScales: generatedColorSystem.metadata.totalScales,
		colorNames: generatedColorSystem.colorNames,
		formats: formats,
		modes: modes,
	};
	zip.file("metadata.json", JSON.stringify(metadata, null, 2));

	// Add README
	const readme = `# Generated Color Scales JSON Export

This export contains your generated color scales in multiple JSON formats.

## Formats Included

1. **Flat** - All colors at root level (\`colors-flat-{mode}.json\`)
2. **Nested** - Colors grouped by name (\`colors-nested-{mode}.json\`)  
3. **Tokens** - Design tokens format (\`colors-tokens-{mode}.json\`)
4. **Tailwind** - Tailwind CSS config format (\`colors-tailwind.json\`)
5. **Collections** - Figma collections format (\`colors-collections.json\`)

## Color Information

- **Colors**: ${generatedColorSystem.colorNames.join(", ")}
- **Total Scales**: ${generatedColorSystem.metadata.totalScales}
- **Modes**: Light, Dark

## Generated At

${new Date().toISOString()}
`;

	zip.file("README.md", readme);

	return await zip.generateAsync({ type: "blob" });
};

/**
 * Download generated color scales as a ZIP file
 */
export const downloadGeneratedColorScalesZip = async (
	generatedColorSystem: GeneratedColorSystem,
	type: "css" | "json",
) => {
	try {
		const blob =
			type === "css"
				? await createGeneratedColorScalesCSS(generatedColorSystem)
				: await createGeneratedColorScalesJSON(generatedColorSystem);

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `generated-color-scales-${type}.zip`;
		a.click();
		URL.revokeObjectURL(url);

		return `Generated color scales ${type.toUpperCase()} export completed successfully!`;
	} catch (error) {
		throw new Error(`Error creating generated color scales export: ${error}`);
	}
};
