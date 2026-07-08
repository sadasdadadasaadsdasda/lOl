import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { OllamaService } from './ollama-service';
import { ConversationManager } from './conversation-manager';
import { MCPManager } from './mcp-manager';
import ElectronStore from 'electron-store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize services
const ollamaService = new OllamaService();
const conversationManager = new ConversationManager();
const mcpManager = new MCPManager();

// Store for settings
const settingsStore = new ElectronStore({
  defaults: {
    selectedModel: '',
    theme: 'system',
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#000000',
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Handle window controls
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.close();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Initialize app
app.whenReady().then(() => {
  // Initialize Ollama service
  ollamaService.initialize();
  
  // Initialize MCP manager
  mcpManager.initialize();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Expose APIs to renderer
export const api = {
  ollama: ollamaService.getApi(),
  conversations: conversationManager.getApi(),
  mcp: mcpManager.getApi(),
  settings: {
    get: (key: string) => settingsStore.get(key),
    set: (key: string, value: any) => settingsStore.set(key, value),
    getAll: () => settingsStore.store,
  },
};
