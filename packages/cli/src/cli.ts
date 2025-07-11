#!/usr/bin/env bun

import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
	type ColorInput,
	type GenerationConfig,
	generateColorSystem,
	loadColorDefinitions,
	validateColorInput,
} from "@design/color-generation-core";
import { type CSSGenerationConfig, generateCSSFiles } from "@design/color-generation-css";
import { generateJSONFiles, type JSONGenerationConfig } from "@design/color-generation-json";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";

const program = new Command();

// CLI Configuration Types
interface CLIConfig {
	input: string;
	outputDir: string;
	formats: ("css" | "json" | "all")[];
	includeAlpha: boolean;
	includeWideGamut: boolean;
	includeGrayScale: boolean;
	includeOverlays: boolean;
	cssConfig?: Partial<CSSGenerationConfig>;
	jsonConfig?: Partial<JSONGenerationConfig>;
	verbose: boolean;
	watch?: boolean;
	organizeFolders?: boolean;
	formatFiles?: boolean;
	cleanOutput?: boolean;
	forceClean?: boolean;
	collectionName?: string;
}

// Figma-specific configuration
interface FigmaConfig {
	input: string;
	output: string;
	collectionName: string;
	verbose: boolean;
}

// Default configuration
const defaultConfig: CLIConfig = {
	input: "colors.ts",
	outputDir: "./output",
	formats: ["all"],
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	includeOverlays: true,
	verbose: false,
	organizeFolders: true,
	formatFiles: true,
	cleanOutput: true,
	forceClean: false,
	collectionName: "Astell Color System",
};

// Default Figma configuration
const defaultFigmaConfig: FigmaConfig = {
	input: "colors.ts",
	output: "./output/figma-colors.json",
	collectionName: "Design System Colors",
	verbose: false,
};

/**
 * Prompt user for confirmation
 */
async function promptUser(message: string): Promise<boolean> {
	console.log(chalk.yellow(`\n⚠️  ${message}`));
	console.log(chalk.gray("Press 'y' to continue, 'n' to cancel, or Ctrl+C to exit."));

	process.stdout.write(chalk.cyan("Continue? (y/n): "));

	return new Promise((resolve) => {
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding("utf8");

		const onData = (key: string) => {
			process.stdin.setRawMode(false);
			process.stdin.pause();
			process.stdin.removeListener("data", onData);

			if (key.toLowerCase() === "y") {
				console.log(chalk.green("y"));
				resolve(true);
			} else if (key.toLowerCase() === "n") {
				console.log(chalk.red("n"));
				resolve(false);
			} else if (key === "\u0003") {
				// Ctrl+C
				console.log(chalk.red("\n\nCanceled by user"));
				process.exit(0);
			} else {
				console.log(chalk.red(`\nInvalid input. Please press 'y' or 'n'.`));
				resolve(false);
			}
		};

		process.stdin.on("data", onData);
	});
}

/**
 * Clean output directory with user confirmation
 */
async function cleanOutputDirectory(
	outputDir: string,
	forceClean: boolean = false,
	verbose: boolean = false,
): Promise<void> {
	if (!existsSync(outputDir)) {
		if (verbose) {
			console.log(chalk.gray(`Output directory doesn't exist: ${outputDir}`));
		}
		return;
	}

	const stats = statSync(outputDir);
	if (!stats.isDirectory()) {
		if (verbose) {
			console.log(chalk.gray(`Output path is not a directory: ${outputDir}`));
		}
		return;
	}

	// Check if directory has any files
	const files = await Bun.file(outputDir)
		.text()
		.catch(() => null);
	if (files === null) {
		// Directory might be empty or we can't read it, let's try to proceed
		if (verbose) {
			console.log(chalk.gray(`Checking directory contents: ${outputDir}`));
		}
	}

	if (!forceClean) {
		const confirmed = await promptUser(`This will remove the existing output directory: ${outputDir}`);
		if (!confirmed) {
			console.log(chalk.yellow("Operation canceled. Existing files will remain."));
			process.exit(0);
		}
	}

	const cleanSpinner = ora("Cleaning output directory...").start();

	try {
		rmSync(outputDir, { recursive: true, force: true });
		cleanSpinner.succeed(`Cleaned output directory: ${outputDir}`);
	} catch (error) {
		cleanSpinner.fail(`Failed to clean output directory: ${error instanceof Error ? error.message : String(error)}`);
		throw error;
	}
}

/**
 * Format generated files using Biome
 */
async function formatFiles(files: string[], verbose: boolean = false): Promise<void> {
	if (files.length === 0) return;

	const formatSpinner = ora("Formatting generated files...").start();

	try {
		// Group files by type for better formatting
		const cssFiles = files.filter((file) => file.endsWith(".css"));
		const jsonFiles = files.filter((file) => file.endsWith(".json"));

		// Format CSS files
		if (cssFiles.length > 0) {
			const cssResult = await Bun.spawn(["bunx", "@biomejs/biome", "format", "--write", ...cssFiles], {
				cwd: process.cwd(),
				stderr: "pipe",
				stdout: "pipe",
			});

			if (cssResult.exitCode !== 0) {
				const errorText = await new Response(cssResult.stderr).text();
				if (verbose) {
					console.warn(chalk.yellow(`CSS formatting warnings: ${errorText}`));
				}
			}
		}

		// Format JSON files
		if (jsonFiles.length > 0) {
			const jsonResult = await Bun.spawn(["bunx", "@biomejs/biome", "format", "--write", ...jsonFiles], {
				cwd: process.cwd(),
				stderr: "pipe",
				stdout: "pipe",
			});

			if (jsonResult.exitCode !== 0) {
				const errorText = await new Response(jsonResult.stderr).text();
				if (verbose) {
					console.warn(chalk.yellow(`JSON formatting warnings: ${errorText}`));
				}
			}
		}

		formatSpinner.succeed(`Formatted ${files.length} files with Biome`);
	} catch (error) {
		formatSpinner.warn(`Could not format files: ${error instanceof Error ? error.message : String(error)}`);
		if (verbose) {
			console.warn(chalk.yellow("Continuing without formatting..."));
		}
	}
}

/**
 * Find color definition file
 */
function findColorFile(inputPath: string): string {
	// If absolute path, use as-is
	if (resolve(inputPath) === inputPath) {
		return inputPath;
	}

	// Try relative to current working directory
	const cwdPath = resolve(process.cwd(), inputPath);
	if (existsSync(cwdPath)) {
		return cwdPath;
	}

	// Try common locations
	const commonPaths = [
		resolve(process.cwd(), "colors.ts"),
		resolve(process.cwd(), "src/colors.ts"),
		resolve(process.cwd(), "config/colors.ts"),
		resolve(process.cwd(), "colors.js"),
		resolve(process.cwd(), "src/colors.js"),
	];

	for (const path of commonPaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	throw new Error(`Color definition file not found: ${inputPath}`);
}

/**
 * Validate file exists and is readable
 */
function validateInputFile(filePath: string): void {
	if (!existsSync(filePath)) {
		throw new Error(`File does not exist: ${filePath}`);
	}

	const stats = statSync(filePath);
	if (!stats.isFile()) {
		throw new Error(`Path is not a file: ${filePath}`);
	}

	// Check file extension
	const validExtensions = [".ts", ".js", ".mjs", ".cjs"];
	const hasValidExtension = validExtensions.some((ext) => filePath.endsWith(ext));

	if (!hasValidExtension) {
		console.warn(
			chalk.yellow(`Warning: File extension may not be supported. Supported: ${validExtensions.join(", ")}`),
		);
	}
}

/**
 * Generate colors with progress indication
 */
async function generateColors(config: CLIConfig): Promise<void> {
	const spinner = ora("Loading color definitions...").start();

	try {
		// Clean output directory if requested
		if (config.cleanOutput) {
			spinner.stop();
			await cleanOutputDirectory(config.outputDir, config.forceClean, config.verbose);
			spinner.start("Loading color definitions...");
		}

		// Find and validate input file
		const inputFile = findColorFile(config.input);
		validateInputFile(inputFile);

		if (config.verbose) {
			spinner.text = `Loading colors from ${inputFile}`;
		}

		// Load color definitions
		const colorInput: ColorInput = await loadColorDefinitions(inputFile);

		// Validate color input
		validateColorInput(colorInput);

		spinner.succeed(`Loaded ${Object.keys(colorInput.light).length} colors from ${inputFile}`);

		// Generate color system
		const generationSpinner = ora("Generating color scales...").start();

		const generationConfig: GenerationConfig = {
			includeAlpha: config.includeAlpha,
			includeWideGamut: config.includeWideGamut,
			includeGrayScale: config.includeGrayScale,
			includeOverlays: config.includeOverlays,
		};

		const colorSystem = generateColorSystem(colorInput, generationConfig);

		generationSpinner.succeed(`Generated ${colorSystem.metadata.totalScales} color scales`);

		// Generate output files
		const outputSpinner = ora("Generating output files...").start();
		const generatedFiles: string[] = [];

		for (const format of config.formats) {
			if (format === "css" || format === "all") {
				const cssOutputDir = config.organizeFolders ? join(config.outputDir, "css") : config.outputDir;
				const cssConfig: CSSGenerationConfig = {
					...generationConfig,
					...config.cssConfig,
				};

				// Ensure CSS output directory exists
				if (!existsSync(cssOutputDir)) {
					mkdirSync(cssOutputDir, { recursive: true });
				}

				// Generate CSS file data (pure function call)
				const cssFileData = generateCSSFiles(colorSystem, cssConfig);

				// Write CSS files and collect paths
				for (const fileData of cssFileData) {
					const filePath = join(cssOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose) {
					outputSpinner.text = `Generated CSS files: ${cssFileData.length}`;
				}
			}

			if (format === "json" || format === "all") {
				const jsonOutputDir = config.organizeFolders ? join(config.outputDir, "json") : config.outputDir;
				const jsonConfig: JSONGenerationConfig = {
					...generationConfig,
					...config.jsonConfig,
				};

				// Ensure JSON output directory exists
				if (!existsSync(jsonOutputDir)) {
					mkdirSync(jsonOutputDir, { recursive: true });
				}

				// Generate JSON file data (pure function call)
				const jsonFileData = generateJSONFiles(colorSystem, jsonConfig);

				// Write JSON files and collect paths
				for (const fileData of jsonFileData) {
					const filePath = join(jsonOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose) {
					outputSpinner.text = `Generated JSON files: ${jsonFileData.length}`;
				}
			}
		}

		outputSpinner.succeed(`Generated ${generatedFiles.length} files in ${config.outputDir}`);

		// Format files if requested
		if (config.formatFiles) {
			await formatFiles(generatedFiles, config.verbose);
		}

		// Show summary
		console.log(chalk.green("\n✨ Color generation complete!\n"));

		console.log(chalk.bold("📊 Summary:"));
		console.log(`  Colors: ${colorSystem.colorNames.join(", ")}`);
		console.log(`  Modes: light, dark`);
		console.log(`  Total scales: ${colorSystem.metadata.totalScales}`);
		console.log(`  Output directory: ${config.outputDir}`);
		console.log(`  Generated files: ${generatedFiles.length}`);

		if (config.verbose) {
			console.log(chalk.bold("\n📁 Generated files:"));
			generatedFiles.forEach((file) => {
				console.log(`  ${file}`);
			});
		}

		console.log(chalk.bold("\n🎨 Features included:"));
		console.log(`  Alpha channels: ${config.includeAlpha ? "✅" : "❌"}`);
		console.log(`  Wide gamut P3: ${config.includeWideGamut ? "✅" : "❌"}`);
		console.log(`  Gray scales: ${config.includeGrayScale ? "✅" : "❌"}`);
		console.log(`  Organized folders: ${config.organizeFolders ? "✅" : "❌"}`);
		console.log(`  Formatted files: ${config.formatFiles ? "✅" : "❌"}`);
		console.log(`  Clean output: ${config.cleanOutput ? "✅" : "❌"}`);
	} catch (error) {
		spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

/**
 * Generate Figma-compatible JSON from color definitions
 */
async function generateFigmaJSON(config: FigmaConfig): Promise<void> {
	const spinner = ora("Generating Figma JSON configuration...").start();

	try {
		// Load color definitions
		const inputFile = findColorFile(config.input);
		validateInputFile(inputFile);

		const colorInput = await loadColorDefinitions(inputFile);
		validateColorInput(colorInput);

		// Resolve output path and ensure directory exists
		const outputPath = resolve(config.output);
		const outputDir = dirname(outputPath);

		// Check if file already exists and prompt user
		const fileExists = existsSync(outputPath);
		if (fileExists) {
			spinner.stop();
			const confirmed = await promptUser(
				`The file already exists: ${outputPath}\nThis will overwrite the existing file.`,
			);
			if (!confirmed) {
				console.log(chalk.yellow("Operation canceled. Existing file will remain unchanged."));
				process.exit(0);
			}
			spinner.start("Generating Figma JSON configuration...");
		}

		// Ensure output directory exists
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
			if (config.verbose) {
				spinner.info(`Created output directory: ${outputDir}`);
				spinner.start("Generating Figma JSON configuration...");
			}
		}

		// Create structure matching colors.ts format
		const figmaConfig = {
			constantsLight: {
				gray: colorInput.constants.light.gray,
				background: colorInput.constants.light.background,
			},
			constantsDark: {
				gray: colorInput.constants.dark.gray,
				background: colorInput.constants.dark.background,
			},
			light: { ...colorInput.light },
			dark: { ...colorInput.dark },
		};

		// Write the JSON file (this will overwrite existing file)
		writeFileSync(outputPath, JSON.stringify(figmaConfig, null, 2), { encoding: "utf8" });

		const actionText = fileExists ? "replaced" : "generated";
		spinner.succeed(`Figma JSON configuration ${actionText}!`);

		if (config.verbose) {
			console.log(chalk.bold("\n📄 Generated file:"));
			console.log(`  ${outputPath}`);
			if (fileExists) {
				console.log(chalk.yellow("  (Previous file was replaced)"));
			}
		}

		console.log(chalk.bold("\n🎨 Configuration details:"));
		console.log(`  Constants: ${Object.keys(colorInput.constants.light).length} per mode`);
		console.log(`  Colors: ${Object.keys(colorInput.light).length} per mode`);
		console.log(`  Modes: Light, Dark`);

		console.log(chalk.bold("\n📋 Usage:"));
		console.log("  1. Import this JSON file into your application");
		console.log("  2. Use the constants and color objects as needed");
		console.log("  3. Structure matches colors.ts export format");
	} catch (error) {
		spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

/**
 * Parse comma-separated formats
 */
function parseFormats(value: string): ("css" | "json" | "all")[] {
	const formats = value.split(",").map((f) => f.trim().toLowerCase());
	const validFormats = ["css", "json", "all"];

	for (const format of formats) {
		if (!validFormats.includes(format)) {
			throw new Error(`Invalid format: ${format}. Valid formats: ${validFormats.join(", ")}`);
		}
	}

	return formats as ("css" | "json" | "all")[];
}

// Configure CLI
program
	.name("design-colors")
	.description("Generate comprehensive color scales from color definitions")
	.version("1.0.0");

// Main generate command
program
	.command("generate")
	.alias("gen")
	.description("Generate color scales from color definitions")
	.option("-i, --input <file>", "Input color definition file", defaultConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultConfig.outputDir)
	.option("-f, --formats <formats>", "Output formats (css,json,all)", parseFormats, defaultConfig.formats)
	.option("--no-alpha", "Exclude alpha channel variants")
	.option("--no-wide-gamut", "Exclude wide gamut P3 variants")
	.option("--no-gray-scale", "Exclude gray scale variants")
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--no-format", "Don't format generated files")
	.option("--no-clean", "Don't remove existing output directory")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.option("--css-prefix <prefix>", "CSS custom property prefix", "--color")
	.option("--css-separate", "Generate separate CSS files for light/dark")
	.option("--css-combined", "Generate combined CSS file")
	.option("--json-format <format>", "JSON format (flat,nested,tokens,tailwind,all)", "all")
	.option("--json-pretty", "Pretty print JSON files")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const config: CLIConfig = {
			input: options.input,
			outputDir: options.output,
			formats: options.formats,
			includeAlpha: options.alpha !== false,
			includeWideGamut: options.wideGamut !== false,
			includeGrayScale: options.grayScale !== false,
			includeOverlays: options.overlays !== false,
			organizeFolders: options.organizeFolders !== false,
			formatFiles: options.format !== false,
			cleanOutput: options.clean !== false,
			forceClean: options.forceClean,
			verbose: options.verbose || false,
			cssConfig: {
				prefix: options.cssPrefix,
				generateSeparateFiles: options.cssSeparate,
				generateCombinedFile: options.cssCombined,
			},
			jsonConfig: {
				format: options.jsonFormat,
				prettyPrint: options.jsonPretty,
			},
		};

		await generateColors(config);
	});

// Quick command for default generation
program
	.command("quick")
	.alias("q")
	.description("Quick generation with default settings")
	.option("-i, --input <file>", "Input color definition file", defaultConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultConfig.outputDir)
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--no-format", "Don't format generated files")
	.option("--no-clean", "Don't remove existing output directory")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.action(async (options: any) => {
		const config: CLIConfig = {
			...defaultConfig,
			input: options.input,
			outputDir: options.output,
			organizeFolders: options.organizeFolders !== false,
			formatFiles: options.format !== false,
			cleanOutput: options.clean !== false, // Clean by default, disabled with --no-clean
			forceClean: options.forceClean,
		};

		await generateColors(config);
	});

// List available colors command
program
	.command("list")
	.alias("ls")
	.description("List colors in a definition file")
	.option("-i, --input <file>", "Input color definition file", defaultConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Loading color definitions...").start();

		try {
			const inputFile = findColorFile(options.input);
			const colorInput = await loadColorDefinitions(inputFile);

			spinner.succeed(`Colors loaded from ${inputFile}`);

			console.log(chalk.bold("\n🎨 Available colors:\n"));

			Object.entries(colorInput.light).forEach(([name, color]) => {
				const darkColor = colorInput.dark[name];
				console.log(`  ${chalk.bold(name)}`);
				console.log(`    Light: ${chalk.hex(color)(`${color} ●`)}`);
				console.log(`    Dark:  ${chalk.hex(darkColor)(`${darkColor} ●`)}`);
				console.log();
			});

			console.log(chalk.bold("📋 Constants:"));
			console.log(
				`  Light gray: ${chalk.hex(colorInput.constants.light.gray)(`${colorInput.constants.light.gray} ●`)}`,
			);
			console.log(
				`  Light background: ${chalk.hex(colorInput.constants.light.background)(`${colorInput.constants.light.background} ●`)}`,
			);
			console.log(`  Dark gray: ${chalk.hex(colorInput.constants.dark.gray)(`${colorInput.constants.dark.gray} ●`)}`);
			console.log(
				`  Dark background: ${chalk.hex(colorInput.constants.dark.background)(`${colorInput.constants.dark.background} ●`)}`,
			);
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

// Validate command
program
	.command("validate")
	.alias("val")
	.description("Validate color definition file")
	.option("-i, --input <file>", "Input color definition file", defaultConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Validating color definitions...").start();

		try {
			const inputFile = findColorFile(options.input);
			const colorInput = await loadColorDefinitions(inputFile);

			validateColorInput(colorInput);

			spinner.succeed("Color definitions are valid!");

			console.log(chalk.green("\n✅ Validation passed!\n"));
			console.log(`  File: ${inputFile}`);
			console.log(`  Colors: ${Object.keys(colorInput.light).length}`);
			console.log(`  All colors have light and dark variants: ✅`);
			console.log(`  Constants defined: ✅`);
		} catch (error) {
			spinner.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

// Figma JSON export command
program
	.command("figma")
	.alias("fig")
	.description("Generate Figma-compatible JSON configuration")
	.option("-i, --input <file>", "Input color definition file", defaultFigmaConfig.input)
	.option("-o, --output <file>", "Output JSON file", defaultFigmaConfig.output)
	.option("-c, --collection <n>", "Collection name in Figma", defaultFigmaConfig.collectionName)
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const config: FigmaConfig = {
			input: options.input,
			output: options.output,
			collectionName: options.collection,
			verbose: options.verbose || false,
		};

		await generateFigmaJSON(config);
	});

// Handle unknown commands
program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	console.log("Run --help to see available commands");
	process.exit(1);
});

// Add a default action to show help when no command is provided
program.action(() => {
	program.outputHelp();
	process.exit(0);
});

// Parse CLI arguments
program.parse();
