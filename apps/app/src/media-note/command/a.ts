import { Platform } from "obsidian";

function getCapacitor() {
  const globalAny: any =
    typeof globalThis !== "undefined"
      ? globalThis
      : typeof self !== "undefined"
      ? self
      : typeof global !== "undefined"
      ? global
      : undefined;
  if (!globalAny?.Capacitor) throw new Error("Could not find global Capacitor");
  return globalAny.Capacitor;
}

function getElectronUserFile(path: string) {
  const electron: typeof import("@electron/remote") = require("@electron/remote");
  const { join }: typeof import("path") = require("path");
  const dir = electron.app.getPath("userData");
  return join(dir, path);
}

function getCapacitorFilesystem() {
  return getCapacitor().Plugins.Filesystem;
}

async function loadConfig(path: string): Promise<string | null> {
  if (Platform.isMobileApp) {
    return await getCapacitorFilesystem()
      .readFile({
        path,
        directory: "DATA",
        encoding: "utf8",
      })
      .then((resp: any) => resp.data as string)
      .catch(onError);
  } else {
    const { readFile }: typeof import("fs/promises") = require("fs/promises");
    return await readFile(getElectronUserFile(path), "utf8").catch(onError);
  }
  function onError(e: unknown) {
    console.error(e instanceof Error ? e.message : String(e));
    return null;
  }
}

async function saveConfig(path: string, data: string) {
  if (Platform.isMobileApp) {
    await getCapacitorFilesystem().writeFile({
      path,
      data,
      directory: "DATA",
      encoding: "utf8",
    });
  } else {
    const { writeFile }: typeof import("fs/promises") = require("fs/promises");
    await writeFile(getElectronUserFile(path), data, "utf8");
  }
}
