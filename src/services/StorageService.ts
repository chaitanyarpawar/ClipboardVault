import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClipboardItem, Folder, AppSettings, User } from '../types';

const STORAGE_KEYS = {
  CLIPBOARD_ITEMS: 'clipboard_items',
  FOLDERS: 'folders',
  APP_SETTINGS: 'app_settings',
  USER_DATA: 'user_data',
  LAST_CLIPBOARD_CHECK: 'last_clipboard_check',
};

class StorageService {
  // Clipboard Items
  async getClipboardItems(): Promise<ClipboardItem[]> {
    try {
      const items = await AsyncStorage.getItem(STORAGE_KEYS.CLIPBOARD_ITEMS);
      if (items) {
        const parsedItems = JSON.parse(items);
        // Convert timestamp strings back to Date objects
        return parsedItems.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting clipboard items:', error);
      return [];
    }
  }

  async saveClipboardItem(item: ClipboardItem): Promise<void> {
    try {
      console.log('StorageService.saveClipboardItem called for item:', item.id);
      
      const items = await this.getClipboardItems();
      const updatedItems = [item, ...items];
      await AsyncStorage.setItem(STORAGE_KEYS.CLIPBOARD_ITEMS, JSON.stringify(updatedItems));
      console.log('Clipboard item saved to storage successfully');
      
      // Update folder item count if item belongs to a folder
      if (item.folderId) {
        console.log('Updating item count for folder:', item.folderId);
        await this.updateFolderItemCount(item.folderId);
      }
    } catch (error) {
      console.error('Error saving clipboard item:', error);
      throw error; // Re-throw to let caller handle it
    }
  }

  async updateClipboardItem(updatedItem: ClipboardItem): Promise<void> {
    try {
      const items = await this.getClipboardItems();
      const oldItem = items.find(item => item.id === updatedItem.id);
      const updatedItems = items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      await AsyncStorage.setItem(STORAGE_KEYS.CLIPBOARD_ITEMS, JSON.stringify(updatedItems));
      
      // Update folder item counts if folder changed
      if (oldItem && oldItem.folderId !== updatedItem.folderId) {
        if (oldItem.folderId) {
          await this.updateFolderItemCount(oldItem.folderId);
        }
        if (updatedItem.folderId) {
          await this.updateFolderItemCount(updatedItem.folderId);
        }
      }
    } catch (error) {
      console.error('Error updating clipboard item:', error);
    }
  }

  async deleteClipboardItem(itemId: string): Promise<void> {
    try {
      const items = await this.getClipboardItems();
      const itemToDelete = items.find(item => item.id === itemId);
      const updatedItems = items.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.CLIPBOARD_ITEMS, JSON.stringify(updatedItems));
      
      // Update folder item count if item belonged to a folder
      if (itemToDelete && itemToDelete.folderId) {
        await this.updateFolderItemCount(itemToDelete.folderId);
      }
    } catch (error) {
      console.error('Error deleting clipboard item:', error);
    }
  }

  async searchClipboardItems(query: string): Promise<ClipboardItem[]> {
    try {
      const items = await this.getClipboardItems();
      const lowerQuery = query.toLowerCase();
      return items.filter(item => 
        item.text.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching clipboard items:', error);
      return [];
    }
  }

  // Folders
  async getFolders(): Promise<Folder[]> {
    try {
      const folders = await AsyncStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (folders) {
        const parsedFolders = JSON.parse(folders);
        return parsedFolders.map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting folders:', error);
      return [];
    }
  }

  async saveFolder(folder: Folder): Promise<void> {
    try {
      const folders = await this.getFolders();
      
      // Check if folder with same ID or name already exists
      const existingFolder = folders.find(f => f.id === folder.id || f.name === folder.name);
      if (existingFolder) {
        throw new Error(`Folder with name "${folder.name}" already exists`);
      }
      
      const updatedFolders = [...folders, folder];
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
      console.log('Successfully saved folder:', folder.name);
    } catch (error) {
      console.error('Error saving folder:', error);
      throw error; // Re-throw to let caller handle it
    }
  }

  async updateFolder(updatedFolder: Folder): Promise<void> {
    try {
      const folders = await this.getFolders();
      const updatedFolders = folders.map(folder => 
        folder.id === updatedFolder.id ? updatedFolder : folder
      );
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  }

  async updateFolderItemCount(folderId: string): Promise<void> {
    try {
      const items = await this.getClipboardItems();
      const folders = await this.getFolders();
      
      // Count items in this folder
      const itemCount = items.filter(item => item.folderId === folderId).length;
      
      // Update the folder's item count
      const updatedFolders = folders.map(folder => 
        folder.id === folderId ? { ...folder, itemCount } : folder
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
      console.log(`Updated folder ${folderId} item count to ${itemCount}`);
    } catch (error) {
      console.error('Error updating folder item count:', error);
    }
  }

  async recalculateAllFolderItemCounts(): Promise<void> {
    try {
      const items = await this.getClipboardItems();
      const folders = await this.getFolders();
      
      const updatedFolders = folders.map(folder => {
        const itemCount = items.filter(item => item.folderId === folder.id).length;
        return { ...folder, itemCount };
      });
      
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
      console.log('Recalculated all folder item counts');
    } catch (error) {
      console.error('Error recalculating folder item counts:', error);
    }
  }

  async deleteFolder(folderId: string): Promise<void> {
    try {
      console.log('StorageService.deleteFolder called for folder ID:', folderId);
      
      const folders = await this.getFolders();
      console.log('Current folders before deletion:', folders.map(f => f.name));
      
      const folderToDelete = folders.find(f => f.id === folderId);
      if (!folderToDelete) {
        throw new Error(`Folder with ID ${folderId} not found`);
      }
      
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      console.log('Updated folders after filtering:', updatedFolders.map(f => f.name));
      
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
      console.log('Folders updated in storage successfully');
      
      // Also remove folder reference from clipboard items
      const items = await this.getClipboardItems();
      const itemsInFolder = items.filter(item => item.folderId === folderId);
      console.log(`Found ${itemsInFolder.length} items in folder that will be moved to uncategorized`);
      
      const updatedItems = items.map(item => 
        item.folderId === folderId ? { ...item, folderId: undefined } : item
      );
      await AsyncStorage.setItem(STORAGE_KEYS.CLIPBOARD_ITEMS, JSON.stringify(updatedItems));
      console.log('Items updated in storage successfully');
      
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error; // Re-throw to let caller handle it
    }
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (settings) {
        return JSON.parse(settings);
      }
      // Default settings
      const defaultSettings: AppSettings = {
        theme: 'system',
        autoSave: true,
        backgroundSync: true,
        hapticFeedback: true,
        isPremium: false,
        googleDriveBackup: false,
      };
      await this.saveAppSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting app settings:', error);
      return {
        theme: 'system',
        autoSave: true,
        backgroundSync: true,
        hapticFeedback: true,
        isPremium: false,
        googleDriveBackup: false,
      };
    }
  }

  async saveAppSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
  }

  // User Data
  async getUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        return {
          ...parsed,
          subscriptionExpiry: parsed.subscriptionExpiry ? new Date(parsed.subscriptionExpiry) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async saveUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Last clipboard check
  async getLastClipboardCheck(): Promise<Date | null> {
    try {
      const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CLIPBOARD_CHECK);
      return lastCheck ? new Date(lastCheck) : null;
    } catch (error) {
      console.error('Error getting last clipboard check:', error);
      return null;
    }
  }

  async saveLastClipboardCheck(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_CLIPBOARD_CHECK, date.toISOString());
    } catch (error) {
      console.error('Error saving last clipboard check:', error);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Export data for backup
  async exportData(): Promise<string> {
    try {
      const [items, folders, settings, userData] = await Promise.all([
        this.getClipboardItems(),
        this.getFolders(),
        this.getAppSettings(),
        this.getUserData(),
      ]);

      const exportData = {
        items,
        folders,
        settings,
        userData,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data from backup
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.items) {
        await AsyncStorage.setItem(STORAGE_KEYS.CLIPBOARD_ITEMS, JSON.stringify(data.items));
      }
      if (data.folders) {
        await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(data.folders));
      }
      if (data.settings) {
        await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(data.settings));
      }
      if (data.userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.userData));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

export default new StorageService();