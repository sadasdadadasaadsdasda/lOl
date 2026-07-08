import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './hooks/useTheme';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { SettingsView } from './components/SettingsView';
import { NewChatButton } from './components/NewChatButton';
import { WindowControls } from './components/WindowControls';
import { ModelSelector } from './components/ModelSelector';
import { SearchView } from './components/SearchView';
import { ProjectsView } from './components/ProjectsView';
import { ArtifactsView } from './components/ArtifactsView';
import { MCPView } from './components/MCPView';
import './styles/index.css';

// Define types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokenCount?: number;
    finishReason?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  conversations: string[];
  createdAt: number;
  updatedAt: number;
}

const App: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'chats' | 'projects' | 'artifacts' | 'mcp' | 'settings'>('chats');
  const [ollamaStatus, setOllamaStatus] = useState<{ isRunning: boolean; baseUrl: string }>({ isRunning: false, baseUrl: '' });

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        // Load conversations
        const convos = await window.electronAPI.conversations.getConversations();
        setConversations(convos);
        
        // Load current conversation
        const currentConv = await window.electronAPI.conversations.getCurrentConversation();
        if (currentConv) {
          setCurrentConversationId(currentConv.id);
        }
        
        // Load models
        const models = await window.electronAPI.ollama.getModels();
        setAvailableModels(models.map(m => m.name));
        
        // Load first available model
        const firstModel = await window.electronAPI.ollama.getFirstAvailableModel();
        if (firstModel) {
          setSelectedModel(firstModel);
        }
        
        // Load Ollama status
        const status = await window.electronAPI.ollama.getStatus();
        setOllamaStatus(status);
        
        // Load settings
        const themeSetting = await window.electronAPI.settings.get('theme');
        if (themeSetting) {
          setTheme(themeSetting);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };
    
    init();
    
    // Set up listeners
    const updateConversations = () => {
      window.electronAPI.conversations.getConversations().then(setConversations);
    };
    
    const updateCurrentConversation = () => {
      window.electronAPI.conversations.getCurrentConversation().then(conv => {
        setCurrentConversationId(conv?.id || null);
      });
    };
    
    // Poll for conversations changes (simplified - in real app use IPC events)
    const interval = setInterval(updateConversations, 5000);
    
    return () => clearInterval(interval);
  }, [setTheme]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    window.electronAPI.conversations.setCurrentConversation(conversationId);
    setActiveView('chats');
    setIsSearching(false);
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(async () => {
    const conversation = await window.electronAPI.conversations.createConversation({
      model: selectedModel,
    });
    setConversations(prev => [conversation, ...prev]);
    setCurrentConversationId(conversation.id);
    window.electronAPI.conversations.setCurrentConversation(conversation.id);
    setActiveView('chats');
    setIsSearching(false);
  }, [selectedModel]);

  // Handle model selection
  const handleModelSelect = useCallback(async (model: string) => {
    setSelectedModel(model);
    await window.electronAPI.settings.set('selectedModel', model);
  }, []);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setIsSearching(false);
      const convos = await window.electronAPI.conversations.getConversations();
      setConversations(convos);
    } else {
      setIsSearching(true);
      const results = await window.electronAPI.conversations.searchConversations(query);
      setConversations(results);
    }
  }, []);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // Handle message send
  const handleSendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!selectedModel) {
      const firstModel = await window.electronAPI.ollama.getFirstAvailableModel();
      if (firstModel) setSelectedModel(firstModel);
    }

    // Add user message
    await window.electronAPI.conversations.addMessage(conversationId, {
      role: 'user',
      content,
    });

    // Get conversation to send to Ollama
    const conversation = await window.electronAPI.conversations.getConversation(conversationId);
    if (!conversation) return;

    // Prepare messages for Ollama
    const messages = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Start assistant message (placeholder)
    const assistantMessageId = await window.electronAPI.conversations.addMessage(conversationId, {
      role: 'assistant',
      content: '',
    });

    // Stream response from Ollama
    try {
      const modelToUse = selectedModel || await window.electronAPI.ollama.getFirstAvailableModel();
      if (!modelToUse) {
        throw new Error('No model available');
      }

      const stream = await window.electronAPI.ollama.chat({
        model: modelToUse,
        messages,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        // Update assistant message in real-time
        await window.electronAPI.conversations.updateMessage(
          conversationId,
          assistantMessageId.id,
          { content: fullResponse }
        );
      }

      // Update final message
      await window.electronAPI.conversations.updateMessage(conversationId, assistantMessageId.id, {
        content: fullResponse,
        metadata: {
          model: modelToUse,
          finishReason: 'stop',
        },
      });
    } catch (error) {
      console.error('Failed to get response:', error);
      // Update message with error
      await window.electronAPI.conversations.updateMessage(conversationId, assistantMessageId.id, {
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        metadata: { finishReason: 'error' },
      });
    }
  }, [selectedModel]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    const success = await window.electronAPI.conversations.deleteConversation(conversationId);
    if (success) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
    }
  }, [currentConversationId]);

  // Handle theme change
  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    window.electronAPI.settings.set('theme', newTheme);
  }, [setTheme]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {!isSearching && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 w-280 h-full border-r border-border/50"
            >
              <Sidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onDeleteConversation={handleDeleteConversation}
                activeView={activeView}
                onViewChange={setActiveView}
                projects={projects}
                currentProjectId={currentProjectId}
                onSelectProject={setCurrentProjectId}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onModelSelect={handleModelSelect}
                ollamaStatus={ollamaStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search View */}
        {isSearching && (
          <div className="flex-shrink-0 w-280 h-full border-r border-border/50">
            <SearchView
              query={searchQuery}
              onSearch={handleSearch}
              onClose={() => {
                setIsSearching(false);
                setSearchQuery('');
                window.electronAPI.conversations.getConversations().then(setConversations);
              }}
              results={conversations}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              {!isSearching && (
                <>
                  <NewChatButton onClick={handleNewChat} />
                  <ModelSelector
                    models={availableModels}
                    selectedModel={selectedModel}
                    onSelect={handleModelSelect}
                    status={ollamaStatus}
                  />
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <WindowControls />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {activeView === 'chats' && currentConversationId && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ChatView
                    conversation={currentConversation}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    selectedModel={selectedModel}
                  />
                </motion.div>
              )}

              {activeView === 'chats' && !currentConversationId && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center h-full text-center p-8"
                >
                  <div className="mb-4">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-primary">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                      <path d="M12 6C8.69 6 6 8.69 6 12H8C8 9.76 9.76 8 12 8V6Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Welcome to Ollama Desktop</h1>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Start a conversation with your local AI models. No account required, everything runs on your machine.
                  </p>
                  <NewChatButton onClick={handleNewChat} variant="default" size="lg">
                    New Chat
                  </NewChatButton>
                </motion.div>
              )}

              {activeView === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ProjectsView
                    projects={projects}
                    currentProjectId={currentProjectId}
                    onSelectProject={setCurrentProjectId}
                  />
                </motion.div>
              )}

              {activeView === 'artifacts' && (
                <motion.div
                  key="artifacts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ArtifactsView />
                </motion.div>
              )}

              {activeView === 'mcp' && (
                <motion.div
                  key="mcp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <MCPView />
                </motion.div>
              )}

              {activeView === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <SettingsView
                    theme={theme}
                    onThemeChange={handleThemeChange}
                    selectedModel={selectedModel}
                    availableModels={availableModels}
                    onModelSelect={handleModelSelect}
                    ollamaStatus={ollamaStatus}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
