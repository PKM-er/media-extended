import type MxPlugin from "@/mx-main";
import { MediaSwitcherModal } from "./modal";
import { registerProtocol } from "./protocol";

export function initSwitcher(plugin: MxPlugin) {
  plugin.addCommand({
    id: "open-media-url",
    name: "Open media from URL",
    icon: "link",
    callback: () => new MediaSwitcherModal(plugin).open(),
  });
  registerProtocol(plugin);
}
