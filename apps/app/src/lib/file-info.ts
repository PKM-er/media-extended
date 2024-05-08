export interface FileInfo {
  extension: string;
  basename: string;
  path: string;
}

export function toFileInfo(
  filepath: string,
  sep = "/",
): FileInfo & { name: string; parent: string } {
  const filename = filepath.split(sep).pop()!;
  const extension = filename.split(".").pop()!;
  const info = {
    name: filename,
    path: filepath,
    parent: filepath.slice(0, -filename.length - 1),
  };
  if (extension === filename) {
    return {
      extension: "",
      basename: filename,
      ...info,
    };
  }
  return {
    extension,
    basename: filename.slice(0, -extension.length - 1),
    ...info,
  };
}
