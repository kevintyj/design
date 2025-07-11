# @design/color-generation-core

Core color generation logic using Radix UI color methodology for generating comprehensive color scales.

## 🎨 Features

- **12-step color progressions** using Radix UI methodology
- **Alpha channel variants** for transparency effects
- **Wide gamut P3 support** for modern displays
- **Contextual gray scales** for each color
- **Special colors** (contrast, surface, indicator)
- **TypeScript support** with full type safety
- **Validation utilities** for color definitions

## 📦 Installation

```bash
bun add @design/color-generation-core
```

## 🚀 Quick Start

```typescript
import { 
  loadColorDefinitions,
  generateColorSystem,
  validateColorInput 
} from '@design/color-generation-core';

// Load colors from file
const colorInput = await loadColorDefinitions('./base.ts');

// Validate color definitions
validateColorInput(colorInput);

// Generate complete color system
const colorSystem = generateColorSystem(colorInput, {
  includeAlpha: true,
  includeWideGamut: true,
  includeGrayScale: true,
  includeOverlays: true
});

console.log(`Generated ${colorSystem.metadata.totalScales} color scales`);
```

## 📖 API Reference

### Types

#### `ColorInput`
```typescript
interface ColorInput {
  light: ColorDefinition;
  dark: ColorDefinition;
  constants: {
    light: ColorConstants;
    dark: ColorConstants;
  };
}
```

#### `ColorSystem`
```typescript
interface ColorSystem {
  light: Record<string, ColorScale>;
  dark: Record<string, ColorScale>;
  colorNames: string[];
  sourceColors: ColorInput;
  metadata: {
    generatedAt: string;
    totalColors: number;
    totalScales: number;
    config: Required<GenerationConfig>;
  };
}
```

#### `GenerationConfig`
```typescript
interface GenerationConfig {
  includeAlpha?: boolean;        // Default: true
  includeWideGamut?: boolean;   // Default: true
  includeGrayScale?: boolean;   // Default: true
  includeOverlays?: boolean;    // Default: true
}
```

### Functions

#### `generateColorSystem(colorInput, config?)`

Generates a complete color system with all scales and variants.

**Parameters:**
- `colorInput: ColorInput` - Color definitions for light and dark modes
- `config?: GenerationConfig` - Optional configuration

**Returns:** `ColorSystem`

#### `loadColorDefinitions(filePath)`

Loads color definitions from a TypeScript/JavaScript file.

**Parameters:**
- `filePath: string` - Path to the color definition file

**Returns:** `Promise<ColorInput>`

#### `validateColorInput(colorInput)`

Validates color input structure and throws descriptive errors.

**Parameters:**
- `colorInput: ColorInput` - Color definitions to validate

**Throws:** Error with validation details

#### `createColorInput(light, dark, lightConstants, darkConstants)`

Creates a color input object from separate definitions.

**Parameters:**
- `light: ColorDefinition` - Light mode colors
- `dark: ColorDefinition` - Dark mode colors  
- `lightConstants: ColorConstants` - Light mode constants
- `darkConstants: ColorConstants` - Dark mode constants

**Returns:** `ColorInput`

#### `getColorScale(colorSystem, colorName, appearance)`

Retrieves a specific color scale from the system.

**Parameters:**
- `colorSystem: ColorSystem` - Generated color system
- `colorName: string` - Name of the color
- `appearance: "light" | "dark"` - Color mode

**Returns:** `ColorScale`

## 🎯 Color Scale Structure

Each generated color scale includes:

### Main Scale (1-12)
- **Steps 1-2**: Backgrounds, subtle borders
- **Steps 3-5**: UI component backgrounds
- **Steps 6-8**: Borders, separators  
- **Steps 9-10**: Solid backgrounds, primary actions
- **Steps 11-12**: High contrast text, active states

### Alpha Variants (a1-a12)
- Semi-transparent versions of each step
- Perfect for overlays and subtle backgrounds

### Wide Gamut P3 (p3-1 to p3-12)
- Enhanced color range for modern displays
- Uses oklch() color space
- Automatic fallback to sRGB

### Special Colors
- `contrast`: High contrast text color
- `surface`: Subtle background overlay
- `indicator`: Status/accent color

## 💡 Usage Examples

### Basic Generation

```typescript
import { createColorInput, generateColorSystem } from '@design/color-generation-core';

const colorInput = createColorInput(
  { primary: '#0066CC', secondary: '#6366F1' },
  { primary: '#3B82F6', secondary: '#8B5CF6' },
  { gray: '#6B7280', background: '#FFFFFF' },
  { gray: '#9CA3AF', background: '#111827' }
);

const colorSystem = generateColorSystem(colorInput);
```

### Custom Configuration

```typescript
const colorSystem = generateColorSystem(colorInput, {
  includeAlpha: false,      // Skip alpha variants
  includeWideGamut: false,  // Skip P3 colors
  includeGrayScale: true,   // Include gray scales
  includeOverlays: false    // Skip overlay colors
});
```

### Accessing Generated Colors

```typescript
// Get a specific color scale
const blueScale = getColorScale(colorSystem, 'blue', 'light');

// Access specific color steps
console.log(blueScale.accentScale[0]);  // Blue-1
console.log(blueScale.accentScale[11]); // Blue-12
console.log(blueScale.accentContrast);  // Contrast color
```

### File-based Loading

```typescript
// base.ts
export const light = {
  primary: '#0066CC',
  secondary: '#6366F1'
};

export const dark = {
  primary: '#3B82F6', 
  secondary: '#8B5CF6'
};

export const constantsLight = {
  gray: '#6B7280',
  background: '#FFFFFF'
};

export const constantsDark = {
  gray: '#9CA3AF',
  background: '#111827'
};

// usage.ts
const colorInput = await loadColorDefinitions('./base.ts');
const colorSystem = generateColorSystem(colorInput);
```

## 🧪 Testing

```bash
# Run tests
bun test

# Run with coverage
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

## 📊 Generated Metadata

The color system includes rich metadata:

```typescript
{
  generatedAt: "2024-01-01T12:00:00.000Z",
  totalColors: 2,
  totalScales: 4,  // 2 colors × 2 modes
  config: {
    includeAlpha: true,
    includeWideGamut: true,
    includeGrayScale: true,
    includeOverlays: true
  }
}
```

## 🎨 Color Methodology

This package implements the Radix UI color methodology:

1. **Semantic Color Steps**: Each step has a specific purpose in UI design
2. **Perceptual Uniformity**: Colors are perceptually uniform across the scale
3. **Accessibility**: Automatic contrast calculation and validation
4. **Contextual Grays**: Gray scales that harmonize with each color

## 🤝 Related Packages

- **[@design/color-generation-css](../color-generation-css)** - Generate CSS output
- **[@design/color-generation-json](../color-generation-json)** - Generate JSON output
- **[@design/cli](../cli)** - Command-line interface

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details. 