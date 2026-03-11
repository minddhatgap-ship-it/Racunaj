const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Podpora za react-native-bluetooth-escpos-printer
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
