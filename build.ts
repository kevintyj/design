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
		name: "Core Package",
		packages: ["color-generation-core"],
		description: "Core color generation logic",
	},
	{
		name: "Extension Packages",
		packages: ["color-generation-css", "color-generation-json", "figma-to-json"],
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

async function buildPackage(packageName: string): Promise<boolean> {
	const config = PACKAGE_CONFIGS[packageName] || {};
	const packagePath = path.join("packages", packageName);

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

		log.success(`${packageName} built successfully`);
		return true;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log.error(`Failed to build ${packageName}: ${errorMessage}`);
		throw error;
	}
}

async function buildGroup(group: BuildGroup): Promise<void> {
	log.info(`${COLORS.bright}Building ${group.name}${COLORS.reset}`);
	log.info(`${COLORS.dim}${group.description}${COLORS.reset}`);

	const availablePackages = await getAvailablePackages();
	const packagesToBuild = group.packages.filter((pkg) => availablePackages.includes(pkg));

	if (packagesToBuild.length === 0) {
		log.warn(`No packages found for ${group.name}`);
		return;
	}

	if (packagesToBuild.length !== group.packages.length) {
		const missing = group.packages.filter((pkg) => !availablePackages.includes(pkg));
		log.warn(`Missing packages: ${missing.join(", ")}`);
	}

	// Build packages in parallel within the same group
	const buildPromises = packagesToBuild.map((packageName) => buildPackage(packageName));

	try {
		await Promise.all(buildPromises);
		log.success(`${group.name} completed successfully`);
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
			case "build":
				log.info("Starting full build process...");

				// Build each group in sequence (groups have dependencies between them)
				for (const group of BUILD_ORDER) {
					await buildGroup(group);
					console.log(); // Add spacing between groups
				}

				log.success(`${COLORS.bright}✨ All packages built successfully!${COLORS.reset}`);
				break;

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

				await buildPackage(packageName);
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
