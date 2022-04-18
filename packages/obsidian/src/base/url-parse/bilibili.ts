import { parse as parseQS, ParsedQuery } from "query-string";
import Url from "url-parse";

const hostnames = ["www.bilibili.com", "bilibili.com"];

export const parseBilibiliURL = (url: string) => {
  const { query: q, pathname, hostname } = Url(url, parseQS);
  if (!hostnames.includes(hostname)) return null;
  let paths = pathname.split("/");
  if (!(paths.length === 3 && paths[1] === "video")) return;
  const query = q as unknown as ParsedQuery<string | boolean | number>;

  return {
    id: paths[2],
    page:
      query.p && Number.isInteger(+query.p) && +query.p > 0
        ? +query.p
        : undefined,
  };
};
