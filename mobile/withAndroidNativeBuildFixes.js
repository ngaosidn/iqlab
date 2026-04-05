const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withNativeBuildFixes(config) {
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
        // Insert it into the defaultConfig block
        // A simple way is to find the defaultConfig block and insert it
        const match = buildGradle.match(/defaultConfig\s*\{/);
        if (match) {
            const index = match.index + match[0].length;
            buildGradle = buildGradle.slice(0, index) + suppressFlags + buildGradle.slice(index);
        } else {
            // Fallback: append to android block
            buildGradle = buildGradle.replace(/android\s*\{/, `android {${suppressFlags}`);
        }
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};
