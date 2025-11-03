import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../theme';
import { ClipboardItem } from '../types';
import StorageService from '../services/StorageService';
import ClipboardService from '../services/ClipboardService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SwipeableItem } from '../components';
import { RootStackParamList } from '../navigation/Navigation';

type FolderDetailRouteProp = RouteProp<RootStackParamList, 'FolderDetail'>;
type FolderDetailNavigationProp = StackNavigationProp<RootStackParamList, 'FolderDetail'>;

const FolderDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<FolderDetailNavigationProp>();
  const route = useRoute<FolderDetailRouteProp>();
  const { folderId, folderName } = route.params;

  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFolderItems();
  }, [folderId]);

  useEffect(() => {
    navigation.setOptions({
      title: `${folderName} (${items.length})`,
    });
  }, [navigation, folderName, items.length]);

  const loadFolderItems = async () => {
    try {
      setLoading(true);
      const allItems = await StorageService.getClipboardItems();
      const folderItems = allItems.filter(item => item.folderId === folderId);
      setItems(folderItems);
    } catch (error) {
      console.error('Error loading folder items:', error);
      Alert.alert('Error', 'Failed to load folder items');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFolderItems();
    setRefreshing(false);
  };

  const handleCopyItem = async (item: ClipboardItem) => {
    try {
      await ClipboardService.copyToClipboard(item.text);
      Alert.alert('Copied', 'Text copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handleToggleFavorite = async (item: ClipboardItem) => {
    try {
      const updatedItem = { ...item, isFavorite: !item.isFavorite };
      await StorageService.updateClipboardItem(updatedItem);
      await loadFolderItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleDeleteItem = async (item: ClipboardItem) => {
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
              await StorageService.deleteClipboardItem(item.id);
              await loadFolderItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ClipboardItem }) => (
    <SwipeableItem
      item={item}
      onPress={() => navigation.navigate('Detail', { itemId: item.id })}
      onCopy={() => handleCopyItem(item)}
      onToggleFavorite={() => handleToggleFavorite(item)}
      onDelete={() => handleDeleteItem(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="folder-open-outline" 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Items Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        This folder is empty. Add items to this folder from the main screen.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FolderDetailScreen;