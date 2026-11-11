const config = {
  root: 'C:\\Remote-job',
  reactNativePath: 'C:\\Remote-job\\node_modules\\react-native',
  dependencies: {
    '@react-native-async-storage/async-storage': {
      root: 'C:\\Remote-job\\node_modules\\@react-native-async-storage\\async-storage',
      name: '@react-native-async-storage/async-storage',
      platforms: {
        android: {
          sourceDir:
            'C:\\Remote-job\\node_modules\\@react-native-async-storage\\async-storage\\android',
          packageImportPath:
            'import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;',
          packageInstance: 'new AsyncStoragePackage()',
          buildTypes: [],
          libraryName: 'rnasyncstorage',
          componentDescriptors: [],
          cmakeListsPath:
            'C:/Remote-job/node_modules/@react-native-async-storage/async-storage/android/build/generated/source/codegen/jni/CMakeLists.txt',
          cxxModuleCMakeListsModuleName: null,
          cxxModuleCMakeListsPath: null,
          cxxModuleHeaderName: null,
        },
      },
    },
    'react-native-google-mobile-ads': {
      root: 'C:\\Remote-job\\node_modules\\react-native-google-mobile-ads',
      name: 'react-native-google-mobile-ads',
      platforms: {
        android: {
          sourceDir:
            'C:\\Remote-job\\node_modules\\react-native-google-mobile-ads\\android',
          packageImportPath:
            'import io.invertase.googlemobileads.ReactNativeGoogleMobileAdsPackage;',
          packageInstance: 'new ReactNativeGoogleMobileAdsPackage()',
          buildTypes: [],
          libraryName: 'RNGoogleMobileAdsSpec',
          componentDescriptors: ['RNGoogleMobileAdsBannerViewComponentDescriptor'],
          cmakeListsPath:
            'C:/Remote-job/node_modules/react-native-google-mobile-ads/android/build/generated/source/codegen/jni/CMakeLists.txt',
          cxxModuleCMakeListsModuleName: null,
          cxxModuleCMakeListsPath: null,
          cxxModuleHeaderName: null,
        },
      },
    },
    'react-native-safe-area-context': {
      root: 'C:\\Remote-job\\node_modules\\react-native-safe-area-context',
      name: 'react-native-safe-area-context',
      platforms: {
        android: {
          sourceDir:
            'C:\\Remote-job\\node_modules\\react-native-safe-area-context\\android',
          packageImportPath:
            'import com.th3rdwave.safeareacontext.SafeAreaContextPackage;',
          packageInstance: 'new SafeAreaContextPackage()',
          buildTypes: [],
          libraryName: 'safeareacontext',
          componentDescriptors: [
            'RNCSafeAreaProviderComponentDescriptor',
            'RNCSafeAreaViewComponentDescriptor',
          ],
          cmakeListsPath:
            'C:/Remote-job/node_modules/react-native-safe-area-context/android/src/main/jni/CMakeLists.txt',
          cxxModuleCMakeListsModuleName: null,
          cxxModuleCMakeListsPath: null,
          cxxModuleHeaderName: null,
        },
      },
    },
  },
  project: {
    android: {
      packageName: 'com.xapzap.app',
      sourceDir: 'C:\\Remote-job\\android',
    },
  },
};

process.stdout.write(JSON.stringify(config));
