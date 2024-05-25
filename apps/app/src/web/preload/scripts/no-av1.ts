import { around } from "monkey-around";

const av1Codec = /codecs="?av01\./;

export function noAV1() {
  const unloads = [
    around(HTMLMediaElement.prototype as HTMLMediaElement, {
      canPlayType: (next) =>
        function canPlayType(this: HTMLVideoElement, type: string) {
          if (av1Codec.test(type)) return "";
          return next.call(this, type);
        },
    }),
    around(window.MediaSource, {
      isTypeSupported: (next) =>
        function isTypeSupported(this: typeof MediaSource, type: string) {
          if (av1Codec.test(type)) return false;
          return next.call(this, type);
        },
    }),
  ];
  return () => unloads.forEach((u) => u());
}
