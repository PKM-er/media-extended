import type MediaExtended from "@plugin";
import { vaildateMediaURL } from "mx-base";
import { Menu } from "obsidian";

import { registerCommand } from "./command";
import { patchEmptyView } from "./empty-view-opt";
import { registerURLHandler } from "./url-scheme";

// open media link in external browser
const openInBrowser = (menu: Menu, url: string) => {
  vaildateMediaURL(url, (url, hash) => {
    menu.addItem((item) =>
      item
        .setIcon("open-elsewhere-glyph")
        .setTitle("Open in Browser")
        .onClick(() => window.open(url, "_blank")),
    );
  });
};

const registerOpenMediaLink = (plugin: MediaExtended) => {
  registerCommand(plugin);
  registerURLHandler(plugin);
  patchEmptyView(plugin);

  plugin.registerEvent(plugin.app.workspace.on("url-menu", openInBrowser));
};

export default registerOpenMediaLink;
// export { PromptToOpenMediaLink } from "./command";
export {
  openMediaFile,
  openMediaLink,
  openMediaLinkInHoverEditor,
} from "./open-media";
