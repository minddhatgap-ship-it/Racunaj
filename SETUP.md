# Setup and Build Instructions

## 📦 Required Dependencies

This app requires the following key dependencies:

### Core Dependencies (Auto-installed by OnSpace)
- `expo` - Expo SDK
- `expo-router` - File-based routing
- `react-native` - React Native framework
- `react-native-safe-area-context` - Safe area handling
- `expo-image` - Optimized image component
- `@expo/vector-icons` - Icon library

### Native Modules (Required for Bluetooth printing)
- `react-native-bluetooth-escpos-printer` - For POS printer connectivity

## 🔧 Build Process

### Development Build (with Bluetooth support)

```bash
# 1. Clean install
npm install

# 2. Install native module
npm install react-native-bluetooth-escpos-printer

# 3. Prebuild native projects
npx expo prebuild --clean

# 4. Run on Android
npx expo run:android

# 5. Run on iOS
npx expo run:ios
```

### Production Build

#### Option A: EAS Build (Recommended)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build Android
eas build --platform android --profile production

# 4. Build iOS
eas build --platform ios --profile production
```

#### Option B: Local Build

```bash
# Android
cd android
./gradlew assembleRelease

# iOS
cd ios
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release
```

## ⚠️ Important Notes

### Native Module Requirements

1. **Bluetooth Printer** requires native modules - web preview won't work
2. **Must rebuild** after any native module changes
3. **Cannot use Expo Go** - requires development build or EAS build

### Platform Requirements

- **Android**: API 23+ (Android 6.0+)
- **iOS**: iOS 15.1+
- **Node.js**: 18+ recommended

## 🐛 Troubleshooting

### "react-native-bluetooth-escpos-printer not found"

```bash
# Fix:
npm install react-native-bluetooth-escpos-printer
npx expo prebuild --clean
npx expo run:android
```

### "Metro bundler errors"

```bash
# Fix:
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

### "Build fails on GitHub Actions"

Make sure you have:
1. `EXPO_TOKEN` secret configured
2. Updated workflows to use `npm install` (not `npm ci`)
3. EAS Build configured in `eas.json`

## 📱 Testing

### Test without Bluetooth (Web/Expo Go)

The app will show error messages for Bluetooth features but other functionality works.

### Test with Bluetooth (Real device)

1. Build development version: `npx expo run:android`
2. Install on physical device
3. Enable Bluetooth permissions
4. Test printer connection in Settings

## 🚀 Deployment

### Google Play Store

1. Build AAB: `eas build --platform android --profile production`
2. Download from EAS dashboard
3. Upload to Google Play Console

### Apple App Store

1. Build IPA: `eas build --platform ios --profile production`
2. Submit via EAS: `eas submit --platform ios`
3. Or upload manually to App Store Connect
