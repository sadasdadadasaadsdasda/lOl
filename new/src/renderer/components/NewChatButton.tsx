import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export interface NewChatButtonProps {
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({
  onClick,
  variant = 'default',
  size = 'md',
  children = 'New Chat',
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    ghost: 'bg-transparent hover:bg-accent/50',
    outline: 'border border-border bg-transparent hover:bg-accent/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
    >
      <Plus className="w-4 h-4" />
      {children}
    </motion.button>
  );
};

export default NewChatButton;
