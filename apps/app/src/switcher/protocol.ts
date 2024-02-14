/* eslint-disable @typescript-eslint/naming-convention */
import { around } from "monkey-around";
import type { ObsidianProtocolData } from "obsidian";
import { Notice } from "obsidian";
import { toURL } from "@/lib/url";
import type MxPlugin from "@/mx-main";
import { MediaURL } from "@/web/url-match";

declare global {
  // eslint-disable-next-line no-var
  var OBS_ACT: ((params: ObsidianProtocolData) => void) | undefined;
}

const ACTION = "mx-open";
export function registerProtocol(plugin: MxPlugin) {
  if (window.OBS_ACT) {
    plugin.register(
      around(window as { OBS_ACT: (params: ObsidianProtocolData) => void }, {
        OBS_ACT: (next) =>
          function OBS_ACT(params: ObsidianProtocolData) {
            if (params.action.startsWith(ACTION + "/")) {
              handlePathnameProtocol(params);
              return;
            }
            // @ts-ignore
            // eslint-disable-next-line prefer-rest-params
            return next.apply(this, arguments);
          },
      }),
    );
  }

  plugin.registerObsidianProtocolHandler("mx-open", (params) => {
    const url = toURL(params.url);
    if (!url) {
      new Notice("Invalid URL: " + params.url);
      return;
    }
    handleUrl(url);
  });

  function handlePathnameProtocol(params: ObsidianProtocolData) {
    // remove "mx-open/"
    const base = decodeURI(params.action.substring(ACTION.length + 1));
    const url = toURL(base);
    const search = new URLSearchParams(params);
    search.delete("action");

    if (!url) {
      new Notice("Invalid URL: " + base + "?" + search.toString());
      return;
    }
    url.search = search.toString();
    handleUrl(url);
  }
  function handleUrl(url: URL) {
    const urlInfo = MediaURL.create(url);
    if (!urlInfo) {
      new Notice("Invail URL: " + url.href);
      return;
    }
    plugin.leafOpener.openMedia(urlInfo, undefined);
  }
}
