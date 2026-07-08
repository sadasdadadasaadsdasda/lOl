import React from 'react';
import { Minimize, Maximize, X } from 'lucide-react';

const WindowControls: React.FC = () => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => window.electronAPI.window.minimize()}
        className="p-2 hover:bg-accent/50 rounded transition-colors"
        title="Minimize"
      >
        <Minimize className="w-4 h-4" />
      </button>
      <button
        onClick={() => window.electronAPI.window.maximize()}
        className="p-2 hover:bg-accent/50 rounded transition-colors"
        title="Maximize"
      >
        <Maximize className="w-4 h-4" />
      </button>
      <button
        onClick={() => window.electronAPI.window.close()}
        className="p-2 hover:bg-destructive/10 rounded transition-colors text-destructive/70 hover:text-destructive"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WindowControls;
