import path from "@/lib/path";
import { getFsPromise } from "@/web/session/utils";

export interface FileInfo {
  extension: string;
  basename: string;
  path: string;
}

export function toFileInfo(filepath: string): FileInfo {
  const name = path.basename(filepath);
  const segs = name.split(".");
  if (segs.length === 1)
    return {
      extension: "",
      basename: name,
      path: filepath,
    };

  return {
    extension: segs.at(-1)!,
    basename: segs.slice(0, -1).join("."),
    path: filepath,
  };
}

/**
 * @param exclude names of files under the directory to exclude
 */
export async function* iterSiblings(
  dirPath: string,
  exclude: string[] = [],
): AsyncGenerator<FileInfo> {
  const fs = getFsPromise();
  if (!fs) return;
  const excludeSet = new Set(exclude);
  const dir = await fs.opendir(dirPath, { encoding: "utf-8" });
  for await (const f of dir) {
    if (!(f.isFile() || f.isSymbolicLink()) || excludeSet.has(f.name)) continue;
    yield toFileInfo(path.join(dirPath, f.name));
  }
}
