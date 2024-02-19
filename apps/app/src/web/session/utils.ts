import { Platform } from "obsidian";
import { getPartition } from "@/lib/remote-player/const";

export function getSession(appId: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const remote = require("@electron/remote");
  return (remote.session as typeof Electron.Session).fromPartition(
    getPartition(appId),
  );
}

export function getFsPromise() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (!Platform.isDesktopApp) return null;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-var-requires
  return require("fs/promises") as typeof import("node:fs/promises");
}

export function getWebContents(id: number) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const remote = require("@electron/remote");
  return (remote.webContents as typeof Electron.WebContents).fromId(id);
}

export function getDialog() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const remote = require("@electron/remote");
  return remote.dialog as typeof Electron.dialog;
}
