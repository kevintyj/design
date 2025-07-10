#!/usr/bin/env bun

import { existsSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
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
					outputDir: cssOutputDir,
					...generationConfig,
					...config.cssConfig,
				};

				const cssFiles = generateCSSFiles(colorSystem, cssConfig);
				generatedFiles.push(...cssFiles);

				if (config.verbose) {
					outputSpinner.text = `Generated CSS files: ${cssFiles.length}`;
				}
			}

			if (format === "json" || format === "all") {
				const jsonOutputDir = config.organizeFolders ? join(config.outputDir, "json") : config.outputDir;
				const jsonConfig: JSONGenerationConfig = {
					outputDir: jsonOutputDir,
					...generationConfig,
					...config.jsonConfig,
				};

				const jsonFiles = generateJSONFiles(colorSystem, jsonConfig);
				generatedFiles.push(...jsonFiles);

				if (config.verbose) {
					outputSpinner.text = `Generated JSON files: ${jsonFiles.length}`;
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

// Handle unknown commands
program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	console.log("Run --help to see available commands");
	process.exit(1);
});

// Parse CLI arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
	program.outputHelp();
}
