import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown, MoreVertical, Edit, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vscLightPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../hooks/useTheme';
import { Conversation, Message } from '../App';

export interface ChatViewProps {
  conversation: Conversation | undefined;
  onSendMessage: (conversationId: string, content: string) => void;
  isLoading: boolean;
  selectedModel: string;
}

const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  selectedModel,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Handle edit
  const handleEditMessage = useCallback((message: Message) => {
    setEditingMessageId(message.id);
    setEditValue(message.content);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(async () => {
    if (!conversation || !editingMessageId) return;
    
    // In a real implementation, we would update the message
    // For now, just clear the edit state
    setEditingMessageId(null);
    setEditValue('');
  }, [conversation, editingMessageId]);

  // Handle delete message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!conversation) return;
    
    // In a real implementation, we would delete the message
    console.log('Delete message:', messageId);
  }, [conversation]);

  // Handle copy
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    if (!conversation || inputValue.trim() === '' || isComposing) return;
    
    onSendMessage(conversation.id, inputValue.trim());
    setInputValue('');
  }, [conversation, inputValue, isComposing, onSendMessage]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isComposing]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // Handle file paste (images, files)
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const blob = items[i].getAsFile();
        if (blob) {
          // Handle file upload
          console.log('File pasted:', blob.name);
        }
      }
    }
  }, []);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="mb-4">
          <Bot className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">No conversation selected</h1>
        <p className="text-muted-foreground">Select a conversation or start a new one</p>
      </div>
    );
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get syntax highlighter style
  const getSyntaxStyle = () => {
    return theme === 'dark' ? vscDarkPlus : vscLightPlus;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={conversation.title}
            onChange={(e) => {
              // Update conversation title
            }}
            className="text-lg font-semibold bg-transparent border-none outline-none flex-1"
          />
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
            {selectedModel || conversation.model || 'Select model'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <AnimatePresence>
          {conversation.messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center text-muted-foreground"
            >
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p>Start a conversation with {selectedModel || conversation.model || 'your AI'}</p>
            </motion.div>
          ) : (
            conversation.messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Message header */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {message.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                    <span>{formatDate(message.timestamp)}</span>
                  </div>

                  {/* Message content */}
                  <div
                    className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary/10' : 'bg-secondary/50'} rounded-lg px-4 py-3`}
                  >
                    {editingMessageId === message.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full min-h-[100px] p-2 border rounded bg-background"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditValue('');
                            }}
                            className="px-3 py-1 text-sm bg-secondary rounded hover:bg-secondary/80"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 text-sm bg-primary rounded hover:bg-primary/80 text-primary-foreground"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={getSyntaxStyle()}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            table({ children }) {
                              return (
                                <table className="border-collapse border border-border my-2">
                                  {children}
                                </table>
                              );
                            },
                            th({ children }) {
                              return (
                                <th className="border border-border px-4 py-2 bg-secondary">{children}</th>
                              );
                            },
                            td({ children }) {
                              return <td className="border border-border px-4 py-2">{children}</td>;
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                        {/* Message actions */}
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="p-1 rounded hover:bg-accent/50 transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {message.role === 'assistant' && (
                            <>
                              <button
                                className="p-1 rounded hover:bg-accent/50 transition-colors"
                                title="Good response"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-accent/50 transition-colors"
                                title="Bad response"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {message.role === 'user' && (
                            <>
                              <button
                                onClick={() => handleEditMessage(message)}
                                className="p-1 rounded hover:bg-accent/50 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1 rounded hover:bg-destructive/10 transition-colors text-destructive/70"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {/* Streaming indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-secondary/50 rounded-lg px-4 py-3 min-w-[200px]">
              <div className="flex gap-1">
                <div className="animate-pulse rounded-full h-2 w-2 bg-foreground" />
                <div className="animate-pulse rounded-full h-2 w-2 bg-foreground" delay-100 />
                <div className="animate-pulse rounded-full h-2 w-2 bg-foreground" delay-200 />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-background">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={isLoading ? 'Waiting for response...' : `Message ${selectedModel || conversation.model || 'AI'}`}
            disabled={isLoading}
            className="w-full min-h-[44px] max-h-[300px] p-4 pr-12 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={inputValue.trim() === '' || isLoading || isComposing}
            className="absolute right-2 bottom-2 p-2 bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {selectedModel ? `Using: ${selectedModel}` : 'Select a model to start chatting'}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
