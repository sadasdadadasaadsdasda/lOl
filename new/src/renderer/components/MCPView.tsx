import React, { useState, useEffect, useCallback } from 'react';
import { Plug, Plus, MoreVertical, Trash2, Edit, Search, Terminal, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  tools: MCPTool[];
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
}

const MCPView: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewServerInput, setShowNewServerInput] = useState(false);
  const [newServerConfig, setNewServerConfig] = useState({
    name: '',
    command: '',
    args: '',
  });
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTool, setActiveTool] = useState<MCPTool | null>(null);
  const [toolInput, setToolInput] = useState<string>('');
  const [toolOutput, setToolOutput] = useState<string>('');
  const [isCallingTool, setIsCallingTool] = useState(false);

  // Load MCP servers
  useEffect(() => {
    const loadServers = async () => {
      try {
        const servers = await window.electronAPI.mcp.getServers();
        setServers(servers);
        
        // Select first server by default
        if (servers.length > 0) {
          setSelectedServerId(servers[0].id);
        }
      } catch (error) {
        console.error('Failed to load MCP servers:', error);
      }
    };
    
    loadServers();
  }, []);

  // Handle create server
  const handleCreateServer = useCallback(async () => {
    if (newServerConfig.name.trim() === '' || newServerConfig.command.trim() === '') return;
    
    try {
      const server = await window.electronAPI.mcp.addCustomServer({
        name: newServerConfig.name,
        command: newServerConfig.command,
        args: newServerConfig.args.split(' ').filter(Boolean),
        env: {},
      });
      
      setServers(prev => [...prev, server]);
      setNewServerConfig({ name: '', command: '', args: '' });
      setShowNewServerInput(false);
    } catch (error) {
      console.error('Failed to create server:', error);
    }
  }, [newServerConfig]);

  // Handle delete server
  const handleDeleteServer = useCallback(async (serverId: string) => {
    try {
      const success = await window.electronAPI.mcp.removeCustomServer(serverId);
      if (success) {
        setServers(prev => prev.filter(s => s.id !== serverId));
        if (selectedServerId === serverId) {
          setSelectedServerId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  }, [selectedServerId]);

  // Handle call tool
  const handleCallTool = useCallback(async (tool: MCPTool) => {
    if (!selectedServerId) return;
    
    setActiveTool(tool);
    setToolInput('');
    setToolOutput('');
  }, [selectedServerId]);

  // Handle execute tool
  const handleExecuteTool = useCallback(async () => {
    if (!activeTool || !selectedServerId) return;
    
    setIsCallingTool(true);
    setToolOutput('');
    
    try {
      // Parse input as JSON if it's an object
      let input;
      try {
        input = JSON.parse(toolInput);
      } catch {
        input = toolInput;
      }
      
      const result = await window.electronAPI.mcp.callTool(
        selectedServerId,
        activeTool.name,
        input
      );
      
      setToolOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setToolOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCallingTool(false);
    }
  }, [activeTool, selectedServerId, toolInput]);

  // Get selected server
  const selectedServer = servers.find(s => s.id === selectedServerId);

  // Filter tools
  const filteredTools = selectedServer?.tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Model Context Protocol (MCP)</h1>
        <button
          onClick={() => setShowNewServerInput(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        MCP allows you to connect external tools and data sources to your AI conversations.
      </p>

      <div className="flex gap-6 h-full">
        {/* Servers list */}
        <div className="w-60 flex-shrink-0 border-r border-border/50 pr-6">
          <div className="text-xs text-muted-foreground px-1 mb-2">Servers</div>
          <div className="space-y-1">
            {servers.map((server) => (
              <button
                key={server.id}
                onClick={() => setSelectedServerId(server.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedServerId === server.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plug className="w-4 h-4" />
                  <span className="truncate">{server.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteServer(server.id);
                  }}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive/70 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>

          {/* New server input */}
          <AnimatePresence>
            {showNewServerInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="space-y-2 p-2">
                  <input
                    type="text"
                    value={newServerConfig.name}
                    onChange={(e) => setNewServerConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Server name"
                    autoFocus
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    value={newServerConfig.command}
                    onChange={(e) => setNewServerConfig(prev => ({ ...prev, command: e.target.value }))}
                    placeholder="Command (e.g., node)"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    value={newServerConfig.args}
                    onChange={(e) => setNewServerConfig(prev => ({ ...prev, args: e.target.value }))}
                    placeholder="Arguments (space separated)"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateServer}
                      disabled={newServerConfig.name.trim() === '' || newServerConfig.command.trim() === ''}
                      className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80 disabled:opacity-50 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setNewServerConfig({ name: '', command: '', args: '' });
                        setShowNewServerInput(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-secondary rounded hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tools list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="text-xs text-muted-foreground px-1 mb-2">
            {selectedServer?.name || 'Select a server'}
          </div>

          <div className="flex-1 overflow-auto">
            {selectedServer ? (
              filteredTools.length > 0 ? (
                <div className="space-y-2">
                  {filteredTools.map((tool) => (
                    <motion.div
                      key={tool.id}
                      whileHover={{ scale: 1.01 }}
                      className="border border-border rounded-lg p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4" />
                          <span className="font-medium">{tool.name}</span>
                        </div>
                        <button
                          onClick={() => handleCallTool(tool)}
                          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
                        >
                          Use
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Plug className="w-12 h-12 mb-4 opacity-50" />
                  <p>No tools found</p>
                  <p className="text-sm mt-1">{searchQuery ? 'Try a different search' : 'This server has no tools'}</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Plug className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a server to view tools</p>
              </div>
            )}
          </div>
        </div>

        {/* Tool execution panel */}
        <AnimatePresence>
          {activeTool && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="w-[400px] flex-shrink-0 border-l border-border/50 pl-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold truncate">{activeTool.name}</h2>
                <button
                  onClick={() => setActiveTool(null)}
                  className="p-2 hover:bg-accent/50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{activeTool.description}</p>

              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div>
                  <label className="text-sm font-medium mb-1 block">Input</label>
                  <textarea
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder="Enter tool input (JSON format)"
                    className="w-full min-h-[100px] p-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Output</label>
                  <div className="w-full h-full min-h-[100px] p-3 text-sm border border-border rounded-md bg-background overflow-auto font-mono">
                    {toolOutput || (isCallingTool ? 'Calling tool...' : 'No output yet')}
                  </div>
                </div>

                <button
                  onClick={handleExecuteTool}
                  disabled={isCallingTool}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80 disabled:opacity-50 transition-colors"
                >
                  {isCallingTool ? 'Calling...' : 'Execute Tool'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MCPView;
