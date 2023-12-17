import type { Plugin, ViewCreator } from "obsidian";
import { MediaFileExtensions } from "./utils";

export default function injectMediaView(
  this: Plugin,
  viewType: string,
  viewCreator: ViewCreator,
) {
  const { app } = this;
  this.registerView(viewType, viewCreator);
  const targetExtensions = (["video", "audio"] as const).flatMap(
    (type) => MediaFileExtensions[type],
  );
  this.register(unregisterExistingViewExt(targetExtensions));
  this.registerExtensions(targetExtensions, viewType);

  function unregisterExistingViewExt(exts: string[]) {
    const viewTypeBackup: { ext: string; type: string | undefined }[] =
      exts.map((ext) => ({ ext, type: app.viewRegistry.typeByExtension[ext] }));
    app.viewRegistry.unregisterExtensions(exts);
    return () => {
      groupBy(viewTypeBackup, "type").forEach((backup, type) => {
        if (!type) return;
        app.viewRegistry.registerExtensions(
          backup.map((ext) => ext.ext),
          type,
        );
      });
    };
  }
}

function groupBy<T extends Record<string, any>, K extends keyof T>(
  arr: T[],
  key: K,
): Map<T[K], T[]> {
  return arr.reduce((map, item) => {
    const group = item[key];
    const groupArr = map.get(group);
    if (groupArr) groupArr.push(item);
    else map.set(group, [item]);
    return map;
  }, new Map());
}
