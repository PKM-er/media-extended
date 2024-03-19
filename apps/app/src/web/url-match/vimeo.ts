import { parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl } from "@/lib/url";
import { MediaHost } from "../../info/supported";
import {
  removeHashTempFragment,
  type URLDetecter,
  type URLResolver,
} from "./base";

export const vimeoDetecter: URLDetecter = (url) => {
  if (url.hostname !== "vimeo.com") return null;
  const vid = url.pathname.substring(1);
  if (!vid.match(/^\d+$/)) return null;
  return MediaHost.Vimeo;
};

export const vimeoResolver: URLResolver = (url) => {
  const vid = url.pathname.substring(1);
  if (!vid.match(/^\d+$/)) throw new Error("Invalid vimeo url");

  const cleaned = noHashUrl(url);
  cleaned.search = "";

  const source = new URL(url);

  return {
    cleaned,
    source: removeHashTempFragment(source),
    tempFrag: parseTempFrag(url.hash),
    id: vid,
  };
};
