# Design System Color Generation Monorepo

A comprehensive color generation system based on Radix UI colors, built as a modular TypeScript monorepo with Bun.

## 🎨 Features

- **12-step color progressions** for each color using Radix UI methodology
- **Alpha channel variants** for transparency effects
- **Wide gamut P3 support** for modern displays  
- **Gray scale variants** contextual to each color
- **Multiple output formats**: CSS custom properties, JSON, design tokens, Tailwind config
- **CLI tool** for easy generation from any project
- **TypeScript support** with full type safety
- **Configurable output** directories and options

## 📦 Packages

### Core Packages

- **[@design/color-generation-core](./packages/color-generation-core)** - Core color generation logic
- **[@design/color-generation-css](./packages/color-generation-css)** - CSS generation utilities  
- **[@design/color-generation-json](./packages/color-generation-json)** - JSON format generation
- **[@design/cli](./packages/cli)** - Command-line interface

### Supporting Packages

- **[@design/examples](./packages/examples)** - Usage examples and demos

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Validate Your Colors

Your `colors.ts` file is already set up with 9 beautiful colors:

```bash
# Validate color definitions
bun run colors:validate

# List all available colors
bun run colors:list
```

### 3. Generate Colors

```bash
# Quick generation with all features
bun run colors:quick

# Custom output directory
bun run colors:quick --output ./dist/colors

# Full control with all options
bun run colors:generate --verbose --output ./styles

# Generate only CSS files
bun run colors:generate --formats css

# Generate only JSON files  
bun run colors:generate --formats json
```

## 🎯 Available Colors

Your `colors.ts` currently includes:

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

## 📚 CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `bun run colors:validate` | Validate color definitions | `bun run colors:validate` |
| `bun run colors:list` | List all available colors | `bun run colors:list` |
| `bun run colors:quick` | Quick generation (all features) | `bun run colors:quick --output ./css` |
| `bun run colors:generate` | Full control generation | `bun run colors:generate --verbose` |
| `bun run colors` | Show CLI help | `bun run colors --help` |

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
bun run colors:generate --verbose
```

## 🎯 Generated Output

### CSS Custom Properties

```css
:root {
  /* Main color scale */
  --color-blue-1: #fcfdff;
  --color-blue-2: #f6f9ff;
  --color-blue-3: #ebf2ff;
  /* ... steps 4-12 */
  
  /* Alpha variants */
  --color-blue-a1: rgba(40, 110, 220, 0.05);
  --color-blue-a2: rgba(40, 110, 220, 0.10);
  /* ... */
  
  /* Wide gamut P3 */
  --color-blue-p3-1: oklch(99.4% 0.0025 259.5);
  /* ... */
  
  /* Special colors */
  --color-blue-contrast: #ffffff;
  --color-blue-surface: rgba(40, 110, 220, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode variants */
  }
}
```

### JSON Formats

**Flat Format:**
```json
{
  "blue-1": "#fcfdff",
  "blue-2": "#f6f9ff",
  "blue-contrast": "#ffffff"
}
```

**Design Tokens:**
```json
{
  "color": {
    "blue": {
      "1": { "value": "#fcfdff", "type": "color" },
      "contrast": { "value": "#ffffff", "type": "color" }
    }
  }
}
```

**Tailwind Configuration:**
```json
{
  "blue": {
    "50": "#fcfdff",
    "500": "#286edc",
    "950": "#133161"
  }
}
```

## 💻 Programmatic Usage

```typescript
// Import from source (no build required)
import { 
  createColorInput, 
  generateColorSystem 
} from './packages/color-generation-core/src/index';
import { generateCSSFiles } from './packages/color-generation-css/src/index';
import { generateJSONFiles } from './packages/color-generation-json/src/index';

// Create color input
const colorInput = createColorInput(
  { primary: '#0066CC', secondary: '#6366F1' },
  { primary: '#3B82F6', secondary: '#8B5CF6' },
  { gray: '#6B7280', background: '#FFFFFF' },
  { gray: '#9CA3AF', background: '#111827' }
);

// Generate color system
const colorSystem = generateColorSystem(colorInput);

// Generate CSS files
const cssFiles = generateCSSFiles(colorSystem, {
  outputDir: './output',
  includeAlpha: true,
  includeWideGamut: true
});

// Generate JSON files  
const jsonFiles = generateJSONFiles(colorSystem, {
  outputDir: './output',
  format: 'all'
});
```

## 🎨 Examples

Run the included examples to see the system in action:

```bash
# Basic color generation example
bun run example:basic

# Advanced usage patterns
bun run example:advanced
```

## 🛠 Development

### Scripts

```bash
# Install dependencies
bun install

# Build all packages (optional - not required for basic usage)
bun run build

# Run linting
bun run lint

# Clean build artifacts
bun run clean
```

### Adding New Colors

1. Edit your `colors.ts` file to add new colors:

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

### Project Structure

```
design/
├── packages/
│   ├── color-generation-core/    # Core generation logic
│   ├── color-generation-css/     # CSS output generation
│   ├── color-generation-json/    # JSON output generation  
│   ├── cli/                      # Command-line interface
│   └── examples/                 # Usage examples
├── colors.ts                     # Your color definitions
├── package.json                  # Monorepo configuration
└── generated/                    # Output directory (gitignored)
```

## 🎨 Color Scale Methodology

This system uses the Radix UI color methodology:

- **Steps 1-2**: Backgrounds, subtle borders
- **Steps 3-5**: UI component backgrounds  
- **Steps 6-8**: Borders, separators
- **Steps 9-10**: Solid backgrounds, primary actions
- **Steps 11-12**: High contrast text, active states

### Alpha Variants

Semi-transparent versions of each step, perfect for:
- Overlays and backdrops
- Hover states
- Subtle backgrounds over images
- Layered components

### Wide Gamut P3

Enhanced color versions for modern displays:
- More vibrant colors on supported devices
- Automatic fallback to sRGB
- Future-proof color definitions

## 📖 API Reference

### Core Package

- `createColorInput()` - Create color input from objects
- `generateColorSystem()` - Generate complete color system
- `getColorScale()` - Get specific color scale
- `validateColorInput()` - Validate color definitions
- `loadColorDefinitions()` - Load colors from file

### CSS Package

- `generateCSSFiles()` - Generate CSS files
- `generateCSSForColorSystem()` - Generate CSS strings
- `generateUtilityClasses()` - Generate utility classes

### JSON Package

- `generateJSONFiles()` - Generate JSON files
- `generateFlatJSON()` - Flat format generation
- `generateNestedJSON()` - Nested format generation
- `generateDesignTokensJSON()` - Design tokens format
- `generateTailwindJSON()` - Tailwind config format

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun test`
5. Run linting: `bun run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/colors) for the color methodology
- [Bun](https://bun.sh) for the fast JavaScript runtime
- All contributors to this project
