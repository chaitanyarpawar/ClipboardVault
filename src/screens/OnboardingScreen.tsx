import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Platform } from 'react-native';
// Conditional imports for web compatibility
const BlurView = Platform.OS === 'web' ? View : require('expo-blur').BlurView;
const LinearGradient = Platform.OS === 'web' ? View : require('expo-linear-gradient').LinearGradient;
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      icon: 'clipboard-outline',
      title: 'Auto-Save Everything',
      description: 'Automatically capture and save everything you copy to your clipboard',
    },
    {
      icon: 'folder-outline',
      title: 'Smart Organization',
      description: 'Organize your clips with folders and smart tags for easy retrieval',
    },
    {
      icon: 'search-outline',
      title: 'Find Instantly',
      description: 'Search through your clipboard history with powerful filters',
    },
    {
      icon: 'cloud-outline',
      title: 'Sync & Backup',
      description: 'Premium users get Google Drive backup and sync across devices',
    },
  ];

  const currentStepData = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Main' as never);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Main' as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        {...(Platform.OS !== 'web' && { 
          colors: isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#E2E8F0']
        })}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <BlurView
            {...(Platform.OS !== 'web' && { intensity: 20 })}
            style={[styles.iconContainer, { backgroundColor: theme.colors.glass }]}
          >
            <Ionicons 
              name={currentStepData.icon as any} 
              size={80} 
              color={theme.colors.primary} 
            />
          </BlurView>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {currentStepData.title}
          </Text>
          
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {currentStepData.description}
          </Text>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index === currentStep 
                    ? theme.colors.primary 
                    : theme.colors.textSecondary,
                  opacity: index === currentStep ? 1 : 0.3,
                }
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
        >
          <LinearGradient
            {...(Platform.OS !== 'web' && { 
              colors: ['#6366F1', '#8B5CF6'],
              start: { x: 0, y: 0 },
              end: { x: 1, y: 0 }
            })}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentStep === onboardingSteps.length - 1 ? 'checkmark' : 'arrow-forward'} 
              size={20} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default OnboardingScreen;