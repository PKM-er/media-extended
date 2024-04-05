/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Platform } from "obsidian";
import { getPartition } from "@/lib/remote-player/const";

export function getSession(appId: string) {
  const remote = require("@electron/remote");
  const partition = getPartition(appId);
  if (!partition) {
    console.log("No partition, skip modifying session");
    return null;
  }
  return (remote.session as typeof Electron.Session).fromPartition(partition);
}

export function getFsPromise() {
  if (!Platform.isDesktopApp) return null;
  return require("fs/promises") as typeof import("node:fs/promises");
}

export function getWebContents(id: number) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const remote = require("@electron/remote");
  return (remote.webContents as typeof Electron.WebContents).fromId(id);
}

export function getDialog() {
  const remote = require("@electron/remote");
  return remote.dialog as typeof Electron.dialog;
}

export function evalInMainPs(scriptPath: string) {
  const remote = require("@electron/remote");
  return remote.require(scriptPath);
}

export function getUserDataPath() {
  const remote = require("@electron/remote");
  return (remote.app as import("electron/main").App).getPath("userData");
}
