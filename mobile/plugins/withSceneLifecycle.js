/**
 * iOS 27 refuses to launch apps that don't adopt the UIScene life cycle
 * (Apple TN3187). Expo SDK 57 ships `ExpoAppSceneDelegate` for this, but the
 * prebuild template doesn't wire it up yet, so this plugin does:
 *   - Info.plist: a scene manifest pointing at EXExpoAppSceneDelegate
 *   - AppDelegate.swift: conform to ExpoReactNativeFactoryProvider and stop
 *     creating the window, which the scene delegate now owns
 * Drop this once `expo prebuild` generates the scene setup itself.
 */
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const WINDOW_SETUP = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'Default Configuration',
          UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
        }],
      },
    };
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') throw new Error('withSceneLifecycle: expected a Swift AppDelegate');
    let src = cfg.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    }
    src = src.replace(WINDOW_SETUP, '\n    // ExpoAppSceneDelegate creates the window and starts React Native when the scene connects.\n');
    if (!src.includes('ExpoReactNativeFactoryProvider') || src.includes('UIScreen.main.bounds')) {
      throw new Error('withSceneLifecycle: AppDelegate.swift did not match the expected template');
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};
