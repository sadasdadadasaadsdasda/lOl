import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Folder, FileCode, Settings, Search, Bot, Plug, Trash2 } from 'lucide-react';
import { Conversation, Project } from '../App';

export interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  activeView: 'chats' | 'projects' | 'artifacts' | 'mcp' | 'settings';
  onViewChange: (view: 'chats' | 'projects' | 'artifacts' | 'mcp' | 'settings') => void;
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  availableModels: string[];
  selectedModel: string;
  onModelSelect: (model: string) => void;
  ollamaStatus: { isRunning: boolean; baseUrl: string };
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  activeView,
  onViewChange,
  projects,
  currentProjectId,
  onSelectProject,
  availableModels,
  selectedModel,
  ollamaStatus,
}) => {
  return (
    <div className="flex flex-col h-full bg-background border-r border-border/50">
      {/* User section - No login required */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-medium text-sm">Local AI</div>
            <div className="text-xs text-muted-foreground">
              {ollamaStatus.isRunning ? 'Ollama running' : 'Ollama not running'}
            </div>
          </div>
        </div>
      </div>

      {/* New chat button */}
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-foreground"
        >
          <MessageSquare className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <div className="px-2 py-1">
        <div className="text-xs text-muted-foreground px-3 py-1">Navigation</div>
        <div className="space-y-1">
          {[
            { id: 'chats', label: 'Chats', icon: MessageSquare },
            { id: 'projects', label: 'Projects', icon: Folder },
            { id: 'artifacts', label: 'Artifacts', icon: FileCode },
            { id: 'mcp', label: 'MCP', icon: Plug },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeView === item.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-auto py-2">
        <div className="px-2">
          <div className="text-xs text-muted-foreground px-3 py-1">Recent Chats</div>
          <div className="space-y-1">
            {conversations.slice(0, 20).map((conversation) => (
              <motion.div
                key={conversation.id}
                whileHover={{ scale: 1.01 }}
                className={`flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  currentConversationId === conversation.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-foreground'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex-1 truncate">
                  <div className="truncate">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-border/50">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
            activeView === 'settings'
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50 text-foreground'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
