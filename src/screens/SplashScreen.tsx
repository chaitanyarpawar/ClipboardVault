import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
// Conditional imports for web compatibility
const LinearGradient = Platform.OS === 'web' ? View : require('expo-linear-gradient').LinearGradient;
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Gradient fade in
    gradientOpacity.value = withTiming(1, { duration: 500 });
    
    // Logo scale and fade in
    setTimeout(() => {
      logoScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      logoOpacity.value = withTiming(1, { duration: 800 });
    }, 300);
    
    // Text fade in
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 600 });
    }, 800);
    
    // Navigate to onboarding
    setTimeout(() => {
      runOnJS(navigateToOnboarding)();
    }, 2500);
  };

  const navigateToOnboarding = () => {
    navigation.navigate('Onboarding' as never);
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, gradientAnimatedStyle]}>
        <LinearGradient
          {...(Platform.OS !== 'web' && { 
            colors: ['#6366F1', '#8B5CF6', '#A855F7'],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 }
          })}
          style={[StyleSheet.absoluteFillObject, Platform.OS === 'web' && { backgroundColor: '#6366F1' }]}
        />
      </Animated.View>
      
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={[styles.logoBackground, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="clipboard" size={64} color="white" />
          </View>
        </Animated.View>
        
        <Animated.View style={textAnimatedStyle}>
          <Text style={[styles.title, { color: 'white' }]}>
            Clipboard Vault
          </Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
            Never lose your copied text again
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default SplashScreen;