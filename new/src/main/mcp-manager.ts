import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  tools: MCPTool[];
  process?: ChildProcessWithoutNullStreams;
  transport?: StdioServerTransport;
  server?: Server;
}

export class MCPManager {
  private servers: MCPServer[] = [];
  private isInitialized: boolean = false;

  constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Load built-in MCP servers
    await this.loadBuiltInServers();
    
    this.isInitialized = true;
  }

  private async loadBuiltInServers(): Promise<void> {
    // Built-in MCP servers that come with Claude Desktop
    const builtInServers: Partial<MCPServer>[] = [
      {
        id: 'filesystem',
        name: 'File System',
        command: 'node',
        args: [path.join(__dirname, '../../resources/built-in-mcp/filesystem.js')],
        env: {},
      },
      {
        id: 'git',
        name: 'Git',
        command: 'node',
        args: [path.join(__dirname, '../../resources/built-in-mcp/git.js')],
        env: {},
      },
      {
        id: 'web-search',
        name: 'Web Search',
        command: 'node',
        args: [path.join(__dirname, '../../resources/built-in-mcp/web-search.js')],
        env: {},
      },
    ];

    for (const serverConfig of builtInServers) {
      try {
        await this.startServer(serverConfig as MCPServer);
      } catch (error) {
        console.error(`Failed to start MCP server: ${serverConfig.name}`, error);
      }
    }
  }

  async startServer(serverConfig: MCPServer): Promise<MCPServer> {
    const server: MCPServer = { ...serverConfig };

    try {
      // Spawn the process
      server.process = spawn(server.command, server.args, {
        env: { ...process.env, ...server.env },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      // Create transport
      server.transport = new StdioServerTransport({
        stdin: server.process.stdin,
        stdout: server.process.stdout,
      });

      // Create server
      server.server = new Server(
        { name: server.name, version: '1.0.0' },
        { capabilities: { tools: {} } }
      );

      // Connect transport to server
      await server.server.connect(server.transport);

      // Initialize and get tools
      await server.server.initialize();
      const tools = await server.server.tools.list();
      server.tools = tools.map(tool => ({
        id: tool.name,
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
      }));

      this.servers.push(server);
      return server;
    } catch (error) {
      // Cleanup on error
      if (server.process) {
        server.process.kill();
      }
      throw error;
    }
  }

  async stopServer(serverId: string): Promise<boolean> {
    const server = this.servers.find(s => s.id === serverId);
    if (!server || !server.process) return false;

    try {
      server.process.kill();
      if (server.server) {
        await server.server.close();
      }
      return true;
    } catch {
      return false;
    }
  }

  getServers(): MCPServer[] {
    return [...this.servers];
  }

  getServer(serverId: string): MCPServer | null {
    return this.servers.find(s => s.id === serverId) || null;
  }

  async getAllTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    for (const server of this.servers) {
      allTools.push(...server.tools);
    }
    return allTools;
  }

  async callTool(serverId: string, toolName: string, input: any): Promise<any> {
    const server = this.getServer(serverId);
    if (!server || !server.server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    try {
      const result = await server.server.tools.call({
        name: toolName,
        arguments: input,
      });
      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on server ${serverId}:`, error);
      throw error;
    }
  }

  async addCustomServer(config: Omit<MCPServer, 'id' | 'tools' | 'process' | 'transport' | 'server'>): Promise<MCPServer> {
    const server: MCPServer = {
      ...config,
      id: `custom-${Date.now()}`,
      tools: [],
    };

    await this.startServer(server);
    return server;
  }

  async removeCustomServer(serverId: string): Promise<boolean> {
    const index = this.servers.findIndex(s => s.id === serverId);
    if (index === -1) return false;

    const server = this.servers[index];
    await this.stopServer(serverId);
    this.servers.splice(index, 1);
    return true;
  }

  getApi() {
    return {
      getServers: this.getServers.bind(this),
      getServer: this.getServer.bind(this),
      getAllTools: this.getAllTools.bind(this),
      callTool: this.callTool.bind(this),
      addCustomServer: this.addCustomServer.bind(this),
      removeCustomServer: this.removeCustomServer.bind(this),
      startServer: this.startServer.bind(this),
      stopServer: this.stopServer.bind(this),
    };
  }
}
