#!/usr/bin/env bun

import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// Color generation imports
import {
	type ColorInput,
	type GenerationConfig,
	generateColorSystem,
	loadColorDefinitions,
	validateColorInput,
} from "@design/color-generation-core";
import { type CSSGenerationConfig, generateCSSFiles } from "@design/color-generation-css";
import { generateJSONFiles, type JSONGenerationConfig } from "@design/color-generation-json";

// Spacing generation imports
import {
	generateSpacingSystem,
	loadSpacingDefinitions,
	type SpacingGenerationConfig,
	type SpacingInput,
	validateSpacingInput,
} from "@design/spacing-generation-core";
import {
	type CSSSpacingGenerationConfig,
	generateCSSFiles as generateSpacingCSSFiles,
} from "@design/spacing-generation-css";
import {
	generateJSONFiles as generateSpacingJSONFiles,
	type JSONSpacingGenerationConfig,
	reorderSpacingOutput,
} from "@design/spacing-generation-json";

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";

const program = new Command();

// Configuration Types
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
	organizeFolders?: boolean;
	formatFiles?: boolean;
	cleanOutput?: boolean;
	forceClean?: boolean;
}

interface SpacingCLIConfig {
	input: string;
	outputDir: string;
	formats: ("css" | "json" | "all")[];
	includeRem: boolean;
	generateUtilityClasses: boolean;
	includeNegative: boolean;
	cssConfig?: Partial<CSSSpacingGenerationConfig>;
	jsonConfig?: Partial<JSONSpacingGenerationConfig>;
	verbose: boolean;
	organizeFolders?: boolean;
	formatFiles?: boolean;
	cleanOutput?: boolean;
	forceClean?: boolean;
}

interface SystemCLIConfig {
	input: string;
	outputDir: string;
	formats: ("css" | "json" | "all")[];
	// Color options
	includeAlpha: boolean;
	includeWideGamut: boolean;
	includeGrayScale: boolean;
	includeOverlays: boolean;
	// Spacing options
	includeRem: boolean;
	generateUtilityClasses: boolean;
	includeNegative: boolean;
	verbose: boolean;
	organizeFolders?: boolean;
	formatFiles?: boolean;
	cleanOutput?: boolean;
	forceClean?: boolean;
}

interface FigmaConfig {
	input: string;
	output: string;
	collectionName: string;
	verbose: boolean;
}

// Default configurations
const defaultConfig: CLIConfig = {
	input: "base.ts",
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
};

const defaultSpacingConfig: SpacingCLIConfig = {
	input: "base.ts",
	outputDir: "./output",
	formats: ["all"],
	includeRem: true,
	generateUtilityClasses: true,
	includeNegative: false,
	verbose: false,
	organizeFolders: true,
	formatFiles: true,
	cleanOutput: true,
	forceClean: false,
};

const defaultSystemConfig: SystemCLIConfig = {
	input: "base.ts",
	outputDir: "./output",
	formats: ["all"],
	includeAlpha: true,
	includeWideGamut: true,
	includeGrayScale: true,
	includeOverlays: true,
	includeRem: true,
	generateUtilityClasses: true,
	includeNegative: false,
	verbose: false,
	organizeFolders: true,
	formatFiles: true,
	cleanOutput: true,
	forceClean: false,
};

const defaultFigmaConfig: FigmaConfig = {
	input: "base.ts",
	output: "./output/figma/figma-colors.json",
	collectionName: "Design System Colors",
	verbose: false,
};

// Helper Functions
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

async function cleanOutputDirectory(
	outputDir: string,
	forceClean: boolean = false,
	verbose: boolean = false,
): Promise<void> {
	if (!existsSync(outputDir)) {
		if (verbose) console.log(chalk.gray(`Output directory doesn't exist: ${outputDir}`));
		return;
	}

	const stats = statSync(outputDir);
	if (!stats.isDirectory()) {
		if (verbose) console.log(chalk.gray(`Output path is not a directory: ${outputDir}`));
		return;
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

async function formatFiles(files: string[], verbose: boolean = false): Promise<void> {
	if (files.length === 0) return;

	const formatSpinner = ora("Formatting generated files...").start();
	try {
		const cssFiles = files.filter((file) => file.endsWith(".css"));
		const jsonFiles = files.filter((file) => file.endsWith(".json"));

		if (cssFiles.length > 0) {
			await Bun.spawn(["bunx", "@biomejs/biome", "format", "--write", ...cssFiles], {
				cwd: process.cwd(),
				stderr: "pipe",
				stdout: "pipe",
			});
		}

		if (jsonFiles.length > 0) {
			await Bun.spawn(["bunx", "@biomejs/biome", "format", "--write", ...jsonFiles], {
				cwd: process.cwd(),
				stderr: "pipe",
				stdout: "pipe",
			});
		}

		formatSpinner.succeed(`Formatted ${files.length} files with Biome`);
	} catch (error) {
		formatSpinner.warn(`Could not format files: ${error instanceof Error ? error.message : String(error)}`);
		if (verbose) console.warn(chalk.yellow("Continuing without formatting..."));
	}
}

function findDefinitionFile(inputPath: string): string {
	if (resolve(inputPath) === inputPath) return inputPath;

	const cwdPath = resolve(process.cwd(), inputPath);
	if (existsSync(cwdPath)) return cwdPath;

	const possiblePaths = [
		resolve(process.cwd(), "base.ts"),
		resolve(process.cwd(), "colors.ts"),
		resolve(process.cwd(), "definitions.ts"),
	];

	for (const path of possiblePaths) {
		if (existsSync(path)) return path;
	}

	throw new Error(`Definition file not found: ${inputPath}. Tried: ${possiblePaths.join(", ")}`);
}

function validateInputFile(filePath: string): void {
	if (!existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const stats = statSync(filePath);
	if (!stats.isFile()) {
		throw new Error(`Path is not a file: ${filePath}`);
	}

	if (!filePath.endsWith(".ts") && !filePath.endsWith(".js")) {
		throw new Error(`File must be a TypeScript (.ts) or JavaScript (.js) file: ${filePath}`);
	}
}

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

// Generation Functions
async function generateColors(config: CLIConfig): Promise<void> {
	const spinner = ora("Loading color definitions...").start();

	try {
		if (config.cleanOutput) {
			spinner.stop();
			await cleanOutputDirectory(config.outputDir, config.forceClean, config.verbose);
			spinner.start("Loading color definitions...");
		}

		const inputFile = findDefinitionFile(config.input);
		validateInputFile(inputFile);

		if (config.verbose) spinner.text = `Loading colors from ${inputFile}`;

		const colorInput: ColorInput = await loadColorDefinitions(inputFile);
		validateColorInput(colorInput);

		spinner.succeed(`Loaded ${Object.keys(colorInput.light).length} colors from ${inputFile}`);

		const generationSpinner = ora("Generating color scales...").start();
		const generationConfig: GenerationConfig = {
			includeAlpha: config.includeAlpha,
			includeWideGamut: config.includeWideGamut,
			includeGrayScale: config.includeGrayScale,
			includeOverlays: config.includeOverlays,
		};

		const colorSystem = generateColorSystem(colorInput, generationConfig);
		generationSpinner.succeed(`Generated ${colorSystem.metadata.totalScales} color scales`);

		const outputSpinner = ora("Generating output files...").start();
		const generatedFiles: string[] = [];

		for (const format of config.formats) {
			if (format === "css" || format === "all") {
				const cssOutputDir = config.organizeFolders ? join(config.outputDir, "css", "colors") : config.outputDir;
				const cssConfig: CSSGenerationConfig = { ...generationConfig, ...config.cssConfig };

				if (!existsSync(cssOutputDir)) mkdirSync(cssOutputDir, { recursive: true });

				const cssFileData = generateCSSFiles(colorSystem, cssConfig);
				for (const fileData of cssFileData) {
					const filePath = join(cssOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose) outputSpinner.text = `Generated CSS files: ${cssFileData.length}`;
			}

			if (format === "json" || format === "all") {
				const jsonOutputDir = config.organizeFolders ? join(config.outputDir, "json", "colors") : config.outputDir;
				const jsonConfig: JSONGenerationConfig = { ...generationConfig, ...config.jsonConfig };

				if (!existsSync(jsonOutputDir)) mkdirSync(jsonOutputDir, { recursive: true });

				const jsonFileData = generateJSONFiles(colorSystem, jsonConfig);
				for (const fileData of jsonFileData) {
					const filePath = join(jsonOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose) outputSpinner.text = `Generated JSON files: ${jsonFileData.length}`;
			}
		}

		outputSpinner.succeed(`Generated ${generatedFiles.length} files in ${config.outputDir}`);

		if (config.formatFiles) await formatFiles(generatedFiles, config.verbose);

		console.log(chalk.green("\n✨ Color generation complete!\n"));
		console.log(chalk.bold("📊 Summary:"));
		console.log(`  Colors: ${colorSystem.colorNames.join(", ")}`);
		console.log(`  Total scales: ${colorSystem.metadata.totalScales}`);
		console.log(`  Output directory: ${config.outputDir}`);
		console.log(`  Generated files: ${generatedFiles.length}`);

		if (config.verbose) {
			console.log(chalk.bold("\n📁 Generated files:"));
			generatedFiles.forEach((file) => console.log(`  ${file}`));
		}

		console.log(chalk.bold("\n🎨 Features included:"));
		console.log(`  Alpha channels: ${config.includeAlpha ? "✅" : "❌"}`);
		console.log(`  Wide gamut P3: ${config.includeWideGamut ? "✅" : "❌"}`);
		console.log(`  Gray scales: ${config.includeGrayScale ? "✅" : "❌"}`);
		console.log(`  Organized folders: ${config.organizeFolders ? "✅" : "❌"}`);
	} catch (error) {
		spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

async function generateSpacing(config: SpacingCLIConfig): Promise<void> {
	const spinner = ora("Loading spacing definitions...").start();

	try {
		if (config.cleanOutput) {
			spinner.stop();
			await cleanOutputDirectory(config.outputDir, config.forceClean, config.verbose);
			spinner.start("Loading spacing definitions...");
		}

		const inputFile = findDefinitionFile(config.input);
		validateInputFile(inputFile);

		if (config.verbose) spinner.text = `Loading spacing from ${inputFile}`;

		const spacingInput: SpacingInput = await loadSpacingDefinitions(inputFile);
		validateSpacingInput(spacingInput);

		spinner.succeed(`Loaded ${Object.keys(spacingInput.spacing).length} spacing values from ${inputFile}`);

		const generationSpinner = ora("Generating spacing system...").start();
		const generationConfig: SpacingGenerationConfig = {
			includeRem: config.includeRem,
			remBase: 16,
		};

		const spacingSystem = generateSpacingSystem(spacingInput, generationConfig);
		generationSpinner.succeed(`Generated spacing system with ${spacingSystem.metadata.totalValues} values`);

		const outputSpinner = ora("Generating output files...").start();
		const generatedFiles: string[] = [];

		for (const format of config.formats) {
			if (format === "css" || format === "all") {
				const cssOutputDir = config.organizeFolders ? join(config.outputDir, "css", "spacing") : config.outputDir;
				const cssConfig: CSSSpacingGenerationConfig = {
					variant: "full",
					includeRem: config.includeRem,
					prefix: "--spacing",
					...config.cssConfig,
				};

				if (!existsSync(cssOutputDir)) mkdirSync(cssOutputDir, { recursive: true });

				const cssFileData = generateSpacingCSSFiles(spacingSystem, cssConfig);
				for (const fileData of cssFileData) {
					const filePath = join(cssOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose) outputSpinner.text = `Generated CSS files: ${cssFileData.length}`;
			}

			if (format === "json" || format === "all") {
				const jsonOutputDir = config.organizeFolders ? join(config.outputDir, "json", "spacing") : config.outputDir;
				const jsonConfig: JSONSpacingGenerationConfig = {
					format: "all",
					prettyPrint: true,
					includeRem: config.includeRem,
					...config.jsonConfig,
				};

				if (!existsSync(jsonOutputDir)) mkdirSync(jsonOutputDir, { recursive: true });

				const jsonFileData = generateSpacingJSONFiles(spacingSystem, jsonConfig);
				for (const fileData of jsonFileData) {
					const filePath = join(jsonOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose) outputSpinner.text = `Generated JSON files: ${jsonFileData.length}`;
			}
		}

		outputSpinner.succeed(`Generated ${generatedFiles.length} files in ${config.outputDir}`);

		if (config.formatFiles) await formatFiles(generatedFiles, config.verbose);

		console.log(chalk.green("\n✨ Spacing generation complete!\n"));
		console.log(chalk.bold("📊 Summary:"));
		console.log(`  Spacing values: ${spacingSystem.metadata.totalValues}`);
		console.log(`  Base multiplier: ${spacingSystem.spacing.multiplier}px`);
		console.log(`  Output directory: ${config.outputDir}`);
		console.log(`  Generated files: ${generatedFiles.length}`);

		if (config.verbose) {
			console.log(chalk.bold("\n📁 Generated files:"));
			generatedFiles.forEach((file) => console.log(`  ${file}`));
		}

		console.log(chalk.bold("\n📏 Features included:"));
		console.log(`  REM values: ${config.includeRem ? "✅" : "❌"}`);
		console.log(`  Utility classes: ${config.generateUtilityClasses ? "✅" : "❌"}`);
		console.log(`  Organized folders: ${config.organizeFolders ? "✅" : "❌"}`);
	} catch (error) {
		spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

async function generateSystem(config: SystemCLIConfig): Promise<void> {
	const spinner = ora("Loading design system definitions...").start();

	try {
		if (config.cleanOutput) {
			spinner.stop();
			await cleanOutputDirectory(config.outputDir, config.forceClean, config.verbose);
			spinner.start("Loading design system definitions...");
		}

		const inputFile = findDefinitionFile(config.input);
		validateInputFile(inputFile);

		if (config.verbose) spinner.text = `Loading design system from ${inputFile}`;

		// Load both color and spacing definitions
		const colorInput: ColorInput = await loadColorDefinitions(inputFile);
		const spacingInput: SpacingInput = await loadSpacingDefinitions(inputFile);

		validateColorInput(colorInput);
		validateSpacingInput(spacingInput);

		spinner.succeed(
			`Loaded ${Object.keys(colorInput.light).length} colors and ${Object.keys(spacingInput.spacing).length} spacing values`,
		);

		// Generate both systems
		const generationSpinner = ora("Generating design system...").start();

		const colorGenerationConfig: GenerationConfig = {
			includeAlpha: config.includeAlpha,
			includeWideGamut: config.includeWideGamut,
			includeGrayScale: config.includeGrayScale,
			includeOverlays: config.includeOverlays,
		};

		const spacingGenerationConfig: SpacingGenerationConfig = {
			includeRem: config.includeRem,
			remBase: 16,
		};

		const colorSystem = generateColorSystem(colorInput, colorGenerationConfig);
		const spacingSystem = generateSpacingSystem(spacingInput, spacingGenerationConfig);

		generationSpinner.succeed(
			`Generated complete design system: ${colorSystem.metadata.totalScales} color scales, ${spacingSystem.metadata.totalValues} spacing values`,
		);

		const outputSpinner = ora("Generating output files...").start();
		const generatedFiles: string[] = [];

		for (const format of config.formats) {
			if (format === "css" || format === "all") {
				// Generate colors
				const colorCSSOutputDir = config.organizeFolders ? join(config.outputDir, "css", "colors") : config.outputDir;
				if (!existsSync(colorCSSOutputDir)) mkdirSync(colorCSSOutputDir, { recursive: true });

				const colorCSSConfig: CSSGenerationConfig = colorGenerationConfig;
				const colorCSSFileData = generateCSSFiles(colorSystem, colorCSSConfig);
				for (const fileData of colorCSSFileData) {
					const filePath = join(colorCSSOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				// Generate spacing
				const spacingCSSOutputDir = config.organizeFolders
					? join(config.outputDir, "css", "spacing")
					: config.outputDir;
				if (!existsSync(spacingCSSOutputDir)) mkdirSync(spacingCSSOutputDir, { recursive: true });

				const spacingCSSConfig: CSSSpacingGenerationConfig = {
					variant: "full",
					includeRem: config.includeRem,
					prefix: "--spacing",
				};
				const spacingCSSFileData = generateSpacingCSSFiles(spacingSystem, spacingCSSConfig);
				for (const fileData of spacingCSSFileData) {
					const filePath = join(spacingCSSOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose)
					outputSpinner.text = `Generated CSS files: ${colorCSSFileData.length + spacingCSSFileData.length}`;
			}

			if (format === "json" || format === "all") {
				// Generate colors
				const colorJSONOutputDir = config.organizeFolders ? join(config.outputDir, "json", "colors") : config.outputDir;
				if (!existsSync(colorJSONOutputDir)) mkdirSync(colorJSONOutputDir, { recursive: true });

				const colorJSONConfig: JSONGenerationConfig = colorGenerationConfig;
				const colorJSONFileData = generateJSONFiles(colorSystem, colorJSONConfig);
				for (const fileData of colorJSONFileData) {
					const filePath = join(colorJSONOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				// Generate spacing
				const spacingJSONOutputDir = config.organizeFolders
					? join(config.outputDir, "json", "spacing")
					: config.outputDir;
				if (!existsSync(spacingJSONOutputDir)) mkdirSync(spacingJSONOutputDir, { recursive: true });

				const spacingJSONConfig: JSONSpacingGenerationConfig = {
					format: "all",
					prettyPrint: true,
					includeRem: config.includeRem,
				};
				const spacingJSONFileData = generateSpacingJSONFiles(spacingSystem, spacingJSONConfig);
				for (const fileData of spacingJSONFileData) {
					const filePath = join(spacingJSONOutputDir, fileData.name);
					writeFileSync(filePath, fileData.content);
					generatedFiles.push(filePath);
				}

				if (config.verbose)
					outputSpinner.text = `Generated JSON files: ${colorJSONFileData.length + spacingJSONFileData.length}`;
			}
		}

		outputSpinner.succeed(`Generated ${generatedFiles.length} files in ${config.outputDir}`);

		if (config.formatFiles) await formatFiles(generatedFiles, config.verbose);

		console.log(chalk.green("\n✨ Design system generation complete!\n"));
		console.log(chalk.bold("📊 Summary:"));
		console.log(`  Colors: ${colorSystem.colorNames.join(", ")}`);
		console.log(`  Color scales: ${colorSystem.metadata.totalScales}`);
		console.log(`  Spacing values: ${spacingSystem.metadata.totalValues}`);
		console.log(`  Base multiplier: ${spacingSystem.spacing.multiplier}px`);
		console.log(`  Output directory: ${config.outputDir}`);
		console.log(`  Generated files: ${generatedFiles.length}`);

		if (config.verbose) {
			console.log(chalk.bold("\n📁 Generated files:"));
			generatedFiles.forEach((file) => console.log(`  ${file}`));
		}

		console.log(chalk.bold("\n🎨 Color features included:"));
		console.log(`  Alpha channels: ${config.includeAlpha ? "✅" : "❌"}`);
		console.log(`  Wide gamut P3: ${config.includeWideGamut ? "✅" : "❌"}`);
		console.log(`  Gray scales: ${config.includeGrayScale ? "✅" : "❌"}`);

		console.log(chalk.bold("\n📏 Spacing features included:"));
		console.log(`  REM values: ${config.includeRem ? "✅" : "❌"}`);
		console.log(`  Utility classes: ${config.generateUtilityClasses ? "✅" : "❌"}`);
		console.log(`  Organized folders: ${config.organizeFolders ? "✅" : "❌"}`);
	} catch (error) {
		spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

// Configure CLI
program
	.name("design-system")
	.description("Generate comprehensive design systems with colors and spacing")
	.version("1.0.0");

// Color Commands
const colorProgram = program.command("colors").alias("color").description("Color generation commands");

colorProgram
	.command("generate")
	.alias("gen")
	.description("Generate color scales from definitions")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
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
			cssConfig: { prefix: options.cssPrefix },
			jsonConfig: { format: options.jsonFormat, prettyPrint: options.jsonPretty },
		};
		await generateColors(config);
	});

colorProgram
	.command("quick")
	.alias("q")
	.description("Quick color generation with default settings")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultConfig.outputDir)
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.action(async (options: any) => {
		const config: CLIConfig = {
			...defaultConfig,
			input: options.input,
			outputDir: options.output,
			organizeFolders: options.organizeFolders !== false,
			forceClean: options.forceClean,
		};
		await generateColors(config);
	});

colorProgram
	.command("list")
	.alias("ls")
	.description("List colors in a definition file")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Loading color definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
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

colorProgram
	.command("validate")
	.alias("val")
	.description("Validate color definition file")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Validating color definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
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

colorProgram
	.command("figma")
	.alias("fig")
	.description("Generate simple Figma plugin configuration for colors")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.option("-o, --output <file>", "Output JSON file", "./output/figma/colors-figma.json")
	.option("-c, --collection <name>", "Collection name", "Generated Colors")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const spinner = ora("Generating Figma colors configuration...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
			const colorInput = await loadColorDefinitions(inputFile);
			validateColorInput(colorInput);

			// Generate simple config format for Figma plugin
			const figmaConfig = {
				constantsLight: colorInput.constants.light,
				constantsDark: colorInput.constants.dark,
				light: colorInput.light,
				dark: colorInput.dark,
			};

			const outputPath = resolve(options.output);
			const outputDir = dirname(outputPath);

			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
			}

			writeFileSync(outputPath, JSON.stringify(figmaConfig, null, 2));
			spinner.succeed(`Figma colors configuration generated: ${outputPath}`);

			if (options.verbose) {
				console.log(chalk.bold("\n📄 Generated file:"));
				console.log(`  ${outputPath}`);
				console.log(chalk.bold("\n🎨 Configuration details:"));
				console.log(`  Constants: ${Object.keys(colorInput.constants.light).length} per mode`);
				console.log(`  Colors: ${Object.keys(colorInput.light).length} per mode`);
				console.log(`  Modes: Light, Dark`);
			}
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

colorProgram
	.command("all")
	.description("Generate both quick and figma outputs for colors")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultConfig.outputDir)
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		console.log(chalk.bold("🎨 Generating all color outputs...\n"));

		// Quick generation
		console.log(chalk.blue("1. Running quick generation..."));
		const quickConfig: CLIConfig = {
			...defaultConfig,
			input: options.input,
			outputDir: options.output,
			verbose: options.verbose || false,
		};
		await generateColors(quickConfig);

		// Figma generation
		console.log(chalk.blue("\n2. Running figma generation..."));
		const figmaOutputPath = join(options.output, "figma", "colors-figma.json");

		const spinner = ora("Generating Figma colors configuration...").start();
		try {
			const inputFile = findDefinitionFile(options.input);
			const colorInput = await loadColorDefinitions(inputFile);

			// Generate simple config format for Figma plugin
			const figmaConfig = {
				constantsLight: colorInput.constants.light,
				constantsDark: colorInput.constants.dark,
				light: colorInput.light,
				dark: colorInput.dark,
			};

			const outputDir = dirname(figmaOutputPath);
			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
			}

			writeFileSync(figmaOutputPath, JSON.stringify(figmaConfig, null, 2));
			spinner.succeed(`Figma colors configuration generated: ${figmaOutputPath}`);
		} catch (error) {
			spinner.fail(`Figma generation failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		console.log(chalk.green("\n✨ All color outputs generated!\n"));
	});

// Spacing Commands
const spacingProgram = program.command("spacing").description("Spacing generation commands");

spacingProgram
	.command("generate")
	.alias("gen")
	.description("Generate spacing system from definitions")
	.option("-i, --input <file>", "Input definition file", defaultSpacingConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultSpacingConfig.outputDir)
	.option("-f, --formats <formats>", "Output formats (css,json,all)", parseFormats, defaultSpacingConfig.formats)
	.option("--no-rem", "Exclude REM values")
	.option("--no-utility-classes", "Don't generate utility classes")
	.option("--include-negative", "Include negative margins")
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--no-format", "Don't format generated files")
	.option("--no-clean", "Don't remove existing output directory")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.option("--css-prefix <prefix>", "CSS custom property prefix", "--spacing")
	.option("--json-format <format>", "JSON format (flat,nested,tokens,tailwind,all)", "all")
	.option("--json-pretty", "Pretty print JSON files")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const config: SpacingCLIConfig = {
			input: options.input,
			outputDir: options.output,
			formats: options.formats,
			includeRem: options.rem !== false,
			generateUtilityClasses: options.utilityClasses !== false,
			includeNegative: options.includeNegative || false,
			organizeFolders: options.organizeFolders !== false,
			formatFiles: options.format !== false,
			cleanOutput: options.clean !== false,
			forceClean: options.forceClean,
			verbose: options.verbose || false,
			cssConfig: { prefix: options.cssPrefix },
			jsonConfig: { format: options.jsonFormat, prettyPrint: options.jsonPretty },
		};
		await generateSpacing(config);
	});

spacingProgram
	.command("quick")
	.alias("q")
	.description("Quick spacing generation with default settings")
	.option("-i, --input <file>", "Input definition file", defaultSpacingConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultSpacingConfig.outputDir)
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.action(async (options: any) => {
		const config: SpacingCLIConfig = {
			...defaultSpacingConfig,
			input: options.input,
			outputDir: options.output,
			organizeFolders: options.organizeFolders !== false,
			forceClean: options.forceClean,
		};
		await generateSpacing(config);
	});

spacingProgram
	.command("list")
	.alias("ls")
	.description("List spacing values in a definition file")
	.option("-i, --input <file>", "Input definition file", defaultSpacingConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Loading spacing definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
			const spacingInput = await loadSpacingDefinitions(inputFile);

			spinner.succeed(`Spacing loaded from ${inputFile}`);

			console.log(chalk.bold("\n📏 Available spacing values:\n"));

			Object.entries(spacingInput.spacing).forEach(([name, value]) => {
				const remValue = (Number(value) / 16).toFixed(4).replace(/\.?0+$/, "");
				console.log(`  ${chalk.bold(name)}: ${value}px (${remValue}rem)`);
			});

			console.log(chalk.bold(`\n📐 Base multiplier: ${spacingInput.multiplier}px`));
			console.log(`Total values: ${Object.keys(spacingInput.spacing).length}`);
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

spacingProgram
	.command("validate")
	.alias("val")
	.description("Validate spacing definition file")
	.option("-i, --input <file>", "Input definition file", defaultSpacingConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Validating spacing definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
			const spacingInput = await loadSpacingDefinitions(inputFile);

			validateSpacingInput(spacingInput);

			spinner.succeed("Spacing definitions are valid!");

			console.log(chalk.green("\n✅ Validation passed!\n"));
			console.log(`  File: ${inputFile}`);
			console.log(`  Spacing values: ${Object.keys(spacingInput.spacing).length}`);
			console.log(`  Base multiplier: ${spacingInput.multiplier}px`);
			console.log(`  All values are valid numbers: ✅`);
		} catch (error) {
			spinner.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

spacingProgram
	.command("figma")
	.alias("fig")
	.description("Generate simple Figma plugin configuration for spacing")
	.option("-i, --input <file>", "Input definition file", defaultSpacingConfig.input)
	.option("-o, --output <file>", "Output JSON file", "./output/figma/spacing-figma.json")
	.option("-c, --collection <name>", "Collection name", "Generated Spacing")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const spinner = ora("Generating Figma spacing configuration...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
			const spacingInput = await loadSpacingDefinitions(inputFile);
			validateSpacingInput(spacingInput);

			// Generate simple config format for Figma plugin with sorted spacing
			const sortedSpacing = reorderSpacingOutput(spacingInput.spacing, spacingInput.spacing);

			const figmaConfig = {
				spacingMultiplier: spacingInput.multiplier,
				remValue: (spacingInput as any).remValue || 16,
				spacing: sortedSpacing,
			};

			const outputPath = resolve(options.output);
			const outputDir = dirname(outputPath);

			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
			}

			writeFileSync(outputPath, JSON.stringify(figmaConfig, null, 2));
			spinner.succeed(`Figma spacing configuration generated: ${outputPath}`);

			if (options.verbose) {
				console.log(chalk.bold("\n📄 Generated file:"));
				console.log(`  ${outputPath}`);
				console.log(chalk.bold("\n📏 Configuration details:"));
				console.log(`  Spacing values: ${Object.keys(spacingInput.spacing).length}`);
				console.log(`  Base multiplier: ${spacingInput.multiplier}px`);
				console.log(`  REM base: ${(spacingInput as any).remValue || 16}px`);
			}
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

spacingProgram
	.command("all")
	.description("Generate both quick and figma outputs for spacing")
	.option("-i, --input <file>", "Input definition file", defaultSpacingConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultSpacingConfig.outputDir)
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		console.log(chalk.bold("📏 Generating all spacing outputs...\n"));

		// Quick generation
		console.log(chalk.blue("1. Running quick generation..."));
		const quickConfig: SpacingCLIConfig = {
			...defaultSpacingConfig,
			input: options.input,
			outputDir: options.output,
			verbose: options.verbose || false,
		};
		await generateSpacing(quickConfig);

		// Figma generation
		console.log(chalk.blue("\n2. Running figma generation..."));
		const figmaOutputPath = join(options.output, "figma", "spacing-figma.json");

		const spinner = ora("Generating Figma spacing configuration...").start();
		try {
			const inputFile = findDefinitionFile(options.input);
			const spacingInput = await loadSpacingDefinitions(inputFile);

			// Generate simple config format for Figma plugin with sorted spacing
			const sortedSpacing = reorderSpacingOutput(spacingInput.spacing, spacingInput.spacing);

			const figmaConfig = {
				spacingMultiplier: spacingInput.multiplier,
				remValue: (spacingInput as any).remValue || 16,
				spacing: sortedSpacing,
			};

			const outputDir = dirname(figmaOutputPath);
			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
			}

			writeFileSync(figmaOutputPath, JSON.stringify(figmaConfig, null, 2));
			spinner.succeed(`Figma spacing configuration generated: ${figmaOutputPath}`);
		} catch (error) {
			spinner.fail(`Figma generation failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		console.log(chalk.green("\n✨ All spacing outputs generated!\n"));
	});

// System Commands
const systemProgram = program.command("system").description("Complete design system generation commands");

systemProgram
	.command("generate")
	.alias("gen")
	.description("Generate complete design system (colors + spacing)")
	.option("-i, --input <file>", "Input definition file", defaultSystemConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultSystemConfig.outputDir)
	.option("-f, --formats <formats>", "Output formats (css,json,all)", parseFormats, defaultSystemConfig.formats)
	.option("--no-alpha", "Exclude alpha channel variants")
	.option("--no-wide-gamut", "Exclude wide gamut P3 variants")
	.option("--no-gray-scale", "Exclude gray scale variants")
	.option("--no-rem", "Exclude REM values")
	.option("--no-utility-classes", "Don't generate utility classes")
	.option("--include-negative", "Include negative margins")
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--no-format", "Don't format generated files")
	.option("--no-clean", "Don't remove existing output directory")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const config: SystemCLIConfig = {
			input: options.input,
			outputDir: options.output,
			formats: options.formats,
			includeAlpha: options.alpha !== false,
			includeWideGamut: options.wideGamut !== false,
			includeGrayScale: options.grayScale !== false,
			includeOverlays: options.overlays !== false,
			includeRem: options.rem !== false,
			generateUtilityClasses: options.utilityClasses !== false,
			includeNegative: options.includeNegative || false,
			organizeFolders: options.organizeFolders !== false,
			formatFiles: options.format !== false,
			cleanOutput: options.clean !== false,
			forceClean: options.forceClean,
			verbose: options.verbose || false,
		};
		await generateSystem(config);
	});

systemProgram
	.command("quick")
	.alias("q")
	.description("Quick design system generation with default settings")
	.option("-i, --input <file>", "Input definition file", defaultSystemConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultSystemConfig.outputDir)
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.action(async (options: any) => {
		const config: SystemCLIConfig = {
			...defaultSystemConfig,
			input: options.input,
			outputDir: options.output,
			organizeFolders: options.organizeFolders !== false,
			forceClean: options.forceClean,
		};
		await generateSystem(config);
	});

systemProgram
	.command("validate")
	.alias("val")
	.description("Validate both color and spacing definitions")
	.option("-i, --input <file>", "Input definition file", defaultSystemConfig.input)
	.action(async (options: any) => {
		const spinner = ora("Validating design system definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);

			const colorInput = await loadColorDefinitions(inputFile);
			const spacingInput = await loadSpacingDefinitions(inputFile);

			validateColorInput(colorInput);
			validateSpacingInput(spacingInput);

			spinner.succeed("Design system definitions are valid!");

			console.log(chalk.green("\n✅ Validation passed!\n"));
			console.log(`  File: ${inputFile}`);
			console.log(`  Colors: ${Object.keys(colorInput.light).length} ✅`);
			console.log(`  Spacing values: ${Object.keys(spacingInput.spacing).length} ✅`);
			console.log(`  Base multiplier: ${spacingInput.multiplier}px ✅`);
			console.log(`  All definitions are valid: ✅`);
		} catch (error) {
			spinner.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

systemProgram
	.command("figma")
	.alias("fig")
	.description("Generate simple Figma plugin configurations for complete design system")
	.option("-i, --input <file>", "Input definition file", defaultSystemConfig.input)
	.option("-o, --output <dir>", "Output directory", "./output/figma")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const spinner = ora("Generating Figma design system configurations...").start();

		try {
			const inputFile = findDefinitionFile(options.input);

			const colorInput = await loadColorDefinitions(inputFile);
			const spacingInput = await loadSpacingDefinitions(inputFile);

			validateColorInput(colorInput);
			validateSpacingInput(spacingInput);

			const outputDir = resolve(options.output);
			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
			}

			// Generate colors configuration
			const colorsFigmaConfig = {
				constantsLight: colorInput.constants.light,
				constantsDark: colorInput.constants.dark,
				light: colorInput.light,
				dark: colorInput.dark,
			};

			const colorsOutputPath = join(outputDir, "colors-figma.json");
			writeFileSync(colorsOutputPath, JSON.stringify(colorsFigmaConfig, null, 2));

			// Generate spacing configuration with sorted spacing
			const sortedSpacing = reorderSpacingOutput(spacingInput.spacing, spacingInput.spacing);

			const spacingFigmaConfig = {
				spacingMultiplier: spacingInput.multiplier,
				remValue: (spacingInput as any).remValue || 16,
				spacing: sortedSpacing,
			};

			const spacingOutputPath = join(outputDir, "spacing-figma.json");
			writeFileSync(spacingOutputPath, JSON.stringify(spacingFigmaConfig, null, 2));

			spinner.succeed(`Figma design system configurations generated in: ${outputDir}`);

			if (options.verbose) {
				console.log(chalk.bold("\n📄 Generated files:"));
				console.log(`  ${colorsOutputPath}`);
				console.log(`  ${spacingOutputPath}`);
				console.log(chalk.bold("\n🎨 System details:"));
				console.log(`  Constants: ${Object.keys(colorInput.constants.light).length} per mode`);
				console.log(`  Colors: ${Object.keys(colorInput.light).length} per mode`);
				console.log(`  Spacing values: ${Object.keys(spacingInput.spacing).length}`);
				console.log(`  Base multiplier: ${spacingInput.multiplier}px`);
			}
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

systemProgram
	.command("all")
	.description("Generate both quick and figma outputs for complete design system")
	.option("-i, --input <file>", "Input definition file", defaultSystemConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultSystemConfig.outputDir)
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		console.log(chalk.bold("🔧 Generating all design system outputs...\n"));

		// Quick generation
		console.log(chalk.blue("1. Running quick generation..."));
		const quickConfig: SystemCLIConfig = {
			...defaultSystemConfig,
			input: options.input,
			outputDir: options.output,
			verbose: options.verbose || false,
		};
		await generateSystem(quickConfig);

		// Figma generation
		console.log(chalk.blue("\n2. Running figma generation..."));
		const figmaOutputDir = join(options.output, "figma");

		const spinner = ora("Generating Figma design system configurations...").start();
		try {
			const inputFile = findDefinitionFile(options.input);
			const colorInput = await loadColorDefinitions(inputFile);
			const spacingInput = await loadSpacingDefinitions(inputFile);

			if (!existsSync(figmaOutputDir)) {
				mkdirSync(figmaOutputDir, { recursive: true });
			}

			// Generate colors configuration
			const colorsFigmaConfig = {
				constantsLight: colorInput.constants.light,
				constantsDark: colorInput.constants.dark,
				light: colorInput.light,
				dark: colorInput.dark,
			};

			writeFileSync(join(figmaOutputDir, "colors-figma.json"), JSON.stringify(colorsFigmaConfig, null, 2));

			// Generate spacing configuration with sorted spacing
			const sortedSpacing = reorderSpacingOutput(spacingInput.spacing, spacingInput.spacing);

			const spacingFigmaConfig = {
				spacingMultiplier: spacingInput.multiplier,
				remValue: (spacingInput as any).remValue || 16,
				spacing: sortedSpacing,
			};

			writeFileSync(join(figmaOutputDir, "spacing-figma.json"), JSON.stringify(spacingFigmaConfig, null, 2));

			spinner.succeed(`Figma design system configurations generated in: ${figmaOutputDir}`);
		} catch (error) {
			spinner.fail(`Figma generation failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		console.log(chalk.green("\n✨ All design system outputs generated!\n"));
	});

// Legacy color commands (for backwards compatibility)
program
	.command("generate")
	.alias("gen")
	.description("Generate color scales (legacy command - use 'colors generate')")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
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
	.option("--json-format <format>", "JSON format (flat,nested,tokens,tailwind,all)", "all")
	.option("--json-pretty", "Pretty print JSON files")
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		console.log(chalk.yellow("Note: Using legacy command. Consider using 'colors generate' instead."));
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
			cssConfig: { prefix: options.cssPrefix },
			jsonConfig: { format: options.jsonFormat, prettyPrint: options.jsonPretty },
		};
		await generateColors(config);
	});

program
	.command("quick")
	.alias("q")
	.description("Quick generation (legacy command - use 'colors quick')")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.option("-o, --output <dir>", "Output directory", defaultConfig.outputDir)
	.option("--no-organize-folders", "Don't organize outputs into subfolders")
	.option("--force-clean", "Remove existing output directory without confirmation")
	.action(async (options: any) => {
		console.log(chalk.yellow("Note: Using legacy command. Consider using 'colors quick' instead."));
		const config: CLIConfig = {
			...defaultConfig,
			input: options.input,
			outputDir: options.output,
			organizeFolders: options.organizeFolders !== false,
			forceClean: options.forceClean,
		};
		await generateColors(config);
	});

program
	.command("list")
	.alias("ls")
	.description("List colors (legacy command - use 'colors list')")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.action(async (options: any) => {
		console.log(chalk.yellow("Note: Using legacy command. Consider using 'colors list' instead."));
		const spinner = ora("Loading color definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
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
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

program
	.command("validate")
	.alias("val")
	.description("Validate definitions (legacy command - use 'colors validate')")
	.option("-i, --input <file>", "Input definition file", defaultConfig.input)
	.action(async (options: any) => {
		console.log(chalk.yellow("Note: Using legacy command. Consider using 'colors validate' instead."));
		const spinner = ora("Validating color definitions...").start();

		try {
			const inputFile = findDefinitionFile(options.input);
			const colorInput = await loadColorDefinitions(inputFile);

			validateColorInput(colorInput);

			spinner.succeed("Color definitions are valid!");

			console.log(chalk.green("\n✅ Validation passed!\n"));
			console.log(`  File: ${inputFile}`);
			console.log(`  Colors: ${Object.keys(colorInput.light).length}`);
		} catch (error) {
			spinner.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

program
	.command("figma")
	.alias("fig")
	.description("Generate Figma-compatible JSON configuration")
	.option("-i, --input <file>", "Input definition file", defaultFigmaConfig.input)
	.option("-o, --output <file>", "Output JSON file", defaultFigmaConfig.output)
	.option("-c, --collection <name>", "Collection name in Figma", defaultFigmaConfig.collectionName)
	.option("-v, --verbose", "Verbose output")
	.action(async (options: any) => {
		const config: FigmaConfig = {
			input: options.input,
			output: options.output,
			collectionName: options.collection,
			verbose: options.verbose || false,
		};

		const spinner = ora("Generating Figma JSON configuration...").start();

		try {
			const inputFile = findDefinitionFile(config.input);
			validateInputFile(inputFile);

			const colorInput = await loadColorDefinitions(inputFile);
			validateColorInput(colorInput);

			const outputPath = resolve(config.output);
			const outputDir = dirname(outputPath);

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

			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
				if (config.verbose) {
					spinner.info(`Created output directory: ${outputDir}`);
					spinner.start("Generating Figma JSON configuration...");
				}
			}

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
		} catch (error) {
			spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

// Handle unknown commands
program.on("command:*", (operands) => {
	console.error(chalk.red(`Unknown command: ${operands[0]}`));
	console.log("Available commands:");
	console.log("  colors - Color generation commands");
	console.log("  spacing - Spacing generation commands");
	console.log("  system - Complete design system commands");
	console.log("Run --help to see all available commands");
	process.exit(1);
});

// Show help when no command is provided
program.action(() => {
	console.log(chalk.bold("🎨 Design System CLI\n"));
	console.log("Available command groups:");
	console.log("  colors   - Color generation and management");
	console.log("  spacing  - Spacing system generation");
	console.log("  system   - Complete design system generation");
	console.log("\nRun any command with --help for detailed options");
	console.log("Examples:");
	console.log("  design-system colors quick");
	console.log("  design-system spacing generate --verbose");
	console.log("  design-system system validate");
});

// Parse CLI arguments
program.parse();
