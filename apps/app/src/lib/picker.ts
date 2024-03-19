import mime from "mime";
import { Platform } from "obsidian";
import { MediaFileExtensions } from "@/info/media-type";
import { getDialog } from "@/web/session/utils";

/**
 * @returns absolute path of the picked file, or null if canceled
 */
export async function pickMediaFile(
  defaultPath?: string,
): Promise<string | null> {
  if (!Platform.isDesktopApp) {
    throw new Error("Not supported in web");
  }
  const result = await getDialog().showOpenDialog({
    title: "Pick a media file",
    message: "Pick a media file to open",
    buttonLabel: "Pick",
    properties: ["openFile"],
    filters: [
      { extensions: MediaFileExtensions.video, name: "Video" },
      { extensions: MediaFileExtensions.audio, name: "Audio" },
    ],
    defaultPath,
  });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
}

export function pickFile(exts: string[] = []) {
  return new Promise<string | null>((resolve) => {
    // open a file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = exts
      .flatMap((e) => {
        const mimeType = mime.getType(e);
        const ext = `.${e}`;
        return mimeType ? [mimeType, ext] : [ext];
      })
      .join(",");
    input.addEventListener(
      "change",
      () => {
        if (!input.files || input.files.length === 0) {
          resolve(null);
        } else {
          resolve(input.files[0].path);
        }
      },
      { once: true },
    );
    input.click();
  });
}
