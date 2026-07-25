'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    
    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      root.setAttribute('data-theme', 'light');
      body.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('isp_app_theme') as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      setThemeState('light');
      applyTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    localStorage.setItem('isp_app_theme', nextTheme);
    applyTheme(nextTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('isp_app_theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div id="theme-wrapper" className={theme === 'light' ? 'light light-mode' : 'dark dark-mode'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
}
