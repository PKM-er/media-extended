import { noHashUrl } from "@/lib/url";
import type { URLResolver } from "./base";
import { SupportedMediaHost } from "./supported";

export const viemoResolver: URLResolver = (url) => {
  if (url.hostname !== "vimeo.com") return null;
  const vid = url.pathname.substring(1);
  if (!vid.match(/^\d+$/)) return null;

  const cleaned = noHashUrl(url);
  cleaned.search = "";

  const source = new URL(url);
  // const tempFrag = parseTempFrag(source.hash);
  // addTempFrag(source, tempFrag);

  return {
    type: SupportedMediaHost.Vimeo,
    cleaned,
    source,
    id: vid,
  };
};
