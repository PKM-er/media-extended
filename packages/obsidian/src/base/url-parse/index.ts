import "js-video-url-parser/lib/provider/youtube";

import { Providers } from "@slice/provider-types";
import urlParser from "js-video-url-parser/lib/base";

import { parseBilibiliURL } from "./bilibili";

type ParsedResult = { provider: Providers; id: string };

const parseURL = (url: string): ParsedResult | null => {
  let info: ParsedResult | null = null;
  const parsed = urlParser.parse(url);
  if (parsed?.provider === "youtube") {
    info = {
      provider: "youtube",
      id: parsed.id,
    };
  } else {
    const parsed = parseBilibiliURL(url);
    if (parsed) {
      info = {
        provider: "bilibili",
        id: parsed.id,
      };
    }
  }
  return info;
};
export default parseURL;
