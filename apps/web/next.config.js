/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@packages/ui", "@packages/api", "@packages/utils", "@packages/types", "@expo/vector-icons", "expo-modules-core", "expo-font", "expo-asset", "expo-constants", "react-native-vector-icons"],

    webpack: (config) => {
        config.module.rules.push({
            test: /\.ttf$/,
            type: "asset/resource",
        });

        return config;
    },
};

module.exports = nextConfig;
