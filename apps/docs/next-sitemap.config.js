const siteUrl = process.env.SITE_URL || 'https://mx.pkmer.net'
const { locales } = require('./locales.js')
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  transform: async (config, path) => {
    if (!path.endsWith('.en')) {
      return null;
    }
    return {
      loc: path.slice(0, -3),
      alternateRefs: locales.map(locale => ({
        href: `${siteUrl.replace(/\/+$/, '')}/${locale}`,
        hreflang: locale
      }))
    }
  }
}