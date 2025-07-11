#!/usr/bin/env bun

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

interface Colors {
	reset: string;
	bright: string;
	dim: string;
	green: string;
	yellow: string;
	blue: string;
	red: string;
	cyan: string;
}

interface Logger {
	info: (msg: string) => void;
	success: (msg: string) => void;
	warn: (msg: string) => void;
	error: (msg: string) => void;
	step: (msg: string) => void;
}

interface BuildGroup {
	name: string;
	packages: string[];
	description: string;
}

interface PackageConfig {
	hasTypes?: boolean;
	needsCleanup?: boolean;
	usesWebpack?: boolean;
}

interface PackageConfigs {
	[packageName: string]: PackageConfig;
}

interface PackageBuildResult {
	name: string;
	success: boolean;
	duration: number;
}

interface BuildSummary {
	startTime: number;
	endTime?: number;
	totalPackages: number;
	builtPackages: PackageBuildResult[];
	skippedPackages: string[];
	buildGroups: BuildGroupResult[];
}

interface BuildGroupResult {
	name: string;
	builtPackages: PackageBuildResult[];
	skippedPackages: string[];
	duration: number;
}

const COLORS: Colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
};

const log: Logger = {
	info: (msg: string) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
	success: (msg: string) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
	warn: (msg: string) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
	error: (msg: string) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
	step: (msg: string) => console.log(`${COLORS.cyan}→${COLORS.reset} ${msg}`),
};

// Define build order and dependencies
const BUILD_ORDER: BuildGroup[] = [
	{
		name: "Core Packages",
		packages: ["color-generation-core", "spacing-generation-core"],
		description: "Core color and spacing generation logic",
	},
	{
		name: "Extension Packages",
		packages: [
			"color-generation-css",
			"color-generation-json",
			"spacing-generation-css",
			"spacing-generation-json",
			"figma-to-json",
		],
		description: "CSS and JSON output formatters, Figma integration",
	},
	{
		name: "Application Packages",
		packages: ["figma-plugin", "cli"],
		description: "Applications and tools",
	},
];

// Package-specific build configurations
const PACKAGE_CONFIGS: PackageConfigs = {
	"color-generation-core": {
		hasTypes: true,
		needsCleanup: true,
	},
	"color-generation-css": {
		hasTypes: true,
		needsCleanup: true,
	},
	"color-generation-json": {
		hasTypes: true,
		needsCleanup: true,
	},
	"spacing-generation-core": {
		hasTypes: true,
		needsCleanup: true,
	},
	"spacing-generation-css": {
		hasTypes: true,
		needsCleanup: true,
	},
	"spacing-generation-json": {
		hasTypes: true,
		needsCleanup: true,
	},
	"figma-to-json": {
		hasTypes: true,
		needsCleanup: true,
	},
	"figma-plugin": {
		usesWebpack: true,
		needsCleanup: false,
	},
	cli: {
		hasTypes: false,
		needsCleanup: false,
	},
};

function formatDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
}

function displayBuildSummary(summary: BuildSummary): void {
	const duration = summary.endTime ? summary.endTime - summary.startTime : 0;

	console.log(`\n${COLORS.bright}📊 Build Summary${COLORS.reset}`);
	console.log(`${COLORS.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);

	// Overall stats
	console.log(`${COLORS.cyan}⏱️  Total time:${COLORS.reset} ${formatDuration(duration)}`);
	console.log(`${COLORS.cyan}📦 Total packages:${COLORS.reset} ${summary.totalPackages}`);
	console.log(`${COLORS.green}✅ Built packages:${COLORS.reset} ${summary.builtPackages.length}`);

	if (summary.skippedPackages.length > 0) {
		console.log(`${COLORS.yellow}⏭️  Skipped packages:${COLORS.reset} ${summary.skippedPackages.length}`);
	}

	// Group breakdown
	console.log(`\n${COLORS.bright}📋 Build Groups:${COLORS.reset}`);
	summary.buildGroups.forEach((group, index) => {
		const groupIcon = index === 0 ? "🔧" : index === 1 ? "📝" : "🚀";
		console.log(`  ${groupIcon} ${COLORS.bright}${group.name}${COLORS.reset} (${formatDuration(group.duration)})`);

		if (group.builtPackages.length > 0) {
			group.builtPackages.forEach((pkg) => {
				console.log(
					`    ${COLORS.green}✓${COLORS.reset} ${pkg.name} ${COLORS.dim}(${formatDuration(pkg.duration)})${COLORS.reset}`,
				);
			});
		}

		if (group.skippedPackages.length > 0) {
			console.log(`    ${COLORS.yellow}⏭${COLORS.reset} Skipped: ${group.skippedPackages.join(", ")}`);
		}
	});

	// Package details with individual timing
	if (summary.builtPackages.length > 0) {
		console.log(`\n${COLORS.bright}🔨 Built Packages (Individual Timing):${COLORS.reset}`);

		// Sort packages by build time (slowest first)
		const sortedPackages = [...summary.builtPackages].sort((a, b) => b.duration - a.duration);

		sortedPackages.forEach((pkg, _index) => {
			const config = PACKAGE_CONFIGS[pkg.name];
			const typeInfo = config?.hasTypes ? "TS" : "JS";
			const buildTool = config?.usesWebpack ? "Webpack" : "Bun";
			const timeColor = pkg.duration > 5000 ? COLORS.red : pkg.duration > 2000 ? COLORS.yellow : COLORS.green;

			console.log(
				`  ${pkg.name} ${COLORS.dim}(${typeInfo}, ${buildTool})${COLORS.reset} - ${timeColor}${formatDuration(pkg.duration)}${COLORS.reset}`,
			);
		});

		// Build time statistics
		const buildTimes = summary.builtPackages.map((p) => p.duration);
		const avgTime = buildTimes.reduce((sum, time) => sum + time, 0) / buildTimes.length;
		const maxTime = Math.max(...buildTimes);
		const minTime = Math.min(...buildTimes);

		console.log(`\n${COLORS.bright}📈 Build Statistics:${COLORS.reset}`);
		console.log(`  ${COLORS.cyan}Average:${COLORS.reset} ${formatDuration(avgTime)}`);
		console.log(`  ${COLORS.cyan}Fastest:${COLORS.reset} ${formatDuration(minTime)}`);
		console.log(`  ${COLORS.cyan}Slowest:${COLORS.reset} ${formatDuration(maxTime)}`);
	}

	console.log(`${COLORS.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
	console.log(`${COLORS.bright}✨ Build completed successfully!${COLORS.reset}\n`);
}

async function packageExists(packageName: string): Promise<boolean> {
	try {
		const packagePath = path.join("packages", packageName);
		const stats = await stat(packagePath);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

async function getAvailablePackages(): Promise<string[]> {
	const packagesDir = "packages";
	try {
		const entries = await readdir(packagesDir);
		const packages: string[] = [];

		for (const entry of entries) {
			const fullPath = path.join(packagesDir, entry);
			const stats = await stat(fullPath);
			if (stats.isDirectory()) {
				packages.push(entry);
			}
		}

		return packages;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error(`Failed to read packages directory: ${errorMessage}`);
		return [];
	}
}

async function buildPackage(packageName: string): Promise<PackageBuildResult> {
	const config = PACKAGE_CONFIGS[packageName] || {};
	const packagePath = path.join("packages", packageName);
	const startTime = Date.now();

	log.step(`Building ${packageName}...`);

	try {
		// Clean dist directory if needed
		if (config.needsCleanup) {
			await $`rm -rf ${path.join(packagePath, "dist")}`.quiet();
		}

		// Run the build command
		const result = await $`bun run --filter=./packages/${packageName} build`.cwd(process.cwd());

		if (result.exitCode !== 0) {
			throw new Error(`Build failed for ${packageName}`);
		}

		const duration = Date.now() - startTime;
		log.success(`${packageName} built successfully ${COLORS.dim}(${formatDuration(duration)})${COLORS.reset}`);

		return {
			name: packageName,
			success: true,
			duration,
		};
	} catch (error) {
		const duration = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error(`Failed to build ${packageName}: ${errorMessage}`);

		return {
			name: packageName,
			success: false,
			duration,
		};
	}
}

async function buildGroup(group: BuildGroup): Promise<BuildGroupResult> {
	const groupStartTime = Date.now();

	log.info(`${COLORS.bright}Building ${group.name}${COLORS.reset}`);
	log.info(`${COLORS.dim}${group.description}${COLORS.reset}`);

	const availablePackages = await getAvailablePackages();
	const packagesToBuild = group.packages.filter((pkg) => availablePackages.includes(pkg));
	const skippedPackages = group.packages.filter((pkg) => !availablePackages.includes(pkg));

	if (packagesToBuild.length === 0) {
		log.warn(`No packages found for ${group.name}`);
		return {
			name: group.name,
			builtPackages: [],
			skippedPackages: group.packages,
			duration: Date.now() - groupStartTime,
		};
	}

	if (packagesToBuild.length !== group.packages.length) {
		log.warn(`Missing packages: ${skippedPackages.join(", ")}`);
	}

	// Build packages in parallel within the same group
	const buildPromises = packagesToBuild.map((packageName) => buildPackage(packageName));

	try {
		const buildResults = await Promise.all(buildPromises);

		// Check if any packages failed
		const failedPackages = buildResults.filter((result) => !result.success);
		if (failedPackages.length > 0) {
			throw new Error(
				`${failedPackages.length} package(s) failed to build: ${failedPackages.map((p) => p.name).join(", ")}`,
			);
		}

		log.success(`${group.name} completed successfully`);

		return {
			name: group.name,
			builtPackages: buildResults,
			skippedPackages,
			duration: Date.now() - groupStartTime,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
		log.error(`${group.name} failed: ${errorMessage}`);
		throw error;
	}
}

async function cleanAll(): Promise<void> {
	log.info("Cleaning all build artifacts...");

	try {
		// Clean dist directories
		await $`rm -rf packages/*/dist`.quiet();

		// Clean node_modules cache directories (only if they exist)
		try {
			await $`find packages -name ".cache" -type d -path "*/node_modules/.cache" -exec rm -rf {} +`.quiet();
		} catch {
			// Ignore errors if no cache directories are found
		}

		log.success("Clean completed");
	} catch (error) {
		const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
		log.warn(`Clean partially failed: ${errorMessage}`);
	}
}

async function validateEnvironment(): Promise<void> {
	log.info("Validating build environment...");

	// Check if we're in the right directory
	try {
		await stat("package.json");
		await stat("packages");
	} catch {
		log.error("Please run this script from the project root directory");
		process.exit(1);
	}

	// Check Bun version
	try {
		const result = await $`bun --version`.quiet();
		log.info(`Using Bun version: ${result.stdout.toString().trim()}`);
	} catch {
		log.error("Bun is not installed or not in PATH");
		process.exit(1);
	}

	log.success("Environment validation passed");
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const command = args[0] || "build";

	console.log(`${COLORS.bright}🏗️  Design System Build Tool${COLORS.reset}\n`);

	try {
		await validateEnvironment();

		switch (command) {
			case "build": {
				const buildSummary: BuildSummary = {
					startTime: Date.now(),
					totalPackages: 0,
					builtPackages: [],
					skippedPackages: [],
					buildGroups: [],
				};

				log.info("Starting full build process...");

				// Build each group in sequence (groups have dependencies between them)
				for (const group of BUILD_ORDER) {
					const groupResult = await buildGroup(group);
					buildSummary.buildGroups.push(groupResult);
					buildSummary.builtPackages.push(...groupResult.builtPackages);
					buildSummary.skippedPackages.push(...groupResult.skippedPackages);
					console.log(); // Add spacing between groups
				}

				buildSummary.endTime = Date.now();
				buildSummary.totalPackages = buildSummary.builtPackages.length + buildSummary.skippedPackages.length;

				displayBuildSummary(buildSummary);
				break;
			}

			case "clean":
				await cleanAll();
				break;

			case "package": {
				const packageName = args[1];
				if (!packageName) {
					log.error("Please specify a package name: bun build.ts package <package-name>");
					process.exit(1);
				}

				if (!(await packageExists(packageName))) {
					log.error(`Package '${packageName}' not found`);
					process.exit(1);
				}

				const packageResult = await buildPackage(packageName);
				const summary: BuildSummary = {
					startTime: Date.now(),
					totalPackages: 1,
					builtPackages: [packageResult],
					skippedPackages: [],
					buildGroups: [],
				};
				displayBuildSummary(summary);
				break;
			}

			case "list": {
				const availablePackages = await getAvailablePackages();
				log.info("Available packages:");
				availablePackages.forEach((pkg) => {
					const config = PACKAGE_CONFIGS[pkg];
					const description = config
						? `${config.hasTypes ? "TypeScript" : "JavaScript"} ${config.usesWebpack ? "(Webpack)" : "(Bun)"}`
						: "Unknown";
					console.log(`  ${COLORS.cyan}${pkg}${COLORS.reset} - ${description}`);
				});
				break;
			}

			default:
				log.error(`Unknown command: ${command}`);
				console.log(`
Available commands:
  ${COLORS.cyan}build${COLORS.reset}           - Build all packages in dependency order
  ${COLORS.cyan}clean${COLORS.reset}           - Clean all build artifacts
  ${COLORS.cyan}package <name>${COLORS.reset}  - Build a specific package
  ${COLORS.cyan}list${COLORS.reset}            - List all available packages
        `);
				process.exit(1);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error(`Build failed: ${errorMessage}`);
		process.exit(1);
	}
}

// Handle script interruption
process.on("SIGINT", () => {
	log.warn("Build interrupted by user");
	process.exit(130);
});

process.on("SIGTERM", () => {
	log.warn("Build terminated");
	process.exit(143);
});

// Run the main function
main().catch((error) => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	log.error(`Unexpected error: ${errorMessage}`);
	process.exit(1);
});
