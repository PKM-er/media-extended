import "js-video-url-parser/lib/provider/youtube";

import { stripHash } from "@misc";
import { Providers } from "@slice/provider-types";
import urlParser from "js-video-url-parser/lib/base";

import { parseBilibiliURL } from "./bilibili";

type ParsedResult = {
  provider: Providers;
  id: string;
  /** hash stripped */
  url: string;
  hash: string;
};

const parseURL = (_url: string): ParsedResult | null => {
  let info: ParsedResult | null = null;
  const parsed = urlParser.parse(_url);
  const [url, hash] = stripHash(_url);
  if (parsed?.provider === "youtube") {
    info = { provider: "youtube", id: parsed.id, url, hash };
  } else {
    const parsed = parseBilibiliURL(_url);
    if (parsed) {
      info = { provider: "bilibili", id: parsed.id, url, hash };
    }
  }
  return info;
};
export default parseURL;
