const { withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNativeBuildFixes(config) {
  // 1. AndroidManifest Fix (appComponentFactory conflict)
  config = withAndroidManifest(config, (config) => {
    const mainManifest = config.modResults.manifest;
    const application = mainManifest.application[0];

    // Ensure tools namespace exists
    mainManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // Add tools:replace="android:appComponentFactory" and provide a value
    application.$['tools:replace'] = 'android:appComponentFactory';
    application.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

    return config;
  });

  // 2. build.gradle Fix
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Suppression for C++ deprecation warnings treated as errors in RN 0.81+
    const suppressFlags = `
        externalNativeBuild {
            cmake {
                cppFlags "-Wno-error=deprecated-declarations"
            }
        }
    `;

    // Only add if it doesn't already exist to avoid duplication
    if (!buildGradle.includes('Wno-error=deprecated-declarations')) {
        const match = buildGradle.match(/defaultConfig\s*\{/);
        if (match) {
            const index = match.index + match[0].length;
            buildGradle = buildGradle.slice(0, index) + suppressFlags + buildGradle.slice(index);
        } else {
            buildGradle = buildGradle.replace(/android\s*\{/, `android {${suppressFlags}`);
        }
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};
