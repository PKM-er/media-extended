export interface ScreenshotInfo {
  time: number;
  blob: {
    arrayBuffer: ArrayBuffer;
    type: string;
  };
}

export async function captureScreenshot(
  video: HTMLVideoElement,
  type?: string,
): Promise<ScreenshotInfo> {
  const canvas = document.createElement("canvas");

  // set canvas size to fit video's
  const { videoWidth: width, videoHeight: height } = video;
  Object.assign(canvas, { width, height });

  // set alpha to false as video background is opaque
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) {
    throw new Error("Canvas context creation failed");
  }

  // Not working for MediaSource Extensions in Safari, eg. YouTube, bilibili
  // https://bugs.webkit.org/show_bug.cgi?id=206812
  ctx.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => {
      // the image cannot be created for any reason
      if (!blob) reject(new Error("Canvas to blob failed"));
      else resolve(blob);
    }, type),
  );
  const arrayBuffer = await blob.arrayBuffer();
  return {
    time: video.currentTime,
    blob: { arrayBuffer, type: blob.type },
  };
}

export const showBlobImage = (img: HTMLImageElement, src: Blob): void => {
  img.src = URL.createObjectURL(src);
  function revokeAfterLoaded(this: HTMLImageElement) {
    URL.revokeObjectURL(this.src);
    img.removeEventListener("error", revokeAfterError);
  }
  function revokeAfterError(this: HTMLImageElement) {
    URL.revokeObjectURL(this.src);
    img.removeEventListener("load", revokeAfterLoaded);
  }
  img.addEventListener("load", revokeAfterLoaded, { once: true });
  img.addEventListener("error", revokeAfterError, { once: true });
};
