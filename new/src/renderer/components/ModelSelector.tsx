import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  onSelect: (model: string) => void;
  status: { isRunning: boolean; baseUrl: string };
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelect,
  status,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first model if none selected and models available
  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      onSelect(models[0]);
    }
  }, [models, selectedModel, onSelect]);

  const handleSelect = async (model: string) => {
    setIsOpen(false);
    onSelect(model);
  };

  const handlePullModel = async (model: string) => {
    setIsLoading(true);
    try {
      await window.electronAPI.ollama.pullModel(model);
      // Refresh models
      const updatedModels = await window.electronAPI.ollama.getModels();
      // If the model was pulled successfully, select it
      if (updatedModels.some(m => m.name === model)) {
        onSelect(model);
      }
    } catch (error) {
      console.error('Failed to pull model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayText = selectedModel || (models.length > 0 ? models[0] : 'Select model');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!status.isRunning}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-accent/50 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
        ) : (
          <>
            <span className="truncate max-w-[150px]">{displayText}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 mt-1 w-60 bg-background border border-border rounded-md shadow-lg overflow-hidden"
          >
            <div className="py-1">
              {models.length > 0 ? (
                models.map((model) => (
                  <div
                    key={model}
                    onClick={() => handleSelect(model)}
                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-accent/50 transition-colors ${
                      selectedModel === model ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <span>{model}</span>
                    {selectedModel === model && <Check className="w-4 h-4" />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No models available
                </div>
              )}
            </div>

            {!status.isRunning && (
              <div className="px-4 py-2 text-xs text-destructive bg-destructive/10 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Ollama is not running
              </div>
            )}

            <div className="border-t border-border/50 px-4 py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Refresh models
                  window.electronAPI.ollama.getModels().then(models => {
                    if (models.length > 0) {
                      onSelect(models[0].name);
                    }
                  });
                }}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-left"
              >
                Refresh models
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;
