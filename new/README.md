# Ollama Desktop

A fork of Claude Desktop that runs entirely locally using Ollama. No account required, no cloud dependencies, all your data stays on your machine.

## Features

- **Local AI Inference**: Uses Ollama to run AI models locally on your machine
- **No Account Required**: No login, no authentication, completely offline
- **No Telemetry**: Zero tracking, zero analytics
- **Full Feature Set**: Preserves all Claude Desktop features including:
  - Conversation history
  - Projects organization
  - Artifacts and file uploads
  - MCP (Model Context Protocol) support
  - Markdown rendering with code highlighting
  - Streaming responses
  - Multiple model support

## Requirements

- [Node.js](https://nodejs.org/) 18+ (recommended: 20+)
- [Ollama](https://ollama.ai/) installed and running
- [Yarn](https://yarnpkg.com/) or npm

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ollama-desktop
   ```

2. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```

3. Start the development server:
   ```bash
   yarn dev
   # or
   npm run dev
   ```

4. Build for production:
   ```bash
   yarn build
   # or
   npm run build
   ```

## Usage

1. Make sure Ollama is running on your machine
2. Launch Ollama Desktop
3. Select a model from the dropdown (or let it auto-select the first available)
4. Start chatting!

## Configuration

The app will automatically:
- Detect installed Ollama models
- Use the first available model if none is selected
- Save conversation history locally
- Remember your preferences

## Project Structure

```
ollama-desktop/
├── src/
│   ├── main/              # Main process (Electron)
│   │   ├── index.ts       # Main entry point
│   │   ├── ollama-service.ts # Ollama integration
│   │   ├── conversation-manager.ts # Conversation management
│   │   └── mcp-manager.ts # MCP server management
│   ├── preload/           # Preload script
│   │   └── index.ts       # Exposes APIs to renderer
│   └── renderer/          # Renderer process (React)
│       ├── App.tsx        # Main app component
│       ├── components/    # React components
│       ├── hooks/         # React hooks
│       └── styles/        # CSS styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Differences from Claude Desktop

### Removed
- All login/authentication functionality
- Subscription and plan management
- Account settings
- Usage limits
- Telemetry and analytics
- Cloud synchronization
- Update checks that depend on Anthropic
- Anthropic branding

### Replaced
- Anthropic API backend → Ollama local backend
- Cloud model selection → Local model selection
- Cloud-based conversation sync → Local file-based storage

### Preserved
- All UI elements, animations, and styling
- All keyboard shortcuts
- All features that can work locally
- MCP support
- Artifacts
- File uploads
- Code rendering
- Markdown rendering
- Search UI
- Projects
- Conversation history

## Customization

You can customize the app by modifying the settings in the Settings view:
- **Theme**: Light, Dark, or System
- **Model**: Select which Ollama model to use
- **Download Models**: Add new models from Ollama's library

## MCP Servers

The app comes with built-in MCP servers for:
- File System access
- Git operations
- Web search (local implementation)

You can also add custom MCP servers in the MCP view.

## Building

To build the app for distribution:

```bash
# Install electron-builder
npm install electron-builder --save-dev

# Build for your platform
npm run build
```

This will create platform-specific installers in the `dist` directory.

## License

This project is a fork of Claude Desktop, modified to work with local Ollama models.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

- [Ollama](https://ollama.ai/) - Local AI inference
- [Claude Desktop](https://claude.ai/) - Original application this is based on
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
