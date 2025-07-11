# @design/figma-plugin

Figma plugin for design system management. Generate, import, and manage color systems directly within Figma using the design system generation tools.

## 🎨 Features

- **Color System Import** from base.ts configuration files
- **Interactive UI** with React and TypeScript
- **Variable Management** with automatic collection creation
- **Real-time Preview** of generated color scales
- **Export Capabilities** to multiple formats (CSS, JSON, Figma variables)
- **Validation Tools** for color definitions
- **Performance Optimized** for large color systems

## 📦 Installation

### Development Setup

```bash
# Install dependencies
bun install

# Start development mode
bun run dev

# Build for production
bun run build
```

### Plugin Installation

1. Build the plugin: `bun run build`
2. Open Figma Desktop App
3. Go to **Plugins** → **Development** → **Import plugin from manifest**
4. Select the `manifest.json` file from this package
5. The plugin will appear in your plugins list

## 🚀 Quick Start

### Basic Usage

1. **Open the Plugin**: Plugins → Development → Design System Manager
2. **Configure Tab**: Upload or paste your `base.ts` configuration
3. **Generate**: Click "Generate Color System" 
4. **Variables Tab**: Create Figma variables from your color system
5. **Export Tab**: Export to CSS, JSON, or Figma format

### Configuration Format

The plugin expects a `base.ts` file with this structure:

```typescript
export const light = {
  primary: '#0066CC',
  secondary: '#6366F1',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626'
};

export const dark = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

export const constantsLight = {
  gray: '#6B7280',
  background: '#FFFFFF'
};

export const constantsDark = {
  gray: '#9CA3AF',
  background: '#111827'
};
```

## 🎯 Plugin Interface

### Main Tabs

#### 1. Configure Tab
- **File Upload**: Drag & drop `base.ts` files
- **Manual Input**: Paste configuration directly
- **Validation**: Real-time validation of color definitions
- **Preview**: See color scales before generation

#### 2. Variables Tab
- **Collection Management**: Create and manage variable collections
- **Mode Setup**: Configure light/dark modes
- **Batch Import**: Import all colors as variables
- **Naming Options**: Customize variable naming conventions

#### 3. Export Tab
- **Format Selection**: Choose CSS, JSON, or Figma formats
- **Download Options**: Export generated files
- **Copy to Clipboard**: Quick copying for small exports
- **Batch Export**: Export multiple formats at once

#### 4. Preferences Tab
- **Color Settings**: Configure generation options
- **UI Preferences**: Customize plugin interface
- **Performance**: Optimize for large color systems
- **Sync Settings**: Save preferences across sessions

## 📖 Plugin Components

### ConfigureTab Component

```typescript
interface ConfigureTabProps {
  onConfigurationChange: (config: ColorInput) => void;
  currentConfig?: ColorInput;
}
```

**Features:**
- File dropzone for `base.ts` uploads
- Code editor with syntax highlighting
- Real-time validation feedback
- Color preview grid

### VariablesTab Component

```typescript
interface VariablesTabProps {
  colorSystem: ColorSystem;
  onVariablesCreated: (collections: VariableCollection[]) => void;
}
```

**Features:**
- Variable collection creation
- Light/dark mode management
- Batch variable import
- Naming pattern configuration

### ExportTab Component

```typescript
interface ExportTabProps {
  colorSystem: ColorSystem;
  generatedFiles: GeneratedFile[];
}
```

**Features:**
- Multiple export formats
- Download management
- Preview before export
- Compression options

## 🛠 Development

### Project Structure

```
src/
├── components/           # React components
│   ├── ConfigureTab.tsx
│   ├── VariablesTab.tsx
│   ├── ExportTab.tsx
│   └── PreferencesTab.tsx
├── hooks/               # Custom React hooks
│   ├── useFileHandling.ts
│   └── usePluginMessaging.ts
├── utils/               # Utility functions
│   ├── constants.ts
│   └── download.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── code.ts              # Figma plugin backend
├── ui.tsx               # React UI entry point
├── ui.css               # Styles
└── ui.html              # HTML template
```

### Build System

```bash
# Development with hot reload
bun run dev

# Production build
bun run build

# Type checking
bun run type-check

# Linting
bun run lint
```

### Webpack Configuration

The plugin uses a custom Webpack configuration optimized for Figma:

- **Code Bundle**: Backend plugin logic (`code.ts`)
- **UI Bundle**: React frontend (`ui.tsx`)
- **Asset Optimization**: Minimized for plugin performance
- **TypeScript**: Full type checking and compilation

## 🎨 Plugin API

### Figma Plugin Backend (`code.ts`)

```typescript
// Message handling
figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case 'generate-colors':
      handleColorGeneration(msg.config);
      break;
    case 'create-variables':
      handleVariableCreation(msg.variables);
      break;
    case 'export-system':
      handleSystemExport(msg.format);
      break;
  }
};

// Variable creation
async function createColorVariables(colorSystem: ColorSystem) {
  const collection = figma.variables.createVariableCollection('Design System Colors');
  
  // Create light and dark modes
  const lightMode = collection.modes[0];
  const darkMode = collection.addMode('Dark');
  
  // Create variables for each color
  for (const [colorName, colorScale] of Object.entries(colorSystem.light)) {
    const variable = figma.variables.createVariable(colorName, collection, 'COLOR');
    
    // Set values for each mode
    variable.setValueForMode(lightMode.modeId, colorScale.accentScale[0]);
    variable.setValueForMode(darkMode.modeId, colorSystem.dark[colorName].accentScale[0]);
  }
}
```

### React UI Components

```typescript
// usePluginMessaging hook
export function usePluginMessaging() {
  const sendMessage = useCallback((message: PluginMessage) => {
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);

  const handleMessage = useCallback((handler: MessageHandler) => {
    window.onmessage = (event) => {
      const { pluginMessage } = event.data;
      if (pluginMessage) {
        handler(pluginMessage);
      }
    };
  }, []);

  return { sendMessage, handleMessage };
}
```

## 🎯 Usage Examples

### Importing Color System

```typescript
// In the plugin UI
const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    sendMessage({
      type: 'import-config',
      data: { content, filename: file.name }
    });
  };
  reader.readAsText(file);
};
```

### Creating Variables

```typescript
// Generate and create variables
const handleCreateVariables = async () => {
  const colorSystem = await generateColorSystem(colorInput);
  
  sendMessage({
    type: 'create-variables',
    data: {
      colorSystem,
      options: {
        collectionName: 'Design System',
        createModes: ['Light', 'Dark'],
        namingPattern: '{color}/{step}'
      }
    }
  });
};
```

### Exporting System

```typescript
// Export to multiple formats
const handleExport = () => {
  sendMessage({
    type: 'export-system',
    data: {
      formats: ['css', 'json', 'figma'],
      options: {
        prettyPrint: true,
        includeMetadata: true
      }
    }
  });
};
```

## 🧪 Testing

```bash
# Unit tests
bun test

# Component tests
bun test:components

# Integration tests with Figma API
bun test:integration
```

## 🚀 Publishing

### Plugin Store Submission

1. **Build Production**: `bun run build`
2. **Test Thoroughly**: Ensure all features work
3. **Create Manifest**: Update version and metadata
4. **Submit to Figma**: Follow Figma's plugin submission process

### Version Management

```json
{
  "version": "1.0.0",
  "name": "Design System Manager",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html"
}
```

## 🎯 Roadmap

### Current Features
- ✅ Color system import and generation
- ✅ Figma variable creation
- ✅ Multiple export formats
- ✅ Real-time validation

### Upcoming Features
- 🚧 Spacing system support
- 🚧 Typography scale generation
- 🚧 Component primitive creation
- 🚧 Design token synchronization
- 🚧 Team collaboration features

## 🤝 Related Packages

- **[@design/color-generation-core](../color-generation-core)** - Core color generation logic
- **[@design/color-generation-css](../color-generation-css)** - CSS output generation
- **[@design/color-generation-json](../color-generation-json)** - JSON output generation
- **[@design/figma-to-json](../figma-to-json)** - Figma variable export

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details. 