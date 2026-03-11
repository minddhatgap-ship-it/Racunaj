# Complete Build Guide

## 🎯 Quick Start

### For Development (Local Testing)

```bash
# 1. Install all dependencies
npm install
npm install react-native-bluetooth-escpos-printer

# 2. Generate native projects
npx expo prebuild --clean

# 3. Run on Android
npx expo run:android

# 4. Run on iOS (Mac only)
npx expo run:ios
```

### For Production (Release Build)

```bash
# Using EAS Build (Recommended)
eas build --platform android --profile production

# Using Local Build
cd android && ./gradlew assembleRelease
```

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Expo CLI**: Latest version
- **EAS CLI**: Latest version (for cloud builds)

### For Android Development

- **Android Studio**: Latest version
- **Android SDK**: API 23-34
- **Java JDK**: 17

### For iOS Development (Mac only)

- **Xcode**: 15.0 or higher
- **CocoaPods**: Latest version
- **iOS SDK**: 15.1 or higher

## 🔧 Detailed Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo>
cd <your-project>

# Install dependencies
npm install

# Install native module explicitly
npm install react-native-bluetooth-escpos-printer
```

### Step 2: Configure Environment

Create `.env` file (optional):

```env
# Add any environment variables here
# FURS_API_URL=https://your-furs-api.com
# SUMUP_API_KEY=your-sumup-key
```

### Step 3: Prebuild Native Projects

```bash
# This generates android/ and ios/ folders with native code
npx expo prebuild --clean
```

**What this does:**
- Generates `android/` folder with Android Studio project
- Generates `ios/` folder with Xcode project
- Links all native modules
- Configures permissions from app.json

### Step 4: Run Development Build

#### Android

```bash
# Option 1: Using Expo CLI (recommended)
npx expo run:android

# Option 2: Using Android Studio
# Open android/ folder in Android Studio
# Click "Run" button

# Option 3: Using Gradle directly
cd android
./gradlew installDebug
```

#### iOS

```bash
# Option 1: Using Expo CLI (recommended)
npx expo run:ios

# Option 2: Using Xcode
# Open ios/YourApp.xcworkspace in Xcode
# Click "Run" button

# Option 3: Using xcodebuild
cd ios
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Debug
```

## 📦 Building for Production

### Method 1: EAS Build (Cloud - Recommended)

#### Initial Setup

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (first time only)
eas build:configure
```

#### Build Android APK

```bash
# Production build
eas build --platform android --profile production

# Preview build (for testing)
eas build --platform android --profile preview

# Development build
eas build --platform android --profile development
```

#### Build iOS

```bash
# Production build
eas build --platform ios --profile production

# Preview build
eas build --platform ios --profile preview
```

#### Download Built Files

```bash
# Option 1: From EAS dashboard
# Go to: https://expo.dev/accounts/[account]/projects/[project]/builds

# Option 2: Using CLI
eas build:list
```

### Method 2: Local Build

#### Android Release Build

```bash
# 1. Generate release keystore (first time only)
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias release-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 2. Configure gradle.properties
echo "MYAPP_RELEASE_STORE_FILE=release.keystore" >> android/gradle.properties
echo "MYAPP_RELEASE_KEY_ALIAS=release-key" >> android/gradle.properties
echo "MYAPP_RELEASE_STORE_PASSWORD=your-password" >> android/gradle.properties
echo "MYAPP_RELEASE_KEY_PASSWORD=your-password" >> android/gradle.properties

# 3. Build APK
cd android
./gradlew assembleRelease

# 4. Build AAB (for Play Store)
./gradlew bundleRelease

# Output locations:
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

#### iOS Release Build

```bash
# 1. Open project in Xcode
cd ios
open YourApp.xcworkspace

# 2. In Xcode:
# - Select "Any iOS Device" as target
# - Product → Archive
# - Distribute App → App Store Connect

# Or using command line:
xcodebuild -workspace YourApp.xcworkspace \
  -scheme YourApp \
  -configuration Release \
  -archivePath build/YourApp.xcarchive \
  archive
```

## 🤖 GitHub Actions (CI/CD)

### Setup Secrets

Go to: `GitHub Repo → Settings → Secrets and variables → Actions`

Add these secrets:

1. **EXPO_TOKEN** (Required for EAS builds)
   - Get from: https://expo.dev/accounts/[username]/settings/access-tokens
   
2. **ANDROID_KEYSTORE** (Optional, for signed builds)
   - Base64 encoded keystore file
   ```bash
   base64 android/app/release.keystore > keystore.base64
   ```

3. **ANDROID_KEY_ALIAS** (Optional)
   - Your keystore alias (e.g., "release-key")

4. **ANDROID_KEYSTORE_PASSWORD** (Optional)
   - Keystore password

5. **ANDROID_KEY_PASSWORD** (Optional)
   - Key password

### Trigger Build

```bash
# Automatic: Push to main branch
git push origin main

# Manual: GitHub UI
# Actions → [Workflow] → Run workflow

# Using GitHub CLI
gh workflow run android-build.yml
```

## 🐛 Common Issues and Solutions

### Issue: "react-native-bluetooth-escpos-printer not found"

```bash
# Solution:
npm install react-native-bluetooth-escpos-printer
npx expo prebuild --clean
npx expo run:android
```

### Issue: "Metro bundler cannot find module"

```bash
# Solution:
rm -rf node_modules
rm -rf .expo
rm -rf android/build
rm -rf ios/build
npm install
npx expo start --clear
```

### Issue: "Android build fails: duplicate resources"

```bash
# Solution:
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
npx expo run:android
```

### Issue: "iOS build fails: pod install error"

```bash
# Solution:
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
npx expo run:ios
```

### Issue: "Expo Go shows 'Native module not found'"

**This is expected!** 

Bluetooth printing requires native modules that cannot run in Expo Go.

**Solution:** Build a development build:
```bash
npx expo run:android
# or
eas build --profile development
```

### Issue: "GitHub Actions fails: npm ci error"

**Fixed!** Workflows now use `npm install` instead of `npm ci`.

If you still have issues:
```bash
# Push updated workflows
git add .github/workflows/
git commit -m "Update workflows"
git push
```

## 📱 Testing

### Test on Physical Device

```bash
# 1. Build development version
npx expo run:android

# 2. App auto-installs on connected device

# 3. Test Bluetooth:
# - Settings → Bluetooth tiskalnik
# - Poišči tiskalnike
# - Connect and test print
```

### Test on Emulator (Limited)

```bash
# Start emulator
emulator -avd Pixel_6_API_34

# Run app
npx expo run:android

# Note: Bluetooth won't work on emulator
```

## 🚀 Deployment

### Google Play Store

1. **Build AAB**
   ```bash
   eas build --platform android --profile production
   ```

2. **Download AAB** from EAS dashboard

3. **Upload to Play Console**
   - https://play.google.com/console
   - Create app → Upload AAB
   - Fill in store listing
   - Submit for review

### Apple App Store

1. **Build IPA**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit via EAS**
   ```bash
   eas submit --platform ios
   ```

3. **Or upload manually**
   - Download IPA from EAS
   - Upload to App Store Connect
   - https://appstoreconnect.apple.com

## 📊 Build Output Locations

### Development Builds

- Android: Auto-installed on device
- iOS: Auto-installed on device/simulator

### Local Release Builds

- Android APK: `android/app/build/outputs/apk/release/app-release.apk`
- Android AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- iOS IPA: `ios/build/YourApp.ipa`

### EAS Builds

- Dashboard: https://expo.dev/accounts/[account]/projects/[project]/builds
- CLI: `eas build:list`

## ✅ Pre-deployment Checklist

- [ ] Test all features on physical device
- [ ] Test Bluetooth printer connection
- [ ] Verify FURS integration (test mode)
- [ ] Check all screens for layout issues
- [ ] Test on different Android versions
- [ ] Test on different screen sizes
- [ ] Verify app icons and splash screen
- [ ] Update version number in app.json
- [ ] Create release notes
- [ ] Generate signed build
- [ ] Test signed build on device

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native](https://reactnative.dev/)
- [Android Publishing Guide](https://developer.android.com/studio/publish)
- [iOS Publishing Guide](https://developer.apple.com/app-store/submissions/)
