import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Platform } from 'react-native';
import { useTheme } from '../theme';
import { Folder, ClipboardItem } from '../types';
import StorageService from '../services/StorageService';
import ClipboardService from '../services/ClipboardService';
import { Ionicons } from '@expo/vector-icons';
import { generateUniqueId, generateFolderColor, generateFolderIcon } from '../utils';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/Navigation';

// Conditional imports for web compatibility
const BlurView = Platform.OS === 'web' ? View : require('expo-blur').BlurView;

type FoldersScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const FoldersScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<FoldersScreenNavigationProp>();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const initializeFolders = async () => {
      await loadFolders();
      await recalculateItemCounts(); // Recalculate counts on initial load
    };
    
    initializeFolders();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Recalculate folder item counts when screen comes into focus
      recalculateItemCounts();
    });

    return unsubscribe;
  }, [navigation, folders]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const folderData = await StorageService.getFolders();
      setFolders(folderData);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateItemCounts = async () => {
    try {
      console.log('Recalculating folder item counts...');
      await StorageService.recalculateAllFolderItemCounts();
      // Reload folders to get updated counts
      const updatedFolders = await StorageService.getFolders();
      setFolders(updatedFolders);
      console.log('Folder item counts updated');
    } catch (error) {
      console.error('Error recalculating item counts:', error);
    }
  };



  const handleCreateFolder = async () => {
    if (newFolderName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      const newFolder: Folder = {
        id: generateUniqueId(),
        name: newFolderName.trim(),
        icon: generateFolderIcon(),
        color: generateFolderColor(),
        itemCount: 0,
        createdAt: new Date(),
      };

      await StorageService.saveFolder(newFolder);
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    console.log('handleDeleteFolder called for:', folderName, 'ID:', folderId);
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folderName}"? All items will be moved to uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('User confirmed deletion, calling StorageService.deleteFolder');
              await StorageService.deleteFolder(folderId);
              console.log('Folder deleted from storage, reloading folders');
              await loadFolders(); // Reload from storage instead of filtering local state
              await recalculateItemCounts(); // Recalculate item counts after deletion
              console.log('Folders reloaded successfully');
              Alert.alert('Success', 'Folder deleted successfully');
            } catch (error) {
              console.error('Error deleting folder:', error);
              Alert.alert('Error', 'Failed to delete folder: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
          },
        },
      ]
    );
  };

  const getFolderItemCount = async (folderId: string): Promise<number> => {
    try {
      const items = await ClipboardService.getItemsByFolder(folderId);
      return items.length;
    } catch (error) {
      return 0;
    }
  };

  const renderFolderCard = ({ item }: { item: Folder }) => (
    <View style={[styles.folderCard, { backgroundColor: theme.colors.glass }]}>
      <TouchableOpacity
        style={styles.folderContent}
        onPress={() => {
          console.log('Navigating to folder:', item.name);
          navigation.navigate('FolderDetail', {
            folderId: item.id,
            folderName: item.name,
          });
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.folderIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={32} color="white" />
        </View>
        
        <View style={styles.folderInfo}>
          <Text style={[styles.folderName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.folderCount, { color: theme.colors.textSecondary }]}>
            {item.itemCount} items
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#FF4444',
          padding: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        }}
        onPress={() => handleDeleteFolder(item.id, item.name)}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>DELETE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Folders List */}
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        renderItem={renderFolderCard}
        contentContainerStyle={styles.foldersList}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {loading ? 'Loading folders...' : 'No folders yet'}
            </Text>
          </View>
        }
      />

      {/* Create Folder FAB */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            {...(Platform.OS !== 'web' && { intensity: 80 })}
            style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Create New Folder
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }]}
              placeholder="Folder name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButtonModal, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateFolder}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Create
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  foldersList: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  folderCard: {
    flex: 0.48,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    minHeight: 180,
    overflow: 'hidden',
  },
  folderContent: {
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    flex: 1,
  },
  folderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  folderInfo: {
    alignItems: 'center',
    marginBottom: 8,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  createButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 300,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  createButtonModal: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FoldersScreen;