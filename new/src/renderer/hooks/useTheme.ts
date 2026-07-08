import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Load theme from settings
    const loadTheme = async () => {
      const savedTheme = await window.electronAPI.settings.get('theme');
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    window.electronAPI.settings.set('theme', newTheme);
  };

  return { theme, setTheme };
};

export default useTheme;
