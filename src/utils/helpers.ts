import { ClipboardItem } from '../types';

// Generate unique ID for clipboard items
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Detect content type based on text content
export const detectContentType = (text: string): ClipboardItem['type'] => {
  // Check if it's a URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    return 'link';
  }

  // Check if it contains hashtags
  const hashtagRegex = /#[\w]+/g;
  if (hashtagRegex.test(text)) {
    return 'hashtag';
  }

  // Check if it looks like code (contains common programming patterns)
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /class\s+\w+/,
    /import\s+.*from/,
    /export\s+(default\s+)?/,
    /console\.(log|error|warn)/,
    /\{\s*\n.*\n\s*\}/s,
    /<\/?[a-z][\s\S]*>/i,
  ];

  if (codePatterns.some(pattern => pattern.test(text))) {
    return 'code';
  }

  return 'text';
};

// Extract hashtags from text
export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#([\w]+)/g;
  const hashtags: string[] = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }

  return [...new Set(hashtags)]; // Remove duplicates
};

// Extract general tags from text (keywords, hashtags, etc.)
export const extractTags = (text: string): string[] => {
  const tags: string[] = [];

  // Extract hashtags
  const hashtags = extractHashtags(text);
  tags.push(...hashtags);

  // Extract @mentions
  const mentionRegex = /@([\w]+)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    tags.push(`@${match[1].toLowerCase()}`);
  }

  // Extract URLs and add 'link' tag
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    tags.push('link');
  }

  // Extract email addresses and add 'email' tag
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(text)) {
    tags.push('email');
  }

  // Extract phone numbers and add 'phone' tag
  const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  if (phoneRegex.test(text)) {
    tags.push('phone');
  }

  return [...new Set(tags)]; // Remove duplicates
};

// Format timestamp for display
export const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return timestamp.toLocaleDateString();
  }
};

// Format timestamp for detailed view
export const formatDetailedTimestamp = (timestamp: Date | number): string => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  // Same day
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Different year
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Truncate text for display
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// Check if text is empty or only whitespace
export const isTextEmpty = (text: string): boolean => {
  return !text || text.trim().length === 0;
};

// Clean text for display (remove extra whitespace, line breaks)
export const cleanText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

// Get text preview (first few words)
export const getTextPreview = (text: string, wordCount: number = 10): string => {
  const words = cleanText(text).split(' ');
  if (words.length <= wordCount) {
    return text;
  }
  return words.slice(0, wordCount).join(' ') + '...';
};

// Calculate text statistics
export const getTextStats = (text: string) => {
  const words = text.trim().split(/\s+/);
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const lines = text.split('\n').length;

  return {
    words: words.length,
    characters,
    charactersNoSpaces,
    lines,
  };
};

// Validate text content
export const validateText = (text: string): { isValid: boolean; error?: string } => {
  if (isTextEmpty(text)) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  if (text.length > 10000) {
    return { isValid: false, error: 'Text is too long (max 10,000 characters)' };
  }

  return { isValid: true };
};

// Sort clipboard items by different criteria
export const sortClipboardItems = (
  items: ClipboardItem[],
  sortBy: 'date' | 'alphabetical' | 'type' | 'favorite' = 'date'
): ClipboardItem[] => {
  switch (sortBy) {
    case 'date':
      return [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    case 'alphabetical':
      return [...items].sort((a, b) => a.text.localeCompare(b.text));
    case 'type':
      return [...items].sort((a, b) => a.type.localeCompare(b.type));
    case 'favorite':
      return [...items].sort((a, b) => {
        if (a.isFavorite === b.isFavorite) {
          return b.timestamp.getTime() - a.timestamp.getTime();
        }
        return a.isFavorite ? -1 : 1;
      });
    default:
      return items;
  }
};

// Filter clipboard items
export const filterClipboardItems = (
  items: ClipboardItem[],
  filters: {
    type?: ClipboardItem['type'];
    favorite?: boolean;
    folderId?: string;
    dateRange?: { start: Date; end: Date };
  }
): ClipboardItem[] => {
  return items.filter(item => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.favorite !== undefined && item.isFavorite !== filters.favorite) return false;
    if (filters.folderId !== undefined && item.folderId !== filters.folderId) return false;
    if (filters.dateRange) {
      const itemTime = item.timestamp.getTime();
      const startTime = filters.dateRange.start.getTime();
      const endTime = filters.dateRange.end.getTime();
      if (itemTime < startTime || itemTime > endTime) return false;
    }
    return true;
  });
};

// Generate color for folders
export const generateFolderColor = (): string => {
  const colors = [
    '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate random folder icon
export const generateFolderIcon = (): string => {
  const icons = [
    'folder', 'folder-open', 'document-text', 'code-bracket',
    'link', 'tag', 'star', 'heart', 'bookmark', 'archive-box'
  ];
  return icons[Math.floor(Math.random() * icons.length)];
};