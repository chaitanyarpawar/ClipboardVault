import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './colors';
import { AppSettings } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';
    
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const settings: AppSettings = JSON.parse(savedSettings);
        setThemeMode(settings.theme);
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (mode: 'light' | 'dark' | 'system') => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      const settings: AppSettings = savedSettings 
        ? JSON.parse(savedSettings)
        : {
            theme: 'system',
            autoSave: true,
            backgroundSync: true,
            hapticFeedback: true,
            isPremium: false,
            googleDriveBackup: false,
          };
      
      const updatedSettings = { ...settings, theme: mode };
      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  const handleSetThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        isDark, 
        toggleTheme, 
        setThemeMode: handleSetThemeMode, 
        themeMode 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};