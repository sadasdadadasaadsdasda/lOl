import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  timestamp?: number;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export class OllamaService {
  private models: OllamaModel[] = [];
  private isOllamaRunning: boolean = false;
  private baseUrl: string = 'http://localhost:11434';

  constructor() {}

  async initialize(): Promise<void> {
    // Check if Ollama is running
    await this.checkOllamaStatus();
    
    // If not running, try to start it
    if (!this.isOllamaRunning) {
      await this.startOllama();
    }
    
    // Fetch available models
    await this.fetchModels();
  }

  private async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      this.isOllamaRunning = response.ok;
      return this.isOllamaRunning;
    } catch {
      this.isOllamaRunning = false;
      return false;
    }
  }

  private async startOllama(): Promise<boolean> {
    try {
      // Try to start Ollama (platform specific)
      const platform = process.platform;
      let command = '';
      
      if (platform === 'darwin') {
        command = 'open -a ollama';
      } else if (platform === 'win32') {
        command = 'start ollama';
      } else {
        command = 'ollama serve';
      }
      
      await execAsync(command);
      
      // Wait for Ollama to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return await this.checkOllamaStatus();
    } catch {
      return false;
    }
  }

  async fetchModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        this.models = data.models || [];
      }
    } catch {
      this.models = [];
    }
    
    return this.models;
  }

  async getModels(): Promise<OllamaModel[]> {
    if (this.models.length === 0) {
      await this.fetchModels();
    }
    return this.models;
  }

  async getFirstAvailableModel(): Promise<string | null> {
    const models = await this.getModels();
    if (models.length > 0) {
      // Prefer these models in order
      const preferredModels = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'phi3'];
      for (const preferred of preferredModels) {
        const found = models.find(m => m.name.startsWith(preferred));
        if (found) return found.name;
      }
      return models[0].name;
    }
    return null;
  }

  async chat(request: ChatRequest): Promise<AsyncIterable<string>> {
    const { model, messages, stream = true, options = {} } = request;
    
    const requestBody = {
      model,
      messages,
      stream,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        top_k: 40,
        ...options,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    if (!stream) {
      const data = await response.json();
      return this.createAsyncIterableFromString(data.response);
    }

    // Handle streaming response
    return this.createStreamIterable(response);
  }

  private async *createStreamIterable(response: any): AsyncIterable<string> {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async *createAsyncIterableFromString(text: string): AsyncIterable<string> {
    yield text;
  }

  async generate(request: { model: string; prompt: string }): Promise<AsyncIterable<string>> {
    const { model, prompt } = request;
    
    const requestBody = {
      model,
      prompt,
      stream: true,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        top_k: 40,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    return this.createStreamIterable(response);
  }

  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    // Wait for pull to complete
    await response.json();
    
    // Refresh models list
    await this.fetchModels();
  }

  getApi() {
    return {
      getModels: this.getModels.bind(this),
      getFirstAvailableModel: this.getFirstAvailableModel.bind(this),
      chat: this.chat.bind(this),
      generate: this.generate.bind(this),
      pullModel: this.pullModel.bind(this),
      getStatus: () => ({
        isRunning: this.isOllamaRunning,
        baseUrl: this.baseUrl,
      }),
    };
  }
}
