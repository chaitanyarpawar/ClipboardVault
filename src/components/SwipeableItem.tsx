import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { ClipboardItem } from '../types';
import { formatTimestamp, truncateText } from '../utils';

// Conditional imports for web compatibility
const BlurView = Platform.OS === 'web' ? View : require('expo-blur').BlurView;

interface SwipeableItemProps {
  item: ClipboardItem;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  item,
  onPress,
  onLongPress,
  onToggleFavorite,
  onDelete,
  onCopy,
}) => {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftAction = (
    text: string,
    color: string,
    x: number,
    progress: Animated.AnimatedAddition<number>,
    onPress: () => void,
    icon: string
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-x, 0],
    });

    return (
      <View style={[styles.actionContainer, { backgroundColor: color }]}>
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={() => {
              console.log('Left swipe action pressed:', text);
              onPress();
              swipeableRef.current?.close();
            }}
          >
            <Ionicons name={icon as any} size={20} color="white" />
            <Text style={styles.actionText}>{text}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress: Animated.AnimatedAddition<number>) => (
    <View style={styles.rightActionsContainer}>
      {renderLeftAction(
        'Copy',
        '#10B981',
        64,
        progress,
        onCopy,
        'copy-outline'
      )}
      {renderLeftAction(
        item.isFavorite ? 'Unfav' : 'Fav',
        item.isFavorite ? '#F59E0B' : '#EF4444',
        128,
        progress,
        onToggleFavorite,
        item.isFavorite ? 'heart' : 'heart-outline'
      )}
      {renderLeftAction(
        'Delete',
        '#DC2626',
        192,
        progress,
        () => {
          Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]
          );
        },
        'trash-outline'
      )}
    </View>
  );

  const getTypeIcon = () => {
    switch (item.type) {
      case 'link': return 'link-outline';
      case 'code': return 'code-slash-outline';
      case 'hashtag': return 'pricetag-outline';
      default: return 'document-text-outline';
    }
  };

  const ItemContent = () => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: theme.colors.surface }]} 
      onPress={onPress}
      onLongPress={() => {
        if (onLongPress) {
          onLongPress();
        } else if (Platform.OS === 'web') {
          // Fallback for web - show action menu on long press
          Alert.alert(
            'Item Actions',
            'Choose an action:',
            [
              { text: 'Copy', onPress: onCopy },
              { text: item.isFavorite ? 'Unfavorite' : 'Favorite', onPress: onToggleFavorite },
              { text: 'Delete', onPress: onDelete, style: 'destructive' },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      }}
    >
      <BlurView
        {...(Platform.OS !== 'web' && { intensity: 10 })}
        style={[styles.itemContent, { backgroundColor: theme.colors.glass }]}
      >
        <View style={styles.itemHeader}>
          <View style={styles.typeInfo}>
            <Ionicons 
              name={getTypeIcon() as any} 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.typeText, { color: theme.colors.textSecondary }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          
          {item.isFavorite && (
            <Ionicons name="heart" size={16} color="#EF4444" />
          )}
        </View>

        <Text style={[styles.itemText, { color: theme.colors.text }]}>
          {truncateText(item.text, 120)}
        </Text>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: theme.colors.textSecondary }]}>
                +{item.tags.length - 3} more
              </Text>
            )}
          </View>
        )}

        <View style={styles.itemFooter}>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
          
          <View style={styles.swipeHint}>
            <Text style={[styles.swipeText, { color: theme.colors.textSecondary }]}>
              {Platform.OS === 'web' ? 'Hold' : 'Swipe ←'}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={12} 
              color={theme.colors.textSecondary} 
            />
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        leftThreshold={50}
        overshootLeft={false}
      >
        <ItemContent />
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  itemContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  itemHeader: {
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
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
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
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  // Swipe action styles
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
  },
  leftActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    minHeight: 80,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    paddingVertical: 8,
  },
  actionTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SwipeableItem;