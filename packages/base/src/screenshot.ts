const captureScreenshot = (
  video: HTMLVideoElement,
  type?: "image/jpeg" | "image/webp",
): Promise<{ time: number; blob: Blob | null }> => {
  let canvas = document.createElement("canvas");

  // set canvas size to fit video's
  const { videoWidth: width, videoHeight: height } = video;
  Object.assign(canvas, { width, height });

  // set alpha to false as video background is opaque
  let ctx = canvas.getContext("2d", { alpha: false })!;

  // Not working for MediaSource Extensions in Safari, eg. YouTube, bilibili
  // https://bugs.webkit.org/show_bug.cgi?id=206812
  ctx.drawImage(video, 0, 0, width, height);
  let time = video.currentTime;
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve({ time, blob }), type),
  );
};
export default captureScreenshot;

export const showBlobImage = (img: HTMLImageElement, src: Blob): void => {
  img.src = URL.createObjectURL(src);
  img.addEventListener("load", function (this) {
    URL.revokeObjectURL(this.src);
  });
};
