import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple test app to check if basic React Native works on web
export default function TestApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 Clipboard Vault</Text>
      <Text style={styles.subtitle}>App is working on web!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
});