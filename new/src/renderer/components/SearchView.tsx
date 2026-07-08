import React, { useCallback } from 'react';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import { Conversation } from '../App';

export interface SearchViewProps {
  query: string;
  onSearch: (query: string) => void;
  onClose: () => void;
  results: Conversation[];
  onSelectConversation: (id: string) => void;
}

const SearchView: React.FC<SearchViewProps> = ({
  query,
  onSearch,
  onClose,
  results,
  onSelectConversation,
}) => {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value);
    },
    [onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className="flex flex-col h-full p-3">
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search conversations..."
          autoFocus
          className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {query && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p>{query ? 'No results found' : 'Start typing to search'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {results.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className="w-full flex items-center gap-3 p-3 text-left rounded-md hover:bg-accent/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="p-2">
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
};

export default SearchView;
