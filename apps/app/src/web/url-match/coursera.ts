import { noHashUrl } from "@/lib/url";
import type { URLResolver } from "./base";
import { SupportedMediaHost } from "./supported";

export const courseraResolver: URLResolver = (url) => {
  if (url.hostname !== "www.coursera.org") return null;
  const cleaned = noHashUrl(url);
  cleaned.search = "";

  const source = new URL(url);
  // const tempFrag = parseTempFrag(source.hash);
  // addTempFrag(source, tempFrag);

  return {
    type: SupportedMediaHost.Coursera,
    cleaned,
    source,
  };
};
