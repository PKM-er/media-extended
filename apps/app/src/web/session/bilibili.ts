export async function modifyBilibiliSession(session: Electron.Session) {
  // default to 1080p resolution
  // https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/videostream_url.md#qn%E8%A7%86%E9%A2%91%E6%B8%85%E6%99%B0%E5%BA%A6%E6%A0%87%E8%AF%86
  await session.cookies.set({
    url: "https://www.bilibili.com",
    domain: ".bilibili.com",
    path: "/",
    name: "CURRENT_QUALITY",
    value: "80",
    expirationDate: Date.now() + 1e3 * 60 * 60 * 24 * 365,
  });
}
