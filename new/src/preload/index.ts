import { contextBridge, ipcRenderer } from 'electron';

// Define types for the exposed API
export interface OllamaApi {
  getModels: () => Promise<any[]>;
  getFirstAvailableModel: () => Promise<string | null>;
  chat: (request: any) => Promise<AsyncIterable<string>>;
  generate: (request: any) => Promise<AsyncIterable<string>>;
  pullModel: (modelName: string) => Promise<void>;
  getStatus: () => any;
}

export interface ConversationsApi {
  getConversations: () => any[];
  getConversation: (id: string) => any | null;
  getCurrentConversation: () => any | null;
  setCurrentConversation: (id: string | null) => void;
  createConversation: (options: any) => any;
  deleteConversation: (id: string) => boolean;
  updateConversationTitle: (id: string, title: string) => boolean;
  addMessage: (conversationId: string, message: any) => any | null;
  updateMessage: (conversationId: string, messageId: string, updates: any) => boolean;
  deleteMessage: (conversationId: string, messageId: string) => boolean;
  clearMessages: (conversationId: string) => boolean;
  searchConversations: (query: string) => any[];
}

export interface McpApi {
  getServers: () => any[];
  getServer: (serverId: string) => any | null;
  getAllTools: () => Promise<any[]>;
  callTool: (serverId: string, toolName: string, input: any) => Promise<any>;
  addCustomServer: (config: any) => Promise<any>;
  removeCustomServer: (serverId: string) => Promise<boolean>;
  startServer: (config: any) => Promise<any>;
  stopServer: (serverId: string) => Promise<boolean>;
}

export interface SettingsApi {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  getAll: () => any;
}

export interface WindowApi {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

// Expose APIs to renderer
export const api = {
  ollama: {
    getModels: () => ipcRenderer.invoke('ollama-getModels'),
    getFirstAvailableModel: () => ipcRenderer.invoke('ollama-getFirstAvailableModel'),
    chat: (request: any) => {
      // For streaming, we need a different approach
      return new Promise<AsyncIterable<string>>((resolve) => {
        const channel = `ollama-chat-${Date.now()}`;
        ipcRenderer.send('ollama-chat-start', { request, channel });
        
        const iterable = {
          [Symbol.asyncIterator]() {
            let isDone = false;
            return {
              next() {
                return new Promise((resolve, reject) => {
                  if (isDone) {
                    resolve({ done: true, value: undefined });
                    return;
                  }
                  
                  ipcRenderer.once(`${channel}-chunk`, (_, chunk: string) => {
                    resolve({ done: false, value: chunk });
                  });
                  
                  ipcRenderer.once(`${channel}-end`, () => {
                    isDone = true;
                    resolve({ done: true, value: undefined });
                  });
                  
                  ipcRenderer.once(`${channel}-error`, (_, error: string) => {
                    isDone = true;
                    reject(new Error(error));
                  });
                });
              },
            };
          },
        };
        
        resolve(iterable);
      });
    },
    generate: (request: any) => {
      return new Promise<AsyncIterable<string>>((resolve) => {
        const channel = `ollama-generate-${Date.now()}`;
        ipcRenderer.send('ollama-generate-start', { request, channel });
        
        const iterable = {
          [Symbol.asyncIterator]() {
            let isDone = false;
            return {
              next() {
                return new Promise((resolve, reject) => {
                  if (isDone) {
                    resolve({ done: true, value: undefined });
                    return;
                  }
                  
                  ipcRenderer.once(`${channel}-chunk`, (_, chunk: string) => {
                    resolve({ done: false, value: chunk });
                  });
                  
                  ipcRenderer.once(`${channel}-end`, () => {
                    isDone = true;
                    resolve({ done: true, value: undefined });
                  });
                  
                  ipcRenderer.once(`${channel}-error`, (_, error: string) => {
                    isDone = true;
                    reject(new Error(error));
                  });
                });
              },
            };
          },
        };
        
        resolve(iterable);
      });
    },
    pullModel: (modelName: string) => ipcRenderer.invoke('ollama-pullModel', modelName),
    getStatus: () => ipcRenderer.invoke('ollama-getStatus'),
  },
  conversations: {
    getConversations: () => ipcRenderer.invoke('conversations-getConversations'),
    getConversation: (id: string) => ipcRenderer.invoke('conversations-getConversation', id),
    getCurrentConversation: () => ipcRenderer.invoke('conversations-getCurrentConversation'),
    setCurrentConversation: (id: string | null) => ipcRenderer.invoke('conversations-setCurrentConversation', id),
    createConversation: (options: any) => ipcRenderer.invoke('conversations-createConversation', options),
    deleteConversation: (id: string) => ipcRenderer.invoke('conversations-deleteConversation', id),
    updateConversationTitle: (id: string, title: string) => ipcRenderer.invoke('conversations-updateConversationTitle', id, title),
    addMessage: (conversationId: string, message: any) => ipcRenderer.invoke('conversations-addMessage', conversationId, message),
    updateMessage: (conversationId: string, messageId: string, updates: any) => ipcRenderer.invoke('conversations-updateMessage', conversationId, messageId, updates),
    deleteMessage: (conversationId: string, messageId: string) => ipcRenderer.invoke('conversations-deleteMessage', conversationId, messageId),
    clearMessages: (conversationId: string) => ipcRenderer.invoke('conversations-clearMessages', conversationId),
    searchConversations: (query: string) => ipcRenderer.invoke('conversations-searchConversations', query),
  },
  mcp: {
    getServers: () => ipcRenderer.invoke('mcp-getServers'),
    getServer: (serverId: string) => ipcRenderer.invoke('mcp-getServer', serverId),
    getAllTools: () => ipcRenderer.invoke('mcp-getAllTools'),
    callTool: (serverId: string, toolName: string, input: any) => ipcRenderer.invoke('mcp-callTool', serverId, toolName, input),
    addCustomServer: (config: any) => ipcRenderer.invoke('mcp-addCustomServer', config),
    removeCustomServer: (serverId: string) => ipcRenderer.invoke('mcp-removeCustomServer', serverId),
    startServer: (config: any) => ipcRenderer.invoke('mcp-startServer', config),
    stopServer: (serverId: string) => ipcRenderer.invoke('mcp-stopServer', serverId),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings-set', key, value),
    getAll: () => ipcRenderer.invoke('settings-getAll'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
  },
};

// Expose to window
contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: {
      ollama: OllamaApi;
      conversations: ConversationsApi;
      mcp: McpApi;
      settings: SettingsApi;
      window: WindowApi;
    };
  }
}
