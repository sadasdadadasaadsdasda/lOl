import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, ChevronRight, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export interface SettingsViewProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  selectedModel: string;
  availableModels: string[];
  onModelSelect: (model: string) => void;
  ollamaStatus: { isRunning: boolean; baseUrl: string };
}

const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  selectedModel,
  availableModels,
  onModelSelect,
  ollamaStatus,
}) => {
  const [activeSection, setActiveSection] = useState<'appearance' | 'models' | 'about'>('appearance');
  const [isPulling, setIsPulling] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<Record<string, number>>({});

  const handlePullModel = async (model: string) => {
    setIsPulling(model);
    setPullProgress(prev => ({ ...prev, [model]: 0 }));
    
    try {
      // Simulate progress (in real implementation, use actual progress events)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setPullProgress(prev => ({ ...prev, [model]: i }));
      }
      
      await window.electronAPI.ollama.pullModel(model);
      const updatedModels = await window.electronAPI.ollama.getModels();
      if (updatedModels.some(m => m.name === model)) {
        onModelSelect(model);
      }
    } catch (error) {
      console.error('Failed to pull model:', error);
    } finally {
      setIsPulling(null);
      setPullProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[model];
        return newProgress;
      });
    }
  };

  const handleRefreshModels = async () => {
    const models = await window.electronAPI.ollama.getModels();
    // Models are already loaded via parent component
  };

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="flex gap-6 h-full">
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0 border-r border-border/50 pr-6">
          <nav className="space-y-1">
            {[
              { id: 'appearance', label: 'Appearance', icon: Monitor },
              { id: 'models', label: 'Models', icon: RefreshCw },
              { id: 'about', label: 'About', icon: AlertCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeSection === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                <ChevronRight className="w-4 h-4 ml-auto opacity-0" />
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeSection === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Customize the look and feel of the application.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Theme</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose how the application looks.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onThemeChange(option.value as any)}
                          className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                            theme === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <option.icon className="w-6 h-6" />
                          <span className="text-sm">{option.label}</span>
                          {theme === option.value && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'models' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Models</h2>
                  <button
                    onClick={handleRefreshModels}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  Manage your local Ollama models. Models are downloaded and run locally on your machine.
                </p>

                {!ollamaStatus.isRunning ? (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <h3 className="font-medium text-destructive">Ollama is not running</h3>
                      <p className="text-sm text-muted-foreground">
                        Start Ollama to download and use models.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Available Models</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Models that are already downloaded and ready to use.
                      </p>
                      
                      {availableModels.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {availableModels.map((model) => (
                            <div
                              key={model}
                              className={`flex items-center justify-between p-3 border rounded-lg ${
                                selectedModel === model
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-accent/50'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{model}</div>
                                <div className="text-xs text-muted-foreground">
                                  Ready to use
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onModelSelect(model)}
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    selectedModel === model
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                  }`}
                                >
                                  {selectedModel === model ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No models downloaded yet.
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Download New Model</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Download additional models from Ollama's model library.
                      </p>
                      
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          placeholder="Enter model name (e.g., llama3.2, mistral)"
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors">
                          Download
                        </button>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Popular models: llama3.2, llama3.1, llama3, mistral, phi3, gemma2
                      </div>
                    </div>

                    {isPulling && (
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Downloading {isPulling}</div>
                          <button
                            onClick={() => {
                              // Cancel download
                            }}
                            className="p-1 hover:bg-destructive/10 rounded text-destructive/70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${pullProgress[isPulling] || 0}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pullProgress[isPulling] || 0}% complete
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'about' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4">About</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Ollama Desktop</h3>
                    <p className="text-sm text-muted-foreground">
                      A fork of Claude Desktop that runs entirely locally using Ollama.
                      No account required, no cloud dependencies, all your data stays on your machine.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Features</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Local AI inference with Ollama</li>
                      <li>• Support for all Ollama models</li>
                      <li>• Conversation history</li>
                      <li>• Projects organization</li>
                      <li>• MCP (Model Context Protocol) support</li>
                      <li>• Artifacts and file uploads</li>
                      <li>• Markdown rendering with code highlighting</li>
                      <li>• No telemetry, no tracking</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Version</h3>
                    <p className="text-sm text-muted-foreground">1.0.0</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Ollama Status</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        ollamaStatus.isRunning ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">
                        {ollamaStatus.isRunning ? 'Running' : 'Not running'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Base URL: {ollamaStatus.baseUrl}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
