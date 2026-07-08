import React, { useState, useCallback } from 'react';
import { FileCode, Grid3X3, List, MoreVertical, Download, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Artifact {
  id: string;
  name: string;
  type: 'code' | 'file' | 'image' | 'artifact';
  size: number;
  createdAt: number;
  conversationId: string;
  messageId: string;
  data: string | Blob;
}

const ArtifactsView: React.FC = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // In a real implementation, we would load artifacts from the conversation manager
  // For now, we'll use mock data
  const mockArtifacts: Artifact[] = [
    {
      id: '1',
      name: 'data_analysis.py',
      type: 'code',
      size: 2048,
      createdAt: Date.now() - 86400000,
      conversationId: 'conv-1',
      messageId: 'msg-1',
      data: 'print("Hello, World!")',
    },
    {
      id: '2',
      name: 'report.pdf',
      type: 'file',
      size: 102400,
      createdAt: Date.now() - 3600000,
      conversationId: 'conv-2',
      messageId: 'msg-2',
      data: '',
    },
    {
      id: '3',
      name: 'diagram.png',
      type: 'image',
      size: 512000,
      createdAt: Date.now() - 1800000,
      conversationId: 'conv-1',
      messageId: 'msg-3',
      data: '',
    },
  ];

  // Load artifacts
  useEffect(() => {
    // In a real implementation:
    // const loadArtifacts = async () => {
    //   const arts = await window.electronAPI.artifacts.getAll();
    //   setArtifacts(arts);
    // };
    // loadArtifacts();
    setArtifacts(mockArtifacts);
  }, []);

  // Handle download
  const handleDownload = useCallback((artifact: Artifact) => {
    // In a real implementation, we would download the artifact
    console.log('Download artifact:', artifact.id);
  }, []);

  // Handle delete
  const handleDelete = useCallback((artifactId: string) => {
    // In a real implementation, we would delete the artifact
    setArtifacts(prev => prev.filter(a => a.id !== artifactId));
  }, []);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <FileCode className="w-4 h-4" />;
      case 'file':
        return <FileCode className="w-4 h-4" />;
      case 'image':
        return <FileCode className="w-4 h-4" />;
      case 'artifact':
        return <FileCode className="w-4 h-4" />;
      default:
        return <FileCode className="w-4 h-4" />;
    }
  };

  // Get file type color
  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'code':
        return 'text-blue-500';
      case 'file':
        return 'text-gray-500';
      case 'image':
        return 'text-purple-500';
      case 'artifact':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Artifacts</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Files, code, and other artifacts generated during your conversations.
      </p>

      {/* Artifacts list */}
      <div className="flex-1 overflow-auto">
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <FileCode className="w-12 h-12 mb-4 opacity-50" />
            <p>No artifacts yet</p>
            <p className="text-sm mt-1">Artifacts will appear here when generated</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artifacts.map((artifact) => (
              <motion.div
                key={artifact.id}
                whileHover={{ scale: 1.02 }}
                className="border border-border rounded-lg p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 ${getFileTypeColor(artifact.type)}`}>
                    {getFileTypeIcon(artifact.type)}
                    <span className="text-sm font-medium truncate max-w-[150px]">{artifact.name}</span>
                  </div>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-secondary/50 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{formatSize(artifact.size)}</div>
                  <div>{formatDate(artifact.createdAt)}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelectedArtifact(artifact)}
                    className="flex-1 px-3 py-1.5 text-xs border border-border rounded hover:bg-accent/50 transition-colors"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(artifact)}
                    className="flex-1 px-3 py-1.5 text-xs border border-border rounded hover:bg-accent/50 transition-colors"
                  >
                    <Download className="w-3 h-3 inline mr-1" />
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <motion.div
                key={artifact.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-3 border border-border rounded-lg transition-colors hover:bg-accent/50"
              >
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ${getFileTypeColor(artifact.type)}`}>
                  {getFileTypeIcon(artifact.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{artifact.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatSize(artifact.size)} • {formatDate(artifact.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedArtifact(artifact)}
                    className="p-2 hover:bg-accent/50 rounded transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(artifact)}
                    className="p-2 hover:bg-accent/50 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(artifact.id)}
                    className="p-2 hover:bg-destructive/10 rounded transition-colors text-destructive/70"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Artifact preview modal */}
      <AnimatePresence>
        {selectedArtifact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedArtifact(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background border border-border rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedArtifact.name}</h2>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="p-2 hover:bg-accent/50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                <div>Type: {selectedArtifact.type}</div>
                <div>Size: {formatSize(selectedArtifact.size)}</div>
                <div>Created: {formatDate(selectedArtifact.createdAt)}</div>
              </div>

              <div className="border-t border-border/50 pt-4">
                {selectedArtifact.type === 'code' && typeof selectedArtifact.data === 'string' ? (
                  <pre className="bg-secondary/50 rounded p-4 overflow-x-auto text-sm">
                    <code>{selectedArtifact.data}</code>
                  </pre>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Preview not available for this artifact type
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 border-t border-border/50 pt-4">
                <button
                  onClick={() => handleDownload(selectedArtifact)}
                  className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="flex-1 px-4 py-2 text-sm bg-secondary rounded hover:bg-secondary/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArtifactsView;
