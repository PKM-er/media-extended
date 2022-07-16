// https://github.com/amio/userscript-parser

/**
 * Userscript format:
 * http://wiki.greasespot.net/Metadata_Block
 */

import { camelCase } from "lodash-es";

export interface UserScriptMeta {
  description: string[];
  downloadURL: string[];
  name: string[];
  homepageURL: string[];
  author: string[];
  version: string[];
  date: string[];
  include: string[];
  exclude: string[];
  match: string[];
  grant: string[];
  runAt: string[];
  license: string[];
  [key: string]: string[];
}

interface UserscriptMetaInfo {
  meta: UserScriptMeta;
  metablock: string;
  script: string;
}

export const parseMeta = (
  userscriptText: string,
): UserscriptMetaInfo | null => {
  try {
    let blocksReg =
      /\B(\/\/ ==UserScript==\r?\n([\S\s]*?)\r?\n\/\/ ==\/UserScript==)([\S\s]*)/;
    let blocks = userscriptText.match(blocksReg);

    if (!blocks) {
      return null;
    }

    let [, metablock, meta, script] = blocks;

    let info: UserscriptMetaInfo = {
      meta: {
        description: [],
        downloadURL: [],
        name: [],
        namespace: [],
        homepageURL: [],
        author: [],
        version: [],
        date: [],
        include: [],
        exclude: [],
        match: [],
        grant: [],
        runAt: [],
        license: [],
      },
      metablock,
      script,
    };
    let metaArray = meta.split("\n");
    for (const line of metaArray) {
      let keyVal = line.match(/@([\w-]+)\s+(.+)/);
      if (!keyVal) continue;

      let [, key, value] = keyVal;
      key = camelCase(key);

      if (!(key in info.meta)) {
        console.warn("unknown meta key:", key);
        info.meta[key] = info.meta[key] ?? [];
      }
      info.meta[key].push(value);
    }

    return info;
  } catch (e) {
    if (console) console.error(e);
    return null;
  }
};
