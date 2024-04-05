import { XHRIntercepter } from "@/lib/remote-player/lib/xhr-hijack";
import { storeId } from "./store-id";

const patterns = [
  { hostname: "api.bilibili.com", pathname: "/x/player/v2" },
  { hostname: "api.bilibili.com", pathname: "/x/player/wbi/v2" },
].map((p) => new URLPattern(p));

const intercepter = new XHRIntercepter((url) =>
  patterns.some((p) => p.test(url)),
);
intercepter.load();
(window as any)[storeId] = intercepter;

const enum Codec {
  default = 0,
  hevc = 1,
  avc = 2,
  av1 = 3,
}

localStorage.setItem("recommend_auto_play", "close");
// disable autoplay
localStorage.setItem(
  "bpx_player_profile",
  JSON.stringify({ media: { autoplay: false } }),
);
// default to hevc
localStorage.setItem(
  "bilibili_player_codec_prefer_type",
  JSON.stringify(Codec.hevc),
);

console.log("intercepter loaded");
