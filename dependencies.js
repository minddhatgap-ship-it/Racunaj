/**
 * Dependency Reference File
 * 
 * This file explicitly imports all required native modules to ensure
 * they are detected by the OnSpace auto-install system (npx depcheck).
 * 
 * DO NOT DELETE - Required for dependency detection
 */

// Native modules that need to be installed
// These are imported here to ensure depcheck detects them

// Bluetooth POS Printer - Required for native builds
// Install: npm install react-native-bluetooth-escpos-printer
try {
  require('react-native-bluetooth-escpos-printer');
} catch (e) {
  console.log('Bluetooth printer package will be auto-installed on first build');
}

// Note: This file is not used in the app runtime, 
// it only exists for dependency detection
