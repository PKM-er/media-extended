const config = {
  urls: {
    youtube: {
      iframe_api: "//www.youtube.com/iframe_api",
      meta_api:
        "https://noembed.com/embed?url=https://www.youtube.com/watch?v=",
    },
  },
  youtube: {
    timeupdate_freq: 100,
    progress_freq: 200,
  },
  origin: "app://obsidian.md/index.html",
  language: window.localStorage.getItem("language") ?? "en",
};
export default config;
