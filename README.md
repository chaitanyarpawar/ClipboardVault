# 📋 Clipboard Vault - Smart Clipboard Manager

A sleek and minimal Clipboard Manager + Text Saver app built with **Expo** and **React Native**, featuring a modern glass-like UI, light/dark themes, and intelligent organization features.

## 🌟 Features

### Core Features
- 🔄 **Auto-Save Clipboard**: Automatically captures and saves copied text every 10 seconds
- 📁 **Smart Organization**: Organize clips with folders and intelligent tags
- 🔍 **Powerful Search**: Search through clipboard history with filters
- ⭐ **Favorites**: Mark important clips as favorites for quick access
- 🎨 **Beautiful UI**: Glassmorphism design with smooth animations
- 🌓 **Theme Support**: Light, dark, and system themes
- 🏷️ **Smart Tagging**: Auto-detect hashtags, links, emails, and more

### Premium Features
- ☁️ **Google Drive Backup**: Sync and backup across devices
- 🚫 **Ad-Free Experience**: Remove all advertisements
- 📊 **Advanced Analytics**: Usage statistics and insights

## 🎨 Design System

### Visual Style
- **Theme**: Glassmorphism + Neumorphism hybrid
- **Typography**: Poppins / Inter / Manrope
- **Corners**: 24px rounded corners
- **Effects**: Soft shadows, blurred backgrounds, gradient rings

### Color Palette
```
Primary:    #6366F1 (Indigo)
Accent:     #10B981 (Emerald)
Surface:    rgba(255,255,255,0.12)
BG Light:   #F9FAFB
BG Dark:    #0F172A
Text:       #111827 / #F9FAFB
```

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54 + React Native + TypeScript
- **UI Library**: react-native-paper + react-native-reanimated + expo-linear-gradient
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Storage**: @react-native-async-storage/async-storage
- **Clipboard**: expo-clipboard
- **Background Tasks**: expo-background-fetch + expo-task-manager
- **Navigation**: @react-navigation/native (Stack + Bottom Tabs + Material Top Tabs)
- **Animations**: React Native Reanimated + Lottie
- **Icons**: react-native-vector-icons

## 📱 App Structure

### Screens
1. **Splash Screen** - Animated intro with gradient background
2. **Onboarding** - 4-step introduction to features
3. **Home Screen** - Main clipboard items with tabs (All/Favorites/Recent)
4. **Folders Screen** - Organize clips into folders
5. **Detail View** - Expanded view with full text and actions
6. **Settings** - Theme, backup, and app preferences
7. **Premium** - Subscription and upgrade options

### Key Components
- **ThemeProvider**: Light/dark theme management
- **StorageService**: AsyncStorage abstraction for data persistence
- **ClipboardService**: Background monitoring and clipboard operations
- **Navigation**: Multi-level navigation with smooth transitions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ClipboardVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

### Development Commands
```bash
# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Build for production
npx expo build:android
npx expo build:ios

# Clear cache and restart
npx expo start -c
```

## 📂 Project Structure

```
ClipboardVault/
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/           # Screen components
│   │   ├── SplashScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── FoldersScreen.tsx
│   │   ├── DetailScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── PremiumScreen.tsx
│   ├── navigation/        # Navigation configuration
│   │   └── Navigation.tsx
│   ├── services/         # Business logic and API calls
│   │   ├── StorageService.ts
│   │   └── ClipboardService.ts
│   ├── theme/           # Theme configuration
│   │   ├── colors.ts
│   │   ├── ThemeContext.tsx
│   │   └── index.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   └── utils/           # Helper functions
│       └── helpers.ts
├── assets/              # Images, icons, animations
├── App.tsx             # Main app component
├── babel.config.js     # Babel configuration
├── tailwind.config.js  # TailwindCSS configuration
├── app.json           # Expo configuration
└── package.json       # Dependencies and scripts
```

## 🔧 Key Features Implementation

### Auto-Clipboard Monitoring
```typescript
// Background task that runs every 10 seconds
const checkAndSaveClipboard = async () => {
  const currentContent = await Clipboard.getStringAsync();
  if (currentContent !== lastContent) {
    // Save new clipboard content
    await StorageService.saveClipboardItem(newItem);
  }
};
```

### Smart Tagging
```typescript
// Auto-detect content type and extract tags
const detectContentType = (text: string) => {
  if (urlRegex.test(text)) return 'link';
  if (hashtagRegex.test(text)) return 'hashtag';
  if (codePatterns.some(p => p.test(text))) return 'code';
  return 'text';
};
```

### Glassmorphism UI
```typescript
<BlurView
  intensity={20}
  style={{
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  }}
>
  {/* Content */}
</BlurView>
```

## 📊 Data Models

### ClipboardItem
```typescript
interface ClipboardItem {
  id: string;
  text: string;
  timestamp: Date;
  isFavorite: boolean;
  folderId?: string;
  tags: string[];
  type: 'text' | 'link' | 'hashtag' | 'code';
}
```

### Folder
```typescript
interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  createdAt: Date;
}
```

## 🎯 Future Enhancements

### Planned Features
- [ ] Voice-to-text notes (expo-speech)
- [ ] AI-powered suggestions (OpenAI API integration)
- [ ] Home screen widget for quick access
- [ ] Cross-device synchronization
- [ ] Advanced text processing (OCR for images)
- [ ] Export options (PDF, TXT, JSON)
- [ ] Collaboration features
- [ ] Custom keyboard extension

### Monetization Strategy
- **Free Tier**: Basic features with ads
- **Premium Tier** (₹99/month or ₹699/year):
  - Google Drive backup and sync
  - Ad-free experience
  - Advanced analytics
  - Unlimited folders and tags
  - Priority support

## 🧪 Testing

### Test Strategy
- Unit tests for utility functions
- Integration tests for services
- E2E tests for critical user flows
- Performance testing for background tasks

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npx detox test
```

## 🚀 Deployment

### Build Configuration
```json
{
  "expo": {
    "name": "Clipboard Vault",
    "slug": "clipboard-vault",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.clipboardvault.app"
    },
    "android": {
      "package": "com.clipboardvault.app"
    }
  }
}
```

### Release Process
1. Update version in `app.json`
2. Test on multiple devices
3. Build production bundles
4. Submit to App Store / Play Store

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@clipboardvault.app or join our Discord community.

---

Made with ❤️ using Expo and React Native