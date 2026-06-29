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
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    // Force light theme to match the UI theme
    setTheme('light');
    setMounted(true);
  }, []);

  // Update localStorage and apply theme to document
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem('admin-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, [mounted]);

  const toggleTheme = () => {
    // Theme toggling is disabled to maintain a consistent UI theme
  };

  const colors = AdminColors.light;

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
