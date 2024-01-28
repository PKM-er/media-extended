/* eslint-disable @typescript-eslint/naming-convention */
import { requestUrl } from "obsidian";
import { getUserAgent } from "@/lib/remote-player/ua";

// interface TokenCache {
//   token: string;
//   expire: number;
// }

// 10 minutes
// const expireTime = 10 * 60 * 1000;
// const tokenKey = "mx-youtube-token";

function getParamFromHtml(html: string, key: string): string | null {
  const regex = new RegExp(`"${key}":\\s*"(?<value>[^"]+)"`);
  const match = html.match(regex)?.groups?.value;
  if (!match) return null;
  const value = JSON.parse(`"${match}"`);
  return value;
}

export interface YoutubeToken {
  apiKey: string;
  serializedShareEntity: string;
  visitorData: string;
  sessionId: string;
  clickTrackingParams: string;
}

// derive from https://github.com/lstrzepek/obsidian-yt-transcript
export async function getYoutubeToken(url: string): Promise<YoutubeToken> {
  const html = await requestUrl({ url, headers: getYoutubeHeader() }).then(
    (res) => res.text,
  );
  const apiKey = getParamFromHtml(html, "INNERTUBE_API_KEY"),
    serializedShareEntity = getParamFromHtml(html, "serializedShareEntity"),
    visitorData = getParamFromHtml(html, "VISITOR_DATA"),
    sessionId = getParamFromHtml(html, "sessionId"),
    clickTrackingParams = getParamFromHtml(html, "clickTrackingParams");

  if (
    !apiKey ||
    !serializedShareEntity ||
    !visitorData ||
    // !sessionId ||
    !clickTrackingParams
  ) {
    throw new Error("Failed to get youtube token");
  }

  return {
    apiKey,
    serializedShareEntity,
    visitorData,
    sessionId: sessionId ?? "",
    // youtu.be links have extra characters in clickTrackingParams
    // that are not supported with the youtubei api
    clickTrackingParams: decodeURI(clickTrackingParams.slice(0, 28)),
  };
}

export function generateNonce() {
  const rnd = Math.random().toString();
  const alphabet =
    "ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghjijklmnopqrstuvwxyz0123456789";
  const jda = [
    alphabet + "+/=",
    alphabet + "+/",
    alphabet + "-_=",
    alphabet + "-_.",
    alphabet + "-_",
  ];
  const b = jda[3];
  const a = [];
  for (let i = 0; i < rnd.length - 1; i++) {
    a.push(rnd[i].charCodeAt(i));
  }
  let c = "";
  let d = 0;
  let m, n, q, r, f, g;
  while (d < a.length) {
    f = a[d];
    g = d + 1 < a.length;

    if (g) {
      m = a[d + 1];
    } else {
      m = 0;
    }
    n = d + 2 < a.length;
    if (n) {
      q = a[d + 2];
    } else {
      q = 0;
    }
    r = f >> 2;
    f = ((f & 3) << 4) | (m >> 4);
    m = ((m & 15) << 2) | (q >> 6);
    q &= 63;
    if (!n) {
      q = 64;
      if (!q) {
        m = 64;
      }
    }
    c += b[r] + b[f] + b[m] + b[q];
    d += 3;
  }
  return c;
}

// function read(): string | null {
//   try {
//     const value = localStorage.getItem(tokenKey);
//     if (!value) return null;
//     const { token, expire } = JSON.parse(value ?? "") as TokenCache;
//     if (typeof token !== "string" || expire < Date.now()) return null;
//     return token;
//   } catch {
//     return null;
//   }
// }

// function cache(token: string) {
//   const value = JSON.stringify({
//     token,
//     expire: Date.now() + expireTime,
//   });
//   localStorage.setItem(tokenKey, value);
// }

export function getYoutubeHeader() {
  return {
    Origin: "https://www.youtube.com",
    Referer: "https://www.youtube.com/",
    "User-Agent": getUserAgent(navigator.userAgent),
  } satisfies HeadersInit;
}
