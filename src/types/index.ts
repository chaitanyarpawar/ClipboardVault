export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: Date;
  isFavorite: boolean;
  folderId?: string;
  tags: string[];
  type: 'text' | 'link' | 'hashtag' | 'code';
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  createdAt: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  tagSuggestions?: boolean; // Enable Tag Suggestions feature flag
  backgroundSync: boolean;
  hapticFeedback: boolean;
  isPremium: boolean;
  googleDriveBackup: boolean;
}

export interface User {
  id: string;
  email?: string;
  subscriptionType: 'free' | 'premium';
  subscriptionExpiry?: Date;
}