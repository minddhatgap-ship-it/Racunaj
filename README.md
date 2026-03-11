# Računovodstvo - Accounting & Invoicing App

Professional Slovenian accounting and invoicing application for independent entrepreneurs (s.p.) and small businesses.

## 🚀 Features

- ✅ **Invoice Creation** - Physical person & legal entity support
- 📊 **Business Overview** - Analytics and reports
- 💰 **Payment Methods** - Cash, card (SumUp), bank transfer
- 🏛️ **FURS Integration** - Tax verification, ZOI/EOR, eDavki XML export
- 🖨️ **Bluetooth Printing** - POS thermal printer support (58mm)
- 📄 **PDF Export** - Professional invoice PDFs
- ⚙️ **Settings** - Company info, tax method, test mode
- 🔄 **Invoice Management** - List, view, correct, cancel

## 🏁 Quick Start

```bash
# Install dependencies
npm install
npm install react-native-bluetooth-escpos-printer

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

## 📖 Documentation

- **[SETUP.md](./SETUP.md)** - Installation and setup instructions
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - Complete build guide for all platforms
- **[README_BLUETOOTH.md](./README_BLUETOOTH.md)** - Bluetooth printer setup
- **[.github/README_WORKFLOWS.md](./.github/README_WORKFLOWS.md)** - CI/CD workflows

## 🔧 Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **TypeScript** - Type-safe development
- **Expo Router** - File-based routing
- **Context API** - State management
- **AsyncStorage** - Local persistence

## 📱 Requirements

- **Node.js**: 18+
- **Android**: API 23+ (Android 6.0+)
- **iOS**: 15.1+

## 🛠️ Development

```bash
# Start Metro bundler
npm start

# Run on Android device/emulator
npx expo run:android

# Run on iOS device/simulator
npx expo run:ios

# Clear cache and restart
npx expo start --clear
```

## 🏗️ Build

### Development Build

```bash
npx expo prebuild --clean
npx expo run:android
```

### Production Build (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

### Local Release Build

```bash
# Android APK
cd android
./gradlew assembleRelease

# Android AAB (for Play Store)
./gradlew bundleRelease
```

## 📦 Native Modules

This app uses native modules that require a development build:

- `react-native-bluetooth-escpos-printer` - Bluetooth POS printing

**Note:** Cannot use Expo Go - must build locally or with EAS.

## 🧪 Testing

```bash
# Run on physical device (for Bluetooth testing)
npx expo run:android

# Enable test mode in app
Settings → Testni način → ON
```

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for Slovenian businesses
