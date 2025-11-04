import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { useTheme } from '../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ClipboardItem } from '../types';
import ClipboardService from '../services/ClipboardService';
import StorageService from '../services/StorageService';
import { Ionicons } from '@expo/vector-icons';
import { formatDetailedTimestamp, getTextStats } from '../utils';

// Conditional imports for web compatibility
const BlurView = Platform.OS === 'web' ? View : require('expo-blur').BlurView;

const DetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId } = route.params as { itemId: string };
  
  const [item, setItem] = useState<ClipboardItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Toast function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const items = await StorageService.getClipboardItems();
      const foundItem = items.find(i => i.id === itemId);
      if (foundItem) {
        setItem(foundItem);
        setEditText(foundItem.text);
      } else {
        Alert.alert('Error', 'Item not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load item');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!item) return;
    try {
      await ClipboardService.copyToClipboard(item.text);
      showToast('Text copied to clipboard');
    } catch (error) {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        message: item.text,
        title: 'Shared from Clipboard Vault',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!item) return;
    try {
      const updatedItem = { ...item, text: editText };
      await StorageService.updateClipboardItem(updatedItem);
      setItem(updatedItem);
      setIsEditing(false);
      showToast('Text updated successfully');
    } catch (error) {
      showToast('Failed to update text', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    try {
      await ClipboardService.toggleFavorite(item.id);
      setItem({ ...item, isFavorite: !item.isFavorite });
    } catch (error) {
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
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
              await ClipboardService.deleteItem(item.id);
              showToast('Item deleted successfully');
              // Navigate back after a short delay to show the toast
              setTimeout(() => {
                navigation.goBack();
              }, 1500);
            } catch (error) {
              showToast('Failed to delete item', 'error');
            }
          }
        }
      ]
    );
  };

  const getTypeIcon = (type: ClipboardItem['type']) => {
    switch (type) {
      case 'link': return 'link-outline';
      case 'code': return 'code-slash-outline';
      case 'hashtag': return 'pricetag-outline';
      default: return 'document-text-outline';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          Item not found
        </Text>
      </View>
    );
  }

  const textStats = getTextStats(item.text);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Info */}
      <BlurView
        {...(Platform.OS !== 'web' && { intensity: 20 })}
        style={[styles.headerCard, { backgroundColor: theme.colors.glass }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.typeInfo}>
            <Ionicons 
              name={getTypeIcon(item.type) as any} 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.typeText, { color: theme.colors.text }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={item.isFavorite ? '#EF4444' : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {formatDetailedTimestamp(item.timestamp)}
        </Text>
      </BlurView>

      {/* Text Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <BlurView
          {...(Platform.OS !== 'web' && { intensity: 20 })}
          style={[styles.textCard, { backgroundColor: theme.colors.glass }]}
        >
          {isEditing ? (
            <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }]}
              value={editText}
              onChangeText={setEditText}
              multiline={true}
              autoFocus={true}
              placeholderTextColor={theme.colors.textSecondary}
            />
          ) : (
            <Text style={[styles.textContent, { color: theme.colors.text }]}>
              {item.text}
            </Text>
          )}
        </BlurView>

        {/* Text Statistics */}
        <BlurView
          {...(Platform.OS !== 'web' && { intensity: 20 })}
          style={[styles.statsCard, { backgroundColor: theme.colors.glass }]}
        >
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {textStats.characters}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Characters
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {textStats.words}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Words
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {textStats.lines}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Lines
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Tags */}
        {item.tags.length > 0 && (
          <BlurView
            {...(Platform.OS !== 'web' && { intensity: 20 })}
            style={[styles.tagsCard, { backgroundColor: theme.colors.glass }]}
          >
            <Text style={[styles.tagsTitle, { color: theme.colors.text }]}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: theme.colors.surface }]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </BlurView>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: theme.colors.background }]}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, flex: 1, marginRight: 8 }]}
              onPress={() => {
                setIsEditing(false);
                setEditText(item.text);
              }}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 8 }]}
              onPress={handleSaveEdit}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={[styles.actionText, { color: 'white' }]}>
                Save
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                Copy
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                Share
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: toastType === 'success' ? '#4CAF50' : '#F44336',
              bottom: 100,
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  textCard: {
    margin: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statsCard: {
    margin: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tagsCard: {
    margin: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  // Toast styles
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DetailScreen;