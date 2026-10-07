const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block Android and iOS build artifacts from triggering file watcher errors
config.resolver.blockList = [
  /.*\/android\/.*/,
  /.*\/ios\/.*/,
];

module.exports = config;
