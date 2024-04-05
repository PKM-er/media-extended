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

console.log("intercepter loaded");
