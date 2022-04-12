import { MAIN_PS } from "@const";
import type { FileSystemAdapter } from "obsidian";
import { join } from "path";

import BrowserView from "./component";
export default BrowserView;

const pathToInjectScript = join(
  (app.vault.adapter as FileSystemAdapter).getFullPath(
    app.plugins.manifests["media-extended"]?.dir!,
  ),
  MAIN_PS,
);
require("@electron/remote").require(pathToInjectScript);
console.log("main process script injected");
