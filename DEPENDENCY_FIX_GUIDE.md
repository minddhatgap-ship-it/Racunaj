# Dependency Fix Guide for RN 0.79.3 + Expo SDK 53 Build Error

## Problem Summary
Build failed with Codegen error: `Unknown prop type for "environment": "undefined"` in react-native-screens

## Root Causes

1. **react-native-screens 4.18.2** is incompatible with React Native 0.79 New Architecture
   - Codegen TypeScript parser fails on outdated prop definitions
   - Needs version 4.23.0+ for Fabric compatibility

2. **Workflow was forcing non-existent SDK 55 versions**
   - Expo SDK 55 doesn't exist yet
   - Current SDK is 53 for RN 0.79.x

3. **Version misalignment** across multiple native packages

## Required Fixes

### 1. Update react-native-screens (CRITICAL)
```bash
# Locally, run:
npx expo install react-native-screens@latest
```

**Why**: RN 0.79 with New Architecture (Fabric) requires react-native-screens 4.23.0+
- Versions < 4.23.0 have TypeScript definitions incompatible with Fabric Codegen
- The "undefined prop type" error is a signature issue of outdated Fabric component specs

### 2. Verify All Expo SDK 53 Versions
```bash
npx expo install --check --fix
```

**Expected versions for Expo SDK 53:**
```json
{
  "expo": "~53.0.9",
  "react-native": "0.79.3",
  "react-native-screens": "~4.23.0",
  "react-native-gesture-handler": "~2.24.0",
  "react-native-reanimated": "~3.17.5",
  "react-native-safe-area-context": "~5.4.0",
  "expo-router": "~5.0.7",
  "expo-web-browser": "~14.1.6",
  "expo-splash-screen": "~0.30.8",
  "expo-status-bar": "~2.2.3"
}
```

### 3. Clear All Build Caches
```bash
# Clean npm
npm cache clean --force

# Clean Expo
rm -rf .expo/
rm -rf node_modules/
npm install

# Clean Android
cd android && ./gradlew clean
cd ..

# Clean Metro bundler
npx expo start --clear
```

### 4. Rebuild Native Project
```bash
# Regenerate native Android project with correct versions
npx expo prebuild --platform android --clean

# Build APK
cd android
./gradlew assembleDebug --no-daemon --stacktrace
```

## Android Gradle Configuration

### android/build.gradle (root)
```gradle
buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 24
        compileSdkVersion = 35
        targetSdkVersion = 35
        kotlinVersion = "2.0.21"
        ndkVersion = "27.1.12297006"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.8.2")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}
```

### android/app/build.gradle
```gradle
android {
    compileSdk 35
    buildToolsVersion "35.0.0"
    ndkVersion rootProject.ext.ndkVersion

    defaultConfig {
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
    }
}
```

## Verification Checklist

- [ ] react-native-screens >= 4.23.0
- [ ] All expo/* packages use ~SDK_VERSION.x.x format
- [ ] react-native-reanimated ~3.17.5
- [ ] Kotlin 2.0.21
- [ ] Gradle 8.13
- [ ] Android Gradle Plugin 8.8.2
- [ ] compileSdk 35
- [ ] NDK 27.1.12297006
- [ ] newArchEnabled: true in app.json

## Common Errors & Solutions

### Error: "Unknown prop type for X: undefined"
**Solution**: Update the affected package to New Architecture compatible version
- Usually react-native-screens, react-native-gesture-handler, or react-native-reanimated

### Error: "Task :react-native-screens:generateCodegenSchemaFromJavaScript FAILED"
**Solution**: Version mismatch between RN and react-native-screens
```bash
npx expo install react-native-screens@latest
```

### Error: "Could not resolve all files for configuration"
**Solution**: Gradle cache corruption
```bash
cd android
./gradlew clean --no-daemon
rm -rf ~/.gradle/caches/
```

### Error: "duplicate class kotlin.*"
**Solution**: Kotlin version mismatch
- Ensure kotlinVersion = "2.0.21" in android/build.gradle
- Check all kotlin dependencies use same version

## GitHub Actions Changes Made

### Before (INCORRECT):
- Forced SDK 55 versions (doesn't exist)
- Used react-native-screens ~4.0.0 (way too old)
- No cache cleaning before build

### After (CORRECT):
- Uses correct SDK 53 versions
- Sets react-native-screens ~4.23.0
- Cleans npm cache before install
- Removes android/ directory before prebuild
- Ensures fresh native project generation

## Next Steps

1. **Push this fix** - The workflow will auto-fix versions on next build
2. **Locally test** - Run the verification steps above
3. **Monitor build** - Check GitHub Actions output for version confirmation
4. **If still failing** - Check Gradle reports in build artifacts

## Reference Links

- [Expo SDK 53 Release Notes](https://expo.dev/changelog/2024/sdk-53)
- [React Native 0.79 New Architecture](https://reactnative.dev/docs/next/new-architecture-intro)
- [react-native-screens Compatibility](https://github.com/software-mansion/react-native-screens)
