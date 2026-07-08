import { v4 as uuidv4 } from 'uuid';
import ElectronStore from 'electron-store';

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
  projectId?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokenCount?: number;
    finishReason?: string;
    attachments?: string[];
    artifacts?: any[];
  };
}

export interface CreateConversationOptions {
  title?: string;
  model?: string;
  projectId?: string;
  initialMessage?: string;
}

const conversationsStore = new ElectronStore({
  name: 'conversations',
  defaults: {
    conversations: [],
    currentConversationId: null,
  },
});

export class ConversationManager {
  private conversations: Conversation[] = [];
  private currentConversationId: string | null = null;

  constructor() {
    this.loadConversations();
  }

  private loadConversations(): void {
    const stored = conversationsStore.get('conversations') as Conversation[];
    this.conversations = stored || [];
    this.currentConversationId = conversationsStore.get('currentConversationId') as string | null;
  }

  private saveConversations(): void {
    conversationsStore.set('conversations', this.conversations);
    conversationsStore.set('currentConversationId', this.currentConversationId);
  }

  getConversations(): Conversation[] {
    return [...this.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getConversation(id: string): Conversation | null {
    return this.conversations.find(c => c.id === id) || null;
  }

  getCurrentConversation(): Conversation | null {
    if (!this.currentConversationId) return null;
    return this.getConversation(this.currentConversationId);
  }

  setCurrentConversation(id: string | null): void {
    this.currentConversationId = id;
    this.saveConversations();
  }

  createConversation(options: CreateConversationOptions = {}): Conversation {
    const { title = 'New Chat', model = '', projectId, initialMessage } = options;
    
    const now = Date.now();
    const conversation: Conversation = {
      id: uuidv4(),
      title,
      messages: [],
      model,
      createdAt: now,
      updatedAt: now,
      projectId,
    };

    if (initialMessage) {
      conversation.messages.push({
        id: uuidv4(),
        role: 'user',
        content: initialMessage,
        timestamp: now,
      });
    }

    this.conversations.unshift(conversation);
    this.currentConversationId = conversation.id;
    this.saveConversations();

    return conversation;
  }

  deleteConversation(id: string): boolean {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.conversations.splice(index, 1);
    
    if (this.currentConversationId === id) {
      this.currentConversationId = this.conversations.length > 0 
        ? this.conversations[0].id 
        : null;
    }

    this.saveConversations();
    return true;
  }

  updateConversationTitle(id: string, title: string): boolean {
    const conversation = this.getConversation(id);
    if (!conversation) return false;

    conversation.title = title;
    conversation.updatedAt = Date.now();
    this.saveConversations();
    return true;
  }

  addMessage(conversationId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>): ConversationMessage | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;

    const conversationMessage: ConversationMessage = {
      ...message,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    conversation.messages.push(conversationMessage);
    conversation.updatedAt = Date.now();
    this.saveConversations();

    return conversationMessage;
  }

  updateMessage(conversationId: string, messageId: string, updates: Partial<ConversationMessage>): boolean {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return false;

    const message = conversation.messages.find(m => m.id === messageId);
    if (!message) return false;

    Object.assign(message, updates);
    conversation.updatedAt = Date.now();
    this.saveConversations();
    return true;
  }

  deleteMessage(conversationId: string, messageId: string): boolean {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return false;

    const index = conversation.messages.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    conversation.messages.splice(index, 1);
    conversation.updatedAt = Date.now();
    this.saveConversations();
    return true;
  }

  clearMessages(conversationId: string): boolean {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return false;

    conversation.messages = [];
    conversation.updatedAt = Date.now();
    this.saveConversations();
    return true;
  }

  searchConversations(query: string): Conversation[] {
    const lowerQuery = query.toLowerCase();
    return this.conversations.filter(conversation => 
      conversation.title.toLowerCase().includes(lowerQuery) ||
      conversation.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery))
    );
  }

  getApi() {
    return {
      getConversations: this.getConversations.bind(this),
      getConversation: this.getConversation.bind(this),
      getCurrentConversation: this.getCurrentConversation.bind(this),
      setCurrentConversation: this.setCurrentConversation.bind(this),
      createConversation: this.createConversation.bind(this),
      deleteConversation: this.deleteConversation.bind(this),
      updateConversationTitle: this.updateConversationTitle.bind(this),
      addMessage: this.addMessage.bind(this),
      updateMessage: this.updateMessage.bind(this),
      deleteMessage: this.deleteMessage.bind(this),
      clearMessages: this.clearMessages.bind(this),
      searchConversations: this.searchConversations.bind(this),
    };
  }
}
