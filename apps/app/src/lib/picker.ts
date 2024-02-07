import mime from "mime";

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
