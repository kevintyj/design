# @design/spacing-generation-core

Core spacing generation logic for design system spacing scales with 4px base multiplier system and comprehensive utilities.

## 📏 Features

- **26 spacing values** from 0px to 80px with 4px base multiplier
- **Pixel and REM variants** for flexible sizing (16px = 1rem)
- **Utility naming** compatible with Tailwind CSS conventions
- **TypeScript support** with full type safety
- **Validation utilities** for spacing definitions
- **Metadata generation** with comprehensive spacing information

## 📦 Installation

```bash
bun add @design/spacing-generation-core
```

## 🚀 Quick Start

```typescript
import { 
  loadSpacingDefinitions,
  generateSpacingSystem,
  validateSpacingInput 
} from '@design/spacing-generation-core';

// Load spacing from file
const spacingInput = await loadSpacingDefinitions('./base.ts');

// Validate spacing definitions
validateSpacingInput(spacingInput);

// Generate complete spacing system
const spacingSystem = generateSpacingSystem(spacingInput, {
  generateRem: true,
  remBase: 16
});

console.log(`Generated ${spacingSystem.metadata.totalValues} spacing values`);
```

## 📖 API Reference

### Types

#### `SpacingInput`
```typescript
interface SpacingInput {
  spacing: Record<string, number>;
  multiplier: number;
}
```

#### `SpacingSystem`
```typescript
interface SpacingSystem {
  spacing: {
    values: Record<string, number>;      // Raw pixel values
    remValues: Record<string, string>;   // REM equivalents
    pxValues: Record<string, string>;    // Formatted px values
    multiplier: number;                  // Base multiplier (4)
  };
  metadata: {
    generatedAt: string;
    totalValues: number;
    baseMultiplier: number;
    remBase: number;
    config: Required<SpacingGenerationConfig>;
  };
}
```

#### `SpacingGenerationConfig`
```typescript
interface SpacingGenerationConfig {
  generateRem?: boolean;     // Generate REM values (default: true)
  remBase?: number;          // REM base size in px (default: 16)
}
```

### Functions

#### `generateSpacingSystem(spacingInput, config?)`

Generates a complete spacing system with px and rem variants.

**Parameters:**
- `spacingInput: SpacingInput` - Spacing definitions with multiplier
- `config?: SpacingGenerationConfig` - Optional configuration

**Returns:** `SpacingSystem`

#### `loadSpacingDefinitions(filePath)`

Loads spacing definitions from a TypeScript/JavaScript file.

**Parameters:**
- `filePath: string` - Path to the spacing definition file

**Returns:** `Promise<SpacingInput>`

#### `validateSpacingInput(spacingInput)`

Validates spacing input structure and throws descriptive errors.

**Parameters:**
- `spacingInput: SpacingInput` - Spacing definitions to validate

**Throws:** Error with validation details

#### `createSpacingInput(spacing, multiplier)`

Creates a spacing input object from spacing definitions.

**Parameters:**
- `spacing: Record<string, number>` - Spacing value definitions
- `multiplier: number` - Base multiplier (typically 4)

**Returns:** `SpacingInput`

### Utility Functions

#### `pxToRem(px, remBase?)`

Converts pixel values to REM units.

**Parameters:**
- `px: number` - Pixel value to convert
- `remBase?: number` - REM base size (default: 16)

**Returns:** `string`

#### `remToPx(rem, remBase?)`

Converts REM values to pixel units.

**Parameters:**
- `rem: string | number` - REM value to convert
- `remBase?: number` - REM base size (default: 16)

**Returns:** `number`

## 🎯 Spacing Scale Structure

### Default Spacing Values (26 total)

**Core Values:**
- `0`: 0px
- `1`: 4px  
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px

**Extended Values:**
- `6` through `20`: 24px to 80px (4px increments)

**Pixel Variants:**
- `px`: 1px
- `2px`: 2px
- `3px`: 3px
- `5px`: 5px
- `6px`: 6px
- `10px`: 10px
- `14px`: 14px

### Generated Output

```typescript
// Raw values
spacing.values = {
  "0": 0,
  "px": 1,
  "1": 4,
  "2": 8,
  "4": 16
  // ... etc
}

// Formatted pixel values
spacing.pxValues = {
  "0": "0px",
  "px": "1px", 
  "1": "4px",
  "2": "8px",
  "4": "16px"
  // ... etc
}

// REM values
spacing.remValues = {
  "0": "0rem",
  "px": "0.0625rem",
  "1": "0.25rem", 
  "2": "0.5rem",
  "4": "1rem"
  // ... etc
}
```

## 💡 Usage Examples

### Basic Generation

```typescript
import { createSpacingInput, generateSpacingSystem } from '@design/spacing-generation-core';

const spacingInput = createSpacingInput({
  "0": 0,
  "1": 4,
  "2": 8,
  "4": 16,
  "px": 1
}, 4);

const spacingSystem = generateSpacingSystem(spacingInput);
```

### Custom Configuration

```typescript
const spacingSystem = generateSpacingSystem(spacingInput, {
  generateRem: true,      // Include REM variants
  remBase: 14            // Use 14px as REM base instead of 16px
});
```

### File-based Loading

```typescript
// base.ts
export const spacing = {
  "0": 0,
  "px": 1,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
  "20": 80
};

export const multiplier = 4;

// usage.ts
const spacingInput = await loadSpacingDefinitions('./base.ts');
const spacingSystem = generateSpacingSystem(spacingInput);
```

### Accessing Generated Values

```typescript
// Get raw pixel values
console.log(spacingSystem.spacing.values["4"]);     // 16

// Get formatted pixel strings
console.log(spacingSystem.spacing.pxValues["4"]);   // "16px"

// Get REM equivalents
console.log(spacingSystem.spacing.remValues["4"]);  // "1rem"

// Check multiplier
console.log(spacingSystem.spacing.multiplier);      // 4
```

### Validation

```typescript
import { validateSpacingInput } from '@design/spacing-generation-core';

try {
  validateSpacingInput(spacingInput);
  console.log('Spacing definitions are valid');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

## 🧮 Mathematical Operations

### Conversion Utilities

```typescript
import { pxToRem, remToPx } from '@design/spacing-generation-core';

// Convert pixels to REM
const remValue = pxToRem(16);        // "1rem"
const remValue14 = pxToRem(16, 14);  // "1.143rem" (using 14px base)

// Convert REM to pixels
const pxValue = remToPx("1rem");     // 16
const pxValue14 = remToPx("1rem", 14); // 14
```

### Custom Calculations

```typescript
// Calculate spacing based on multiplier
const spacingSystem = generateSpacingSystem(spacingInput);
const baseSize = spacingSystem.spacing.values["4"];  // 16px
const doubleSize = baseSize * 2;                     // 32px
const halfSize = baseSize / 2;                       // 8px
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

The spacing system includes rich metadata:

```typescript
{
  generatedAt: "2024-01-01T12:00:00.000Z",
  totalValues: 26,
  baseMultiplier: 4,
  remBase: 16,
  config: {
    generateRem: true,
    remBase: 16
  }
}
```

## 🎨 Design Philosophy

### 4px Base System

This package implements a 4px base spacing system:

1. **Consistent Rhythm**: All spacing follows 4px increments
2. **Accessibility**: 4px ensures touch targets meet accessibility guidelines
3. **Flexibility**: Pixel variants provide fine-grained control
4. **Scalability**: REM variants enable responsive scaling

### Tailwind Compatibility

Spacing names are designed to be compatible with Tailwind CSS:

- `0` → `spacing-0` or `m-0`, `p-0`
- `1` → `spacing-1` or `m-1`, `p-1`
- `px` → `spacing-px` or `m-px`, `p-px`

## 🤝 Related Packages

- **[@design/spacing-generation-css](../spacing-generation-css)** - Generate CSS output
- **[@design/spacing-generation-json](../spacing-generation-json)** - Generate JSON output
- **[@design/cli](../cli)** - Command-line interface

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details. 