const siteUrl = process.env.SITE_URL || 'https://mx.pkmer.net'
const { locales } = require('./locales.js')
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  transform: async (config, path) => {
    if (!path.endsWith('.en') || locales.some(locale => path.startsWith(`/${locale}/`))) {
      return null;
    }
    path = path.slice(0, -3)
    if (path.endsWith("/index")) {
      path = path.slice(0, -6)
    }
    return {
      loc: path,
      alternateRefs: locales.map(locale => ({
        href: `${siteUrl.replace(/\/+$/, '')}/${locale}`,
        hreflang: locale
      }))
    }
  },
  additionalPaths: () => ([{
    loc: '/',
    alternateRefs: locales.map(locale => ({
      href: `${siteUrl.replace(/\/+$/, '')}/${locale}`,
      hreflang: locale
    }))
  }])
}