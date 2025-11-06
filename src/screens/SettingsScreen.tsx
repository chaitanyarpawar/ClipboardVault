import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { AppSettings } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '../components';

// Conditional imports for web compatibility
const BlurView = Platform.OS === 'web' ? View : require('expo-blur').BlurView;

const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    autoSave: true,
    tagSuggestions: true,
    backgroundSync: true,
    hapticFeedback: true,
    isPremium: false,
    googleDriveBackup: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const parsedSettings: AppSettings = JSON.parse(savedSettings);
        // Backfill missing keys for older installs
        if (parsedSettings.tagSuggestions === undefined) parsedSettings.tagSuggestions = true;
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    updateSetting('theme', mode);
  };

  // Actions
  const handleRateApp = async () => {
    // Attempt to open store listing; fallback to web
    const androidUrl = 'market://details?id=com.clipboardvault.app';
    const webUrl = 'https://play.google.com/store/apps/details?id=com.clipboardvault.app';
    try {
      const supported = await Linking.canOpenURL(androidUrl);
      await Linking.openURL(supported ? androidUrl : webUrl);
    } catch {
      // no-op
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          'Check out ClipboardVault – a fast, private clipboard manager. Download: https://play.google.com/store/apps/details?id=com.clipboardvault.app',
      });
    } catch {
      // no-op
    }
  };

  // Simple section container matching screenshot style
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );

  const ToggleRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }>
    = ({ label, value, onChange }) => (
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          thumbColor={value ? theme.colors.primary : theme.colors.textSecondary}
          trackColor={{ false: theme.colors.surface, true: theme.colors.primary + '40' }}
        />
      </View>
  );

  // Segmented control for theme selection
  const ThemeSegment: React.FC = () => (
    <View style={[styles.segmentContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {(['light','dark','system'] as const).map((mode, idx) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.segmentItem,
            themeMode === mode && { backgroundColor: theme.colors.card, borderColor: theme.colors.primary },
            idx === 0 && styles.segmentItemLeft,
            idx === 2 && styles.segmentItemRight,
          ]}
          onPress={() => handleThemeChange(mode)}
        >
          <Text style={{
            color: themeMode === mode ? theme.colors.text : theme.colors.textSecondary,
            fontWeight: themeMode === mode ? '700' : '500'
          }}>
            {mode === 'system' ? 'Auto' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
  <AppHeader title="Settings" />

      {/* Clipboard Options */}
      <Section title="Clipboard Options">
        <ToggleRow
          label="Auto-Save Copied Text"
          value={!!settings.autoSave}
          onChange={(v) => updateSetting('autoSave', v)}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <ToggleRow
          label="Enable Tag Suggestions"
          value={!!settings.tagSuggestions}
          onChange={(v) => updateSetting('tagSuggestions', v)}
        />
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <ThemeSegment />
      </Section>

      {/* Support */}
      <Section title="Support">
        <TouchableOpacity style={styles.rowButton} onPress={handleRateApp}>
          <Text style={[styles.rowButtonText, { color: theme.colors.text }]}>Rate this app</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <TouchableOpacity style={styles.rowButton} onPress={handleShareApp}>
          <Text style={[styles.rowButtonText, { color: theme.colors.text }]}>Share with Friends</Text>
        </TouchableOpacity>
      </Section>

      {/* Ads Info */}
      <Section title="Ads Info">
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>This app is free and supported by ads</Text>
          <Text style={[styles.metaText, { color: theme.colors.textSecondary, marginTop: 6 }]}>We never track personal clipboard content.</Text>
        </View>
      </Section>

      {/* Bottom spacing */}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  simpleHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  simpleHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionCard: {
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.6,
  },
  rowButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentItemLeft: {
    marginLeft: 0,
  },
  segmentItemRight: {
    marginRight: 0,
  },
  bottomSpace: {
    height: 40,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SettingsScreen;