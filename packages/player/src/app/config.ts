export const config = {
  urls: {
    youtube: {
      iframe_api: "//www.youtube.com/iframe_api",
      meta_api:
        "https://noembed.com/embed?url=https://www.youtube.com/watch?v=",
    },
  },
  youtube: {
    timeupdate_freq: 50,
    progress_freq: 200,
  },
  origin: "https://localhost:3000",
  language: "en", // window.localStorage.getItem('language') ?? "en";
};
