// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ משאיר את מה שהיה לך
config.resolver.unstable_enablePackageExports = false;

// ✅ מוסיף cjs + mjs בצורה בטוחה
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), 'cjs', 'mjs'])
);

module.exports = config;
