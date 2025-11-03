import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
// Background tasks only work on native platforms
const BackgroundFetch = Platform.OS !== 'web' ? require('expo-background-fetch') : null;
const TaskManager = Platform.OS !== 'web' ? require('expo-task-manager') : null;
import { ClipboardItem } from '../types';
import StorageService from './StorageService';
import { generateUniqueId, detectContentType, extractTags, extractHashtags } from '../utils';

const BACKGROUND_FETCH_TASK = 'clipboard-monitor';

class ClipboardService {
  private lastClipboardContent: string = '';
  private isMonitoring: boolean = false;

  async initializeMonitoring(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Background monitoring not supported on web');
        this.isMonitoring = false;
        return;
      }

      // Register background task
      TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        try {
          await this.checkAndSaveClipboard();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background clipboard check failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 10000, // 10 seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Get current clipboard content to initialize
      this.lastClipboardContent = await Clipboard.getStringAsync();
      this.isMonitoring = true;

      console.log('Clipboard monitoring initialized');
    } catch (error) {
      console.error('Error initializing clipboard monitoring:', error);
    }
  }

  async stopMonitoring(): Promise<void> {
    try {
      if (Platform.OS !== 'web' && BackgroundFetch) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      }
      this.isMonitoring = false;
      console.log('Clipboard monitoring stopped');
    } catch (error) {
      console.error('Error stopping clipboard monitoring:', error);
    }
  }

  async checkAndSaveClipboard(): Promise<boolean> {
    try {
      const settings = await StorageService.getAppSettings();
      if (!settings.autoSave) {
        return false;
      }

      const currentContent = await Clipboard.getStringAsync();
      
      // Check if content has changed and is not empty
      if (currentContent && currentContent !== this.lastClipboardContent && currentContent.trim().length > 0) {
        this.lastClipboardContent = currentContent;
        
        // Create clipboard item
        const clipboardItem: ClipboardItem = {
          id: generateUniqueId(),
          text: currentContent,
          timestamp: new Date(),
          isFavorite: false,
          tags: extractTags(currentContent),
          type: detectContentType(currentContent),
        };

        // Save to storage
        await StorageService.saveClipboardItem(clipboardItem);
        await StorageService.saveLastClipboardCheck(new Date());
        
        console.log('New clipboard content saved:', clipboardItem.text.substring(0, 50) + '...');
        return true;
      }
      
      await StorageService.saveLastClipboardCheck(new Date());
      return false;
    } catch (error) {
      console.error('Error checking clipboard:', error);
      return false;
    }
  }

  async manualSave(text: string, folderId?: string): Promise<ClipboardItem> {
    try {
      const clipboardItem: ClipboardItem = {
        id: generateUniqueId(),
        text: text,
        timestamp: new Date(),
        isFavorite: false,
        folderId: folderId,
        tags: extractTags(text),
        type: detectContentType(text),
      };

      await StorageService.saveClipboardItem(clipboardItem);
      return clipboardItem;
    } catch (error) {
      console.error('Error manually saving clipboard item:', error);
      throw error;
    }
  }

  async addManualItem(text: string, folderId?: string, isFavorite: boolean = false): Promise<ClipboardItem> {
    try {
      console.log('ClipboardService.addManualItem called with:', { text: text.substring(0, 50), folderId, isFavorite });
      
      const clipboardItem: ClipboardItem = {
        id: generateUniqueId(),
        text: text,
        timestamp: new Date(),
        isFavorite: isFavorite,
        folderId: folderId,
        tags: extractTags(text),
        type: detectContentType(text),
      };

      console.log('Created clipboard item:', clipboardItem.id, 'for folder:', clipboardItem.folderId);
      
      await StorageService.saveClipboardItem(clipboardItem);
      console.log('Successfully saved clipboard item to storage');
      
      return clipboardItem;
    } catch (error) {
      console.error('Error adding manual clipboard item:', error);
      throw error;
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      this.lastClipboardContent = text; // Update to prevent auto-save of our own copy
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw error;
    }
  }

  async getCurrentClipboard(): Promise<string> {
    try {
      return await Clipboard.getStringAsync();
    } catch (error) {
      console.error('Error getting current clipboard:', error);
      return '';
    }
  }

  async isClipboardAvailable(): Promise<boolean> {
    try {
      await Clipboard.getStringAsync();
      return true;
    } catch (error) {
      return false;
    }
  }

  getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }

  async toggleFavorite(itemId: string): Promise<void> {
    try {
      const items = await StorageService.getClipboardItems();
      const item = items.find(i => i.id === itemId);
      
      if (item) {
        const updatedItem = { ...item, isFavorite: !item.isFavorite };
        await StorageService.updateClipboardItem(updatedItem);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  async moveToFolder(itemId: string, folderId?: string): Promise<void> {
    try {
      const items = await StorageService.getClipboardItems();
      const item = items.find(i => i.id === itemId);
      
      if (item) {
        const updatedItem = { ...item, folderId };
        await StorageService.updateClipboardItem(updatedItem);
      }
    } catch (error) {
      console.error('Error moving item to folder:', error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      await StorageService.deleteClipboardItem(itemId);
    } catch (error) {
      console.error('Error deleting clipboard item:', error);
      throw error;
    }
  }

  async getItemsByFolder(folderId?: string): Promise<ClipboardItem[]> {
    try {
      const items = await StorageService.getClipboardItems();
      return items.filter(item => item.folderId === folderId);
    } catch (error) {
      console.error('Error getting items by folder:', error);
      return [];
    }
  }

  async getFavoriteItems(): Promise<ClipboardItem[]> {
    try {
      const items = await StorageService.getClipboardItems();
      return items.filter(item => item.isFavorite);
    } catch (error) {
      console.error('Error getting favorite items:', error);
      return [];
    }
  }

  async getRecentItems(limit: number = 20): Promise<ClipboardItem[]> {
    try {
      const items = await StorageService.getClipboardItems();
      return items
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent items:', error);
      return [];
    }
  }

  async searchItems(query: string): Promise<ClipboardItem[]> {
    try {
      return await StorageService.searchClipboardItems(query);
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  }
}

export default new ClipboardService();