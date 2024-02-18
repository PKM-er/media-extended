import { Platform } from "obsidian";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const path: typeof import("node:path") = Platform.isWin
  ? require("path/win32")
  : require("path/posix");
export default path;
