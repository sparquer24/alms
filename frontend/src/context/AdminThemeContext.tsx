'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminColors, AdminThemeDefaults } from '../styles/admin-design-system';

type ThemeMode = 'light' | 'dark';

interface AdminThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  colors: (typeof AdminColors)[keyof typeof AdminColors];
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(AdminThemeDefaults.mode);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, []);

  // Update localStorage and apply theme to document
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem('admin-theme', theme);

    // Update document class for Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'light' ? AdminColors.light : AdminColors.dark;

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }
  return context;
};
