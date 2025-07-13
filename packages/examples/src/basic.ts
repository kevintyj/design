import { createColorInput, generateColorSystem, getColorScale, validateColorInput } from "@kevintyj/design-color-core";

console.log("🎨 Basic Color Generation Example\n");

// Define sample colors
const lightColors = {
	primary: "#0066CC",
	secondary: "#6366F1",
	success: "#059669",
	warning: "#D97706",
	error: "#DC2626",
};

const darkColors = {
	primary: "#3B82F6",
	secondary: "#8B5CF6",
	success: "#10B981",
	warning: "#F59E0B",
	error: "#EF4444",
};

const lightConstants = {
	gray: "#6B7280",
	background: "#FFFFFF",
};

const darkConstants = {
	gray: "#9CA3AF",
	background: "#111827",
};

// Create color input
const colorInput = createColorInput(lightColors, darkColors, lightConstants, darkConstants);

console.log("✅ Created color input with colors:", Object.keys(lightColors).join(", "));

// Validate the color input
try {
	validateColorInput(colorInput);
	console.log("✅ Color input validation passed");
} catch (error) {
	console.error("❌ Color input validation failed:", error);
	process.exit(1);
}

// Generate color system
console.log("\n🔄 Generating color system...");

const colorSystem = generateColorSystem(colorInput, {
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
});

console.log("✅ Generated color system with:");
console.log(`   - ${colorSystem.colorNames.length} colors`);
console.log(`   - ${colorSystem.metadata.totalScales} total scales`);
console.log(`   - Generated at: ${colorSystem.metadata.generatedAt}`);

// Demonstrate getting specific color scales
console.log("\n🎯 Sample color scale (primary - light mode):");
const primaryLightScale = getColorScale(colorSystem, "primary", "light");

console.log("  Main scale:");
primaryLightScale.accentScale.forEach((color: string, index: number) => {
	console.log(`    Step ${index + 1}: ${color}`);
});

console.log("\n  Special colors:");
console.log(`    Contrast: ${primaryLightScale.accentContrast}`);
console.log(`    Surface: ${primaryLightScale.accentSurface}`);
console.log(`    Background: ${primaryLightScale.background}`);

// Show alpha variants
console.log("\n  Alpha variants (first 3):");
primaryLightScale.accentScaleAlpha.slice(0, 3).forEach((color: string, index: number) => {
	console.log(`    Alpha ${index + 1}: ${color}`);
});

// Show wide gamut variants
console.log("\n  Wide gamut variants (first 3):");
primaryLightScale.accentScaleWideGamut.slice(0, 3).forEach((color: string, index: number) => {
	console.log(`    P3 ${index + 1}: ${color}`);
});

// Show gray scale
console.log("\n  Gray scale (first 3):");
primaryLightScale.grayScale.slice(0, 3).forEach((color: string, index: number) => {
	console.log(`    Gray ${index + 1}: ${color}`);
});

console.log("\n✨ Basic example complete!");
console.log("\nThis example demonstrates:");
console.log("  ✅ Creating color input from simple color objects");
console.log("  ✅ Validating color definitions");
console.log("  ✅ Generating comprehensive color scales");
console.log("  ✅ Accessing specific color scales and variants");
console.log("  ✅ Alpha channels, wide gamut, and gray scale support");

console.log("\n💡 Next steps:");
console.log("  - Run css-only.ts to see CSS generation");
console.log("  - Run json-only.ts to see JSON generation");
console.log("  - Run advanced.ts for more complex usage");
