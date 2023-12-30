/* eslint-disable @typescript-eslint/naming-convention */
import initPort from "../lib/init-port";
import { loadPlugin } from "../lib/load-plugin";
import type Plugin from "../lib/plugin";

let plugin: Plugin;
// don't await this, otherwise deadlock will happen between
// the port sender in obsidian and the port receiver in webview
initPort().then((port) => {
  port.handle("loadPlugin", async (code) => {
    if (plugin) plugin.unload();
    plugin = await loadPlugin(code, port);
    plugin.load();
  });
});
