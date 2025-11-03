import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { Platform } from 'react-native';
// Conditional imports for web compatibility
const BlurView = Platform.OS === 'web' ? View : require('expo-blur').BlurView;
const LinearGradient = Platform.OS === 'web' ? View : require('expo-linear-gradient').LinearGradient;
import { useTheme } from '../theme';
import { ClipboardItem, Folder } from '../types';
import ClipboardService from '../services/ClipboardService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from '../services/StorageService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SwipeableItem } from '../components';

const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [isNewItemFavorite, setIsNewItemFavorite] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedItemForFolder, setSelectedItemForFolder] = useState<ClipboardItem | null>(null);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);

  // Get current tab from route name
  const currentTab = route.name as 'All' | 'Favorites' | 'Folders';

  useEffect(() => {
    loadClipboardItems();
    loadFolders();
    initializeClipboardMonitoring();
    
    // Recalculate folder item counts on app start
    StorageService.recalculateAllFolderItemCounts();
    
    // Check clipboard when window regains focus on web
    if (Platform.OS === 'web') {
      // Also check clipboard when window regains focus
      const handleFocus = async () => {
        try {
          await ClipboardService.checkAndSaveClipboard();
          await loadClipboardItems();
        } catch (error) {
          console.log('Focus clipboard check error:', error);
        }
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, currentTab]);

  const initializeClipboardMonitoring = async () => {
    try {
      await ClipboardService.initializeMonitoring();
      
      // For web, add a more frequent check since background monitoring doesn't work
      if (Platform.OS === 'web') {
        const checkInterval = setInterval(async () => {
          try {
            const hasNewContent = await ClipboardService.checkAndSaveClipboard();
            if (hasNewContent) {
              await loadClipboardItems(); // Refresh the list if new items are detected
              console.log('New clipboard content detected and saved!');
            }
          } catch (error) {
            console.log('Web clipboard check error:', error);
          }
        }, 1000); // Check every 1 second on web for better responsiveness
        
        // Store interval for cleanup (in real app, you'd want to clear this on unmount)
        (window as any).clipboardInterval = checkInterval;
      }
    } catch (error) {
      console.error('Error initializing clipboard monitoring:', error);
    }
  };

  const loadClipboardItems = async () => {
    try {
      setLoading(true);
      let items: ClipboardItem[] = [];

      switch (currentTab) {
        case 'All':
          items = await ClipboardService.getRecentItems(100);
          break;
        case 'Favorites':
          items = await ClipboardService.getFavoriteItems();
          break;
        case 'Folders':
          // Show items organized by folders
          items = await ClipboardService.getRecentItems(50);
          break;
        default:
          items = await ClipboardService.getRecentItems(100);
      }

      setClipboardItems(items);
    } catch (error) {
      console.error('Error loading clipboard items:', error);
      Alert.alert('Error', 'Failed to load clipboard items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = async () => {
    try {
      if (searchQuery.trim()) {
        const searchResults = await ClipboardService.searchItems(searchQuery);
        setClipboardItems(searchResults);
      } else {
        loadClipboardItems();
      }
    } catch (error) {
      console.error('Error filtering items:', error);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    await loadClipboardItems();
    setRefreshing(false);
  };

  const loadFolders = async () => {
    try {
      const folderList = await StorageService.getFolders();
      console.log('Loaded folders:', folderList);
      setFolders(folderList);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleAddItem = async () => {
    console.log('Opening Add Item modal, loading folders...');
    await loadFolders();
    setShowAddModal(true);
  };

  const handleSaveNewItem = async () => {
    if (!newItemText.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    try {
      console.log('=== SAVING ITEM ===');
      console.log('Text:', newItemText.trim());
      console.log('Folder ID:', selectedFolderId);
      console.log('Is favorite:', isNewItemFavorite);
      
      if (selectedFolderId) {
        // Verify the folder still exists
        const folders = await StorageService.getFolders();
        const selectedFolder = folders.find(f => f.id === selectedFolderId);
        console.log('Selected folder exists:', !!selectedFolder);
        if (selectedFolder) {
          console.log('Selected folder name:', selectedFolder.name);
        }
      }
      
      const savedItem = await ClipboardService.addManualItem(
        newItemText.trim(),
        selectedFolderId,
        isNewItemFavorite
      );
      
      console.log('Item saved successfully:', savedItem.id);
      
      // Reset form
      setNewItemText('');
      setSelectedFolderId(undefined);
      setIsNewItemFavorite(false);
      setShowAddModal(false);
      
      // Reload items and folders to reflect changes
      console.log('Reloading clipboard items...');
      await loadClipboardItems();
      console.log('Reloading folders...');
      await loadFolders();
      
      Alert.alert('Success', 'Item added successfully!');
    } catch (error) {
      console.error('=== ERROR SAVING ITEM ===', error);
      Alert.alert('Error', 'Failed to add item: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCancelAdd = () => {
    setNewItemText('');
    setSelectedFolderId(undefined);
    setIsNewItemFavorite(false);
    setShowFolderPicker(false);
    setShowAddModal(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      console.log('Creating folder:', newFolderName.trim());
      
      const newFolder: Folder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        color: '#6366F1',
        icon: 'folder',
        createdAt: new Date(),
        itemCount: 0,
      };
      
      await StorageService.saveFolder(newFolder);
      console.log('Folder saved successfully');
      
      await loadFolders();
      console.log('Folders reloaded');
      
      setSelectedFolderId(newFolder.id);
      console.log('Selected folder ID set to:', newFolder.id);
      
      setNewFolderName('');
      setShowCreateFolder(false);
      
      Alert.alert('Success', `Folder "${newFolder.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to create folder: ${errorMessage}`);
    }
  };

  const handleCancelCreateFolder = () => {
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await ClipboardService.copyToClipboard(text);
      Alert.alert('Copied', 'Text copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    try {
      await ClipboardService.toggleFavorite(itemId);
      loadClipboardItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ClipboardService.deleteItem(itemId);
              loadClipboardItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleLongPressItem = (item: ClipboardItem) => {
    setSelectedItemForFolder(item);
    setShowMoveToFolderModal(true);
  };

  const handleMoveItemToFolder = async (folderId: string | undefined) => {
    if (!selectedItemForFolder) return;
    
    try {
      const updatedItem = { ...selectedItemForFolder, folderId };
      await StorageService.updateClipboardItem(updatedItem);
      await loadClipboardItems();
      setShowMoveToFolderModal(false);
      setSelectedItemForFolder(null);
      
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name || 'Unknown' : 'No folder';
      Alert.alert('Success', `Item moved to ${folderName}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to move item to folder');
    }
  };

  const renderClipboardItem = ({ item }: { item: ClipboardItem }) => (
    <SwipeableItem
      item={item}
      onPress={() => (navigation as any).navigate('Detail', { itemId: item.id })}
      onLongPress={() => handleLongPressItem(item)}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
      onDelete={() => handleDeleteItem(item.id)}
      onCopy={() => handleCopyToClipboard(item.text)}
    />
  );

  const getTypeIcon = (type: ClipboardItem['type']) => {
    switch (type) {
      case 'link': return 'link-outline';
      case 'code': return 'code-slash-outline';
      case 'hashtag': return 'pricetag-outline';
      default: return 'document-text-outline';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search items..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Manual clipboard check button for testing */}
        <TouchableOpacity 
          onPress={async () => {
            try {
              const hasNew = await ClipboardService.checkAndSaveClipboard();
              await loadClipboardItems();
              Alert.alert('Clipboard Check', hasNew ? 'New content detected!' : 'No new content');
            } catch (error) {
              Alert.alert('Error', 'Failed to check clipboard');
            }
          }}
          style={{ marginLeft: 8 }}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={clipboardItems}
        keyExtractor={(item) => item.id}
        renderItem={renderClipboardItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {loading ? 'Loading...' : `No ${currentTab.toLowerCase()} items yet`}
            </Text>
            {!loading && (
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Copy some text to get started
              </Text>
            )}
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddItem}
      >
        <LinearGradient
          {...(Platform.OS !== 'web' && { colors: ['#6366F1', '#8B5CF6'] })}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAdd}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.createFolderModal, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
            }]}
          >
            <View style={styles.createFolderHeader}>
              <Text style={[styles.createFolderTitle, { color: theme.colors.text }]}>
                Add New Item
              </Text>
            </View>

            <View style={styles.createFolderBody}>
              <Text style={[styles.createFolderLabel, { color: theme.colors.textSecondary }]}>
                Text content
              </Text>
              <TextInput
                style={[styles.addItemInput, { 
                  color: theme.colors.text,
                  backgroundColor: 'transparent',
                  borderColor: theme.colors.border,
                }]}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Enter your text here..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline={true}
                autoFocus={true}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={[styles.simpleOption, { 
                  backgroundColor: isNewItemFavorite 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'transparent' 
                }]}
                onPress={() => setIsNewItemFavorite(!isNewItemFavorite)}
              >
                <Ionicons 
                  name={isNewItemFavorite ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={isNewItemFavorite ? '#EF4444' : theme.colors.textSecondary} 
                />
                <Text style={[styles.simpleOptionText, { 
                  color: isNewItemFavorite ? '#EF4444' : theme.colors.text
                }]}>
                  Mark as favorite
                </Text>
              </TouchableOpacity>

              <Text style={[styles.createFolderLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                Folder (optional)
              </Text>
              
              <TouchableOpacity 
                style={[styles.createFolderInput, { 
                  backgroundColor: 'transparent',
                  borderColor: theme.colors.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 16,
                }]}
                onPress={() => setShowFolderPicker(!showFolderPicker)}
              >
                <Text style={[styles.simpleOptionText, { 
                  color: selectedFolderId 
                    ? theme.colors.text 
                    : theme.colors.textSecondary 
                }]}>
                  {selectedFolderId 
                    ? folders.find(f => f.id === selectedFolderId)?.name || 'Select folder'
                    : 'Select folder'
                  }
                </Text>
                <Ionicons 
                  name={showFolderPicker ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>

              {showFolderPicker && (
                <ScrollView style={[styles.simpleFolderList, { 
                  backgroundColor: isDark ? '#374151' : '#f9fafb',
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  marginTop: 4,
                }]} nestedScrollEnabled={true}>
                  <TouchableOpacity 
                    style={[
                      styles.simpleFolderOption,
                      !selectedFolderId && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                    onPress={() => {
                      setSelectedFolderId(undefined);
                      setShowFolderPicker(false);
                    }}
                  >
                    <Text style={[styles.simpleOptionText, { 
                      color: !selectedFolderId ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: !selectedFolderId ? '600' : 'normal'
                    }]}>
                      No folder
                    </Text>
                  </TouchableOpacity>
                  
                  {folders.length === 0 ? (
                    <TouchableOpacity style={styles.simpleFolderOption}>
                      <Text style={[styles.simpleOptionText, { color: theme.colors.textSecondary }]}>
                        No folders available
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    folders.map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        style={[
                          styles.simpleFolderOption,
                          selectedFolderId === folder.id && { backgroundColor: theme.colors.primary + '20' }
                        ]}
                        onPress={() => {
                          console.log('Selected folder:', folder.name, 'with ID:', folder.id);
                          setSelectedFolderId(folder.id);
                          setShowFolderPicker(false);
                        }}
                      >
                        <Text style={[styles.simpleOptionText, { 
                          color: selectedFolderId === folder.id ? theme.colors.primary : theme.colors.text,
                          fontWeight: selectedFolderId === folder.id ? '600' : 'normal'
                        }]}>
                          {folder.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                  
                  <View style={[styles.folderDivider, { backgroundColor: theme.colors.border }]} />
                  
                  <TouchableOpacity 
                    style={styles.simpleFolderOption}
                    onPress={() => {
                      console.log('Create new folder button pressed');
                      setShowFolderPicker(false);
                      setShowCreateFolder(true);
                    }}
                  >
                    <Text style={[styles.simpleOptionText, { 
                      color: theme.colors.primary,
                      fontWeight: '600'
                    }]}>
                      + Create new folder
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>

            <View style={styles.createFolderActions}>
              <TouchableOpacity 
                style={[styles.createFolderButton, styles.cancelFolderButton, { backgroundColor: 'transparent' }]}
                onPress={handleCancelAdd}
              >
                <Text style={[styles.createFolderButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.createFolderButton, styles.createFolderButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveNewItem}
              >
                <Text style={[styles.createFolderButtonText, { color: 'white' }]}>
                  Save Item
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolder}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelCreateFolder}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.createFolderModal, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
            }]}
          >
            <View style={styles.createFolderHeader}>
              <Text style={[styles.createFolderTitle, { color: theme.colors.text }]}>
                Create New Folder
              </Text>
            </View>

            <View style={styles.createFolderBody}>
              <Text style={[styles.createFolderLabel, { color: theme.colors.textSecondary }]}>
                Folder name
              </Text>
              <TextInput
                style={[styles.createFolderInput, { 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }]}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder=""
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus={true}
              />
            </View>

            <View style={styles.createFolderActions}>
              <TouchableOpacity 
                style={[styles.createFolderButton, styles.cancelFolderButton, { backgroundColor: theme.colors.surface }]}
                onPress={handleCancelCreateFolder}
              >
                <Text style={[styles.createFolderButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.createFolderButton, styles.createFolderButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateFolder}
              >
                <Text style={[styles.createFolderButtonText, { color: 'white' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal
        visible={showMoveToFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoveToFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            {...(Platform.OS !== 'web' && { intensity: 80 })}
            style={[styles.createFolderModal, { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }]}
          >
            <Text style={[styles.createFolderTitle, { color: theme.colors.text }]}>
              Move to Folder
            </Text>
            <Text style={[styles.createFolderSubtitle, { color: theme.colors.textSecondary }]}>
              Choose a folder for this item
            </Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 20 }}>
              <TouchableOpacity
                style={[styles.folderOption, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleMoveItemToFolder(undefined)}
              >
                <Text style={[styles.folderOptionText, { color: theme.colors.text }]}>
                  No folder (Uncategorized)
                </Text>
              </TouchableOpacity>

              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[styles.folderOption, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleMoveItemToFolder(folder.id)}
                >
                  <View style={[styles.folderIcon, { backgroundColor: folder.color, width: 24, height: 24 }]}>
                    <Ionicons name={folder.icon as any} size={14} color="white" />
                  </View>
                  <Text style={[styles.folderOptionText, { color: theme.colors.text }]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.createFolderButtonContainer}>
              <TouchableOpacity 
                style={[styles.createFolderButton, styles.createFolderButtonSecondary]}
                onPress={() => {
                  setShowMoveToFolderModal(false);
                  setSelectedItemForFolder(null);
                }}
              >
                <Text style={[styles.createFolderButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
  },
  itemActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 8,
  },
  favoriteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  optionText: {
    fontSize: 17,
    marginLeft: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saveButton: {
    // Custom styling handled by backgroundColor prop
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Folder selector styles
  folderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    minHeight: 56,
  },
  folderSelectorText: {
    fontSize: 17,
    fontWeight: '600',
  },
  folderList: {
    borderWidth: 2,
    borderRadius: 16,
    maxHeight: 240,
    marginBottom: 20,
    overflow: 'hidden',
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    minHeight: 56,
  },
  folderOptionText: {
    fontSize: 17,
    marginLeft: 16,
    flex: 1,
    fontWeight: '500',
  },
  createFolderOption: {
    borderBottomWidth: 0,
  },
  // Create folder modal styles
  createFolderModal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  createFolderHeader: {
    alignItems: 'center',
    padding: 32,
    paddingBottom: 24,
  },
  createFolderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  createFolderBody: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  createFolderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'left',
  },
  createFolderInput: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
    padding: 16,
    paddingHorizontal: 0,
    fontSize: 18,
    fontWeight: '500',
  },
  createFolderActions: {
    flexDirection: 'row',
    padding: 32,
    paddingTop: 16,
  },
  createFolderButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelFolderButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  createFolderButtonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createFolderButtonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Simple form styles for Add Item modal
  addItemInput: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
    padding: 16,
    paddingHorizontal: 0,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  simpleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  simpleOptionText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  simpleFolderList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
  },
  simpleFolderOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  folderDivider: {
    height: 1,
    marginVertical: 4,
  },
  createFolderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  folderIcon: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFolderButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  createFolderButtonSecondary: {
    backgroundColor: 'transparent',
    marginHorizontal: 8,
  },
});

export default HomeScreen;