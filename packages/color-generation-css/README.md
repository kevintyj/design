# @design/color-generation-css

CSS generation utilities for design system colors. Converts color systems into CSS custom properties, utility classes, and theme files.

## 🎨 Features

- **CSS Custom Properties** with semantic naming
- **Light/Dark Mode Support** with automatic media queries
- **Multiple Output Formats** (separate, combined, full)
- **Utility Classes** for quick prototyping
- **Wide Gamut P3** color support
- **Alpha Variants** for transparency effects
- **Configurable Prefixes** and naming conventions

## 📦 Installation

```bash
bun add @design/color-generation-css
```

## 🚀 Quick Start

```typescript
import { generateCSSFiles } from '@design/color-generation-css';
import { generateColorSystem } from '@design/color-generation-core';

// Generate color system
const colorSystem = generateColorSystem(colorInput);

// Generate CSS files
const cssFiles = generateCSSFiles(colorSystem, {
  includeAlpha: true,
  includeWideGamut: true,
  generateUtilityClasses: true
});

// Write files to disk
cssFiles.forEach(file => {
  console.log(`Generated: ${file.filename}`);
  console.log(`Content: ${file.content.substring(0, 100)}...`);
});
```

## 📖 API Reference

### Types

#### `CSSGenerationConfig`
```typescript
interface CSSGenerationConfig {
  includeAlpha?: boolean;          // Include alpha variants (default: true)
  includeWideGamut?: boolean;      // Include P3 colors (default: true)
  generateUtilityClasses?: boolean; // Generate utility classes (default: false)
  cssPrefix?: string;              // Custom property prefix (default: "--color")
  outputVariant?: OutputVariant;   // Output format (default: "combined")
}
```

#### `OutputVariant`
```typescript
type OutputVariant = 
  | "separate"    // Light and dark in separate files
  | "combined"    // Light and dark with media queries
  | "full";       // All variants in single file
```

#### `CSSFile`
```typescript
interface CSSFile {
  filename: string;
  content: string;
  type: "light" | "dark" | "combined" | "utilities";
}
```

### Functions

#### `generateCSSFiles(colorSystem, config?)`

Generates CSS files from a color system.

**Parameters:**
- `colorSystem: ColorSystem` - Generated color system
- `config?: CSSGenerationConfig` - Configuration options

**Returns:** `CSSFile[]`

#### `generateCSSForColorSystem(colorSystem, config?)`

Generates CSS content as strings without file structure.

**Parameters:**
- `colorSystem: ColorSystem` - Generated color system  
- `config?: CSSGenerationConfig` - Configuration options

**Returns:** `{ light: string; dark: string; combined: string; utilities?: string }`

#### `generateUtilityClasses(colorSystem)`

Generates utility classes for colors.

**Parameters:**
- `colorSystem: ColorSystem` - Generated color system

**Returns:** `string`

## 🎯 Generated CSS Structure

### Custom Properties

```css
:root {
  /* Main color scales */
  --color-blue-1: #fcfdff;
  --color-blue-2: #f6f9ff;
  --color-blue-12: #113161;
  
  /* Alpha variants */
  --color-blue-a1: rgba(40, 110, 220, 0.05);
  --color-blue-a12: rgba(40, 110, 220, 0.95);
  
  /* Wide gamut P3 */
  --color-blue-p3-1: oklch(99.4% 0.0025 259.5);
  --color-blue-p3-12: oklch(45.2% 0.142 259.5);
  
  /* Special colors */
  --color-blue-contrast: #ffffff;
  --color-blue-surface: rgba(40, 110, 220, 0.1);
  --color-blue-indicator: #286edc;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode overrides */
    --color-blue-1: #0d1520;
    --color-blue-12: #b8d4ff;
  }
}
```

### Utility Classes

```css
/* Background colors */
.bg-blue-1 { background-color: var(--color-blue-1); }
.bg-blue-12 { background-color: var(--color-blue-12); }

/* Text colors */
.text-blue-1 { color: var(--color-blue-1); }
.text-blue-contrast { color: var(--color-blue-contrast); }

/* Border colors */
.border-blue-6 { border-color: var(--color-blue-6); }

/* Alpha variants */
.bg-blue-a3 { background-color: var(--color-blue-a3); }
```

## 💡 Usage Examples

### Basic CSS Generation

```typescript
import { generateCSSFiles } from '@design/color-generation-css';

const cssFiles = generateCSSFiles(colorSystem);

// Outputs:
// - colors-light.css
// - colors-dark.css  
// - colors-combined.css
```

### Custom Configuration

```typescript
const cssFiles = generateCSSFiles(colorSystem, {
  includeAlpha: false,        // Skip alpha variants
  includeWideGamut: false,    // Skip P3 colors
  generateUtilityClasses: true, // Include utility classes
  cssPrefix: '--theme',       // Custom prefix
  outputVariant: 'full'       // Single file output
});
```

### Separate Light/Dark Files

```typescript
const cssFiles = generateCSSFiles(colorSystem, {
  outputVariant: 'separate'
});

// Outputs:
// - colors-light.css (light mode only)
// - colors-dark.css (dark mode only)
```

### Combined with Media Queries

```typescript
const cssFiles = generateCSSFiles(colorSystem, {
  outputVariant: 'combined'
});

// Outputs:
// - colors-combined.css (with @media queries)
```

### Full Output with Utilities

```typescript
const cssFiles = generateCSSFiles(colorSystem, {
  outputVariant: 'full',
  generateUtilityClasses: true
});

// Outputs:
// - colors-full.css (everything in one file)
// - colors-utilities.css (utility classes)
```

### Custom Prefix

```typescript
const cssFiles = generateCSSFiles(colorSystem, {
  cssPrefix: '--theme-color'
});

// Generates: --theme-color-blue-1 instead of --color-blue-1
```

### String-only Generation

```typescript
import { generateCSSForColorSystem } from '@design/color-generation-css';

const css = generateCSSForColorSystem(colorSystem, {
  includeAlpha: true,
  generateUtilityClasses: true
});

console.log(css.light);      // Light mode CSS
console.log(css.dark);       // Dark mode CSS
console.log(css.combined);   // Combined CSS with media queries
console.log(css.utilities);  // Utility classes
```

## 🎨 Output Variants

### Separate Files
- **colors-light.css**: Light mode custom properties only
- **colors-dark.css**: Dark mode custom properties only
- Best for: Build systems that handle mode switching

### Combined Files
- **colors-combined.css**: Both modes with `@media (prefers-color-scheme)`
- Best for: Simple implementations with automatic mode switching

### Full Files
- **colors-full.css**: All colors, variants, and modes in one file
- Best for: Quick prototyping and testing

## 🛠 Integration Examples

### With Build Tools

```typescript
import { writeFileSync } from 'fs';
import { generateCSSFiles } from '@design/color-generation-css';

const cssFiles = generateCSSFiles(colorSystem);

cssFiles.forEach(file => {
  writeFileSync(`./dist/css/${file.filename}`, file.content);
});
```

### With PostCSS

```typescript
import postcss from 'postcss';
import { generateCSSForColorSystem } from '@design/color-generation-css';

const css = generateCSSForColorSystem(colorSystem);
const processed = await postcss([
  // your PostCSS plugins
]).process(css.combined, { from: undefined });
```

### With Sass/SCSS

```typescript
// Generate CSS custom properties
const cssFiles = generateCSSFiles(colorSystem, {
  outputVariant: 'separate'
});

// Include in Sass files:
// @import 'colors-light.css';
// @import 'colors-dark.css';
```

## 🧪 Testing

```bash
# Run tests
bun test

# Test with different configurations
bun test --coverage

# Watch mode
bun test --watch
```

## 🛠 Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run linting
bun run lint

# Format code
bun run format
```

## 🎯 Performance

- **Optimized output**: Minimal CSS with no redundancy
- **Treeshaking friendly**: Only includes requested variants
- **Efficient selectors**: Uses CSS custom properties for better performance
- **Small bundle size**: Typically 2-5KB per color set

## 🤝 Related Packages

- **[@design/color-generation-core](../color-generation-core)** - Core color generation
- **[@design/color-generation-json](../color-generation-json)** - JSON output formats
- **[@design/cli](../cli)** - Command-line interface

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details. 