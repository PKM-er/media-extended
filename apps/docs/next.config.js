const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

/**
 * @type {import('next').NextConfig}
 */
const config = {
  i18n: {
    locales: ["en-US", "zh-CN"],
    defaultLocale: "zh-CN",
    localeDetection: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  }
}

module.exports = withNextra(config);
