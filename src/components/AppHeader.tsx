import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
};

const AppHeader: React.FC<Props> = ({ title, leftIcon, rightIcon, onLeftPress, onRightPress }) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.wrapper, { backgroundColor: theme.colors.primary }]}> 
      <View style={styles.bar}>
        <TouchableOpacity style={styles.iconHit} onPress={onLeftPress} disabled={!onLeftPress}>
          {leftIcon ? <Ionicons name={leftIcon as any} size={22} color="#FFFFFF" /> : <View style={{ width: 22 }} />}
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity style={styles.iconHit} onPress={onRightPress} disabled={!onRightPress}>
          {rightIcon ? <Ionicons name={rightIcon as any} size={22} color="#FFFFFF" /> : <View style={{ width: 22 }} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconHit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AppHeader;