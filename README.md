![Design System Core](./assets/banner-core.svg)

# Design System Generation Monorepo

[**Blog post**](https://labtwofour.com/blog/post/design)

[**Figma plugin**](https://www.figma.com/community/plugin/1525022875622896761/design-system-manager-kevintyj-design)

A comprehensive design system with color and spacing generation based on Radix UI colors, built as a modular TypeScript monorepo with Bun.

## ✨ Features

<p align="center">
  <img src="./assets/termdemo.gif" alt="Terminal Demo" />
</p>

[Youtube Demo](https://www.youtube.com/watch?v=RBG1NTVvytk)

### 🎨 Color System
- **12-step color progressions** for each color using Radix UI methodology
- **Alpha channel variants** for transparency effects
- **Wide gamut P3 support** for modern displays
- **Gray scale variants** contextual to each color
- **Special colors** (contrast, surface, indicator)

### 📏 Spacing System
- **26 spacing values** from 0px to 80px with 4px base multiplier
- **Pixel and REM variants** for flexible sizing
- **Utility classes** for margin, padding, and gap
- **Tailwind-compatible** naming conventions

### 🛠 Generation Options
- **Multiple output formats**: CSS custom properties, JSON, design tokens, Tailwind config
- **CLI tool** for easy generation from any project
- **TypeScript support** with full type safety
- **Configurable output** directories and options
- **Organized folder structure** (colors/, spacing/, combined/)

## 📦 Packages

### Core Packages

| Package | Description | Status |
|---------|-------------|---------|
| **[@kevintyj/design-color-core](./packages/color-generation-core)** | Core color generation logic | ✅ Complete |
| **[@kevintyj/design-spacing-core](./packages/spacing-generation-core)** | Core spacing generation logic | ✅ Complete |

### Generation Packages

| Package | Description | Status |
|---------|-------------|---------|
| **[@kevintyj/design-color-css](./packages/color-generation-css)** | CSS generation utilities | ✅ Complete |
| **[@kevintyj/design-color-json](./packages/color-generation-json)** | JSON format generation | ✅ Complete |
| **[@kevintyj/design-spacing-css](./packages/spacing-generation-css)** | Spacing CSS utilities | ✅ Complete |
| **[@kevintyj/design-spacing-json](./packages/spacing-generation-json)** | Spacing JSON formats | ✅ Complete |

### Application Packages

| Package | Description | Status |
|---------|-------------|---------|
| **[@kevintyj/design/cli](./packages/cli)** | Command-line interface | ✅ Complete |
| **[@kevintyj/design/figma-plugin](./packages/figma-plugin)** | Figma plugin for design system management | ✅ Complete |
| **[@kevintyj/design/figma-json](./packages/figma-to-json)** | Export Figma variables to JSON | ✅ Complete |
| **[@kevintyj/design/examples](./packages/examples)** | Usage examples and demos | ✅ Complete |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Build the System

```bash
# Build all packages in dependency order
bun run build
```

### 3. Validate Your Definitions

Your `base.ts` file is already set up with 9 beautiful colors and 26 spacing values:

```bash
# Validate color definitions
bun run colors:validate

# List all available colors
bun run colors:list

# Validate spacing definitions
bun run spacing:validate
```

### 4. Generate Design System

```bash
# Quick generation with all features
bun run system:quick

# Generate colors only
bun run colors:quick

# Generate spacing only
bun run spacing:quick

# Custom output directory
bun run system:quick --output ./dist

# Full control with all options
bun run system:generate --verbose --output ./styles
```

## 🎯 Available Colors

Your `base.ts` currently includes:

- **🔥 blaze** - Vibrant orange-red (`#FC4B32` / `#FD563D`)
- **🍂 autumn** - Warm brown (`#311318` / `#30181B`)
- **🌸 pink** - Bright pink (`#F9486F` / `#F55776`)
- **🌊 teal** - Blue-green (`#00A77F` / `#17AD85`)
- **💙 blue** - Primary blue (`#286EDC` / `#3A80E0`)
- **❤️ red** - Classic red (`#DA3132` / `#DE393A`)
- **💛 yellow** - Bright yellow (`#FBB919` / `#FFBD3B`)
- **💚 green** - Fresh green (`#28B450` / `#51B251`)
- **💜 violet** - Purple-blue (`#5B5BD6` / `#5B5BD6`)

Each color generates **12-step progressions** for light and dark modes with alpha variants, wide gamut P3 colors, and contextual gray scales.

## 📏 Available Spacing

Your `base.ts` includes 26 spacing values following a 4px multiplier system:

- **Core values**: `0`, `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px)
- **Extended values**: `6` through `20` for larger spacing needs
- **Pixel variants**: `px` (1px), `2px`, `3px`, `5px`, `6px`, `10px`, `14px`
- **REM equivalents**: Auto-generated for all values (e.g., `1rem` = 16px)

## 📚 CLI Commands

### Quick Commands

| Command | Description | Example |
|---------|-------------|---------|
| `bun run system:quick` | Generate complete design system | `bun run system:quick --output ./dist` |
| `bun run colors:quick` | Quick color generation (all features) | `bun run colors:quick` |
| `bun run spacing:quick` | Quick spacing generation | `bun run spacing:quick` |

### Validation Commands

| Command | Description | Example |
|---------|-------------|---------|
| `bun run system:validate` | Validate both colors and spacing | `bun run system:validate` |
| `bun run colors:validate` | Validate color definitions | `bun run colors:validate` |
| `bun run spacing:validate` | Validate spacing definitions | `bun run spacing:validate` |

### List Commands

| Command | Description | Example |
|---------|-------------|---------|
| `bun run colors:list` | List all available colors | `bun run colors:list` |
| `bun run spacing:list` | List all spacing values | `bun run spacing:list` |

### Generation Commands

| Command | Description | Example |
|---------|-------------|---------|
| `bun run system:generate` | Full system generation | `bun run system:generate --verbose` |
| `bun run colors:generate` | Full control color generation | `bun run colors:generate --formats css,json` |
| `bun run spacing:generate` | Full spacing generation | `bun run spacing:generate --formats css` |

### Figma Integration

| Command | Description | Example |
|---------|-------------|---------|
| `bun run system:figma` | Generate complete Figma JSON | `bun run system:figma` |
| `bun run colors:figma` | Generate Figma color JSON | `bun run colors:figma` |
| `bun run spacing:figma` | Generate Figma spacing JSON | `bun run spacing:figma` |

### Advanced Generation Options

```bash
# Generate specific formats
bun run colors:generate --formats css,json --output ./assets

# Exclude alpha channels (smaller output)
bun run colors:generate --no-alpha --output ./minimal

# Only wide gamut colors
bun run colors:generate --no-alpha --no-gray-scale --output ./p3

# Custom CSS prefix
bun run colors:generate --css-prefix "--theme" --formats css

# Pretty JSON with specific format
bun run colors:generate --json-format tokens --json-pretty --formats json

# Verbose output to see all generated files
bun run system:generate --verbose
```

## 🎯 Generated Output Structure

```
output/
├── css/
│   ├── colors/
│   │   ├── colors-light.css
│   │   ├── colors-dark.css
│   │   ├── colors-combined.css
│   │   └── colors-full-*.css
│   ├── spacing/
│   │   ├── spacing.css
│   │   ├── spacing-px.css
│   │   ├── spacing-rem.css
│   │   └── spacing-combined.css
│   └── combined/           # 🚧 Coming soon
│       └── design-system.css
├── json/
│   ├── colors/
│   │   ├── colors-flat.json
│   │   ├── colors-nested.json
│   │   ├── colors-tokens.json
│   │   └── colors-tailwind.json
│   ├── spacing/
│   │   ├── spacing-flat.json
│   │   ├── spacing-nested.json
│   │   ├── spacing-tokens.json
│   │   ├── spacing-tailwind.json
│   │   └── spacing-collections.json
│   └── combined/           # 🚧 Coming soon
│       └── design-system.json
└── figma/
    ├── colors-figma.json
    ├── spacing-figma.json
    └── system-figma.json   # 🚧 Coming soon
```

## 💻 Programmatic Usage

### Color Generation

```typescript
import {
  loadColorDefinitions,
  generateColorSystem
} from '@kevintyj/design-color-core';
import { generateCSSFiles } from '@kevintyj/design-color-css';
import { generateJSONFiles } from '@kevintyj/design-color-json';

// Load from base.ts
const colorInput = await loadColorDefinitions('./base.ts');
const colorSystem = generateColorSystem(colorInput);

// Generate CSS files
const cssFiles = generateCSSFiles(colorSystem, {
  includeAlpha: true,
  includeWideGamut: true
});

// Generate JSON files
const jsonFiles = generateJSONFiles(colorSystem, {
  format: 'all'
});
```

### Spacing Generation

```typescript
import {
  loadSpacingDefinitions,
  generateSpacingSystem
} from '@kevintyj/design-spacing-core';
import { generateCSSFiles } from '@kevintyj/design-spacing-css';
import { generateJSONFiles } from '@kevintyj/design-spacing-json';

// Load from base.ts
const spacingInput = await loadSpacingDefinitions('./base.ts');
const spacingSystem = generateSpacingSystem(spacingInput);

// Generate CSS files
const cssFiles = generateCSSFiles(spacingSystem, {
  variant: 'full',
  generateUtilityClasses: true
});

// Generate JSON files
const jsonFiles = generateJSONFiles(spacingSystem, {
  format: 'tailwind'
});
```

### Combined System Generation

```typescript
import {
  loadColorDefinitions,
  loadSpacingDefinitions,
  generateColorSystem,
  generateSpacingSystem
} from '@kevintyj/design-color-core';

// Load definitions
const colorInput = await loadColorDefinitions('./base.ts');
const spacingInput = await loadSpacingDefinitions('./base.ts');

// Generate systems
const colorSystem = generateColorSystem(colorInput);
const spacingSystem = generateSpacingSystem(spacingInput);

// Generate combined output
const designSystem = {
  colors: colorSystem,
  spacing: spacingSystem,
  metadata: {
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  }
};
```

## 🎨 Examples

### Generated CSS Output

**Color Custom Properties:**
```css
:root {
  /* Color scale */
  --color-blue-1: #fcfdff;
  --color-blue-2: #f6f9ff;
  --color-blue-12: #113161;

  /* Alpha variants */
  --color-blue-a1: rgba(40, 110, 220, 0.05);
  --color-blue-a12: rgba(40, 110, 220, 0.95);

  /* Wide gamut P3 */
  --color-blue-p3-1: oklch(99.4% 0.0025 259.5);

  /* Special colors */
  --color-blue-contrast: #ffffff;
  --color-blue-surface: rgba(40, 110, 220, 0.1);
}
```

**Spacing Custom Properties:**
```css
:root {
  /* Pixel values */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;

  /* REM values */
  --spacing-1-rem: 0.25rem;
  --spacing-2-rem: 0.5rem;
  --spacing-4-rem: 1rem;
}

/* Utility classes */
.m-1 { margin: 4px; }
.p-2 { padding: 8px; }
.gap-4 { gap: 16px; }
```

### Generated JSON Output

**Tailwind Colors:**
```json
{
  "theme": {
    "colors": {
      "blue": {
        "50": "#fcfdff",
        "500": "#286edc",
        "950": "#113161"
      }
    }
  }
}
```

**Tailwind Spacing:**
```json
{
  "theme": {
    "spacing": {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "4": "16px",
      "px": "1px"
    }
  }
}
```

### Run Examples

```bash
# Basic color and spacing generation example
bun run example:basic

# Advanced usage patterns
bun run example:advanced
```

## 🛠 Development

### Build Commands

```bash
# Install dependencies
bun install

# Build all packages in dependency order
bun run build

# Build specific package
bun run build:package cli

# Clean build artifacts
bun run build:clean

# List available packages
bun run build:list
```

### Development Scripts

```bash
# Run linting
bun run lint

# Format code
bun run precommit

# Run tests
bun run test

# Clean everything
bun run clean
```

### Adding New Colors

1. Edit your `base.ts` file to add new colors:

```typescript
export const light = {
  // ... existing colors
  brand: '#FF6B35',      // Add new color
  accent: '#4ECDC4'
};

export const dark = {
  // ... existing colors
  brand: '#FF7F59',      // Add dark variant
  accent: '#45B7B8'
};
```

2. Validate and generate:

```bash
bun run colors:validate
bun run colors:quick
```

### Adding New Spacing Values

1. Edit the `spacing` object in `base.ts`:

```typescript
export const spacing = {
  // ... existing values
  "24": 96,    // 24 * 4px = 96px
  "32": 128    // 32 * 4px = 128px
};
```

2. Generate spacing using the CLI:

```bash
bun run spacing:validate
bun run spacing:quick
```

### Project Structure

```
design/
├── packages/
│   ├── color-generation-core/     # Core color generation
│   ├── color-generation-css/      # Color CSS output
│   ├── color-generation-json/     # Color JSON output
│   ├── spacing-generation-core/   # Core spacing generation
│   ├── spacing-generation-css/    # Spacing CSS output
│   ├── spacing-generation-json/   # Spacing JSON output
│   ├── cli/                       # Command-line interface
│   ├── figma-plugin/              # Figma integration
│   ├── figma-to-json/             # Figma variable export
│   └── examples/                  # Usage examples
├── base.ts                        # Your design definitions
├── package.json                   # Monorepo configuration
├── build.ts                       # Custom build system
└── output/                        # Generated files
```

## 🎨 Design System Methodology

### Color Scale (Radix UI)

- **Steps 1-2**: Backgrounds, subtle borders
- **Steps 3-5**: UI component backgrounds
- **Steps 6-8**: Borders, separators
- **Steps 9-10**: Solid backgrounds, primary actions
- **Steps 11-12**: High contrast text, active states

### Spacing Scale (4px Base)

- **Micro spacing** (0-4px): `0`, `px`, `2px`, `3px`, `1`
- **Small spacing** (4-16px): `1`, `5px`, `6px`, `2`, `10px`, `3`, `14px`, `4`
- **Medium spacing** (16-48px): `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`
- **Large spacing** (48px+): `13`, `14`, `15`, `16`, `18`, `20`

## 📖 Package APIs

### Color Generation

- **Core**: `createColorInput()`, `generateColorSystem()`, `validateColorInput()`
- **CSS**: `generateCSSFiles()`, `generateCSSForColorSystem()`
- **JSON**: `generateJSONFiles()`, `generateFlatJSON()`, `generateTailwindJSON()`

### Spacing Generation

- **Core**: `createSpacingInput()`, `generateSpacingSystem()`, `validateSpacingInput()`
- **CSS**: `generateCSSFiles()`, `generateSpacingUtilityClasses()`
- **JSON**: `generateJSONFiles()`, `generateTailwindSpacingJSON()`

## 🎯 Figma Integration

### Figma Plugin

- Import/export design system configurations
- Generate color scales directly in Figma
- Manage design system variables
- Export to multiple formats

### Figma Variable Export

- Export Figma variables to JSON
- Convert to design system format
- Support for color and spacing variables

```bash
# Develop Figma plugin
bun run figma:dev

# Build Figma plugin for production
bun run figma:build
```

## 🏗️ Build System

This project uses a custom TypeScript build system with advanced features:

### Build Process

1. **Core Packages**: Color and spacing generation cores
2. **Extension Packages**: CSS, JSON, and Figma integrations
3. **Application Packages**: CLI and examples

### Build Features

- 🔍 **Environment validation** with Bun version checking
- 📦 **Dependency-aware ordering** prevents build failures
- 🎨 **Rich console output** with colors and progress
- 🚀 **Parallel execution** within build groups
- 📊 **Build statistics** with timing and performance data
- 🧹 **Smart cleanup** and artifact management

### Build Statistics

The build system provides detailed statistics:
- Individual package build times
- Group build summaries
- Performance rankings
- Total build time and package counts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Build and test: `bun run build && bun run test`
5. Run linting: `bun run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/colors) for the color methodology
- [Bun](https://bun.sh) for the fast JavaScript runtime and build tools
- [Tailwind CSS](https://tailwindcss.com) for spacing and utility inspiration
- All contributors to this project

## 🔮 Roadmap

- ✅ Complete color generation system
- ✅ Complete spacing generation system
- ✅ CLI integration for colors
- ✅ CLI integration for spacing
- ✅ Combined system generation
- 🚧 Typography scale generation
- 🚧 Component primitive generation
- 🚧 Enhanced Figma plugin with spacing support
- 🚧 Web-based design system editor
- 🚧 Design token standard compliance
- 🚧 Advanced utility class generation
- 🚧 Design system documentation site
- 🚧 VS Code extension for design system management

---

**🎨 Ready to build beautiful, consistent design systems with automated color and spacing generation!**
