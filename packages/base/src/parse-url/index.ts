import "js-video-url-parser/lib/provider/youtube";

import urlParser from "js-video-url-parser/lib/base";

import { HostProviders, Provider } from "../media-provider";
import { getMediaType } from "../media-type";
import { stripHash } from "../misc";
import { parseBilibiliURL } from "./bilibili";

type ParsedResult = {
  provider: HostProviders;
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
    info = { provider: Provider.youtube, id: parsed.id, url, hash };
  } else {
    const parsed = parseBilibiliURL(_url);
    if (parsed) {
      info = { provider: Provider.bilibili, id: parsed.id, url, hash };
    }
  }
  return info;
};
export default parseURL;

export const vaildateMediaURL = async (
  url: string,
  onVaild?: (
    url: string,
    hash: string,
  ) => boolean | Promise<boolean> | void | Promise<void>,
): Promise<boolean> => {
  let result, args: [url: string, hash: string];
  if (getMediaType(url)) {
    args = stripHash(url);
  } else if ((result = parseURL(url))) {
    args = [result.url, result.hash];
  } else return false;

  if (onVaild) {
    const result = await onVaild(...args);
    if (typeof result === "boolean") return result;
  }
  return true;
};
