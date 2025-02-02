const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const watchFolders = [
  path.resolve(__dirname + '/..'),
  path.resolve(__dirname + '/'),
];

const config = {
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '..', 'node_modules'),
    ],
    // Provide extraNodeModules to handle symlinks in Node.js module resolution
    extraNodeModules: new Proxy(
      {},
      {
        get: (_, name) => path.resolve(__dirname, 'node_modules', name),
      },
    ),
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        // Ensures modules load correctly by optimizing requires
        inlineRequires: true,
      },
    }),
  },

  // Ensure Metro watches both the current directory and parent folder
  watchFolders,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
