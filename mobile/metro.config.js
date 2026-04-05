const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Allow custom font file extensions
  config.resolver.assetExts.push('woff2');

  return config;
})();
