const { locales } = require("./locales.js");

const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

/**
 * @type {import('next').NextConfig}
 */
const config = {
  i18n: {
    locales,
    defaultLocale: "en",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  }
}

module.exports = withNextra(config);
