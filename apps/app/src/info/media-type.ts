const mediaFileExtensions = {
  video: ["mp4", "webm", "ogv", "mov", "mkv"] as const,
  audio: ["mp3", "wav", "m4a", "3gp", "flac", "ogg", "oga", "opus"] as const,
} satisfies Record<MediaType, readonly string[]>;

export const getMediaExts = (type: MediaType) => [...mediaFileExtensions[type]];

const checkerSet = {
  video: new Set(mediaFileExtensions.video),
  audio: new Set(mediaFileExtensions.audio),
} satisfies Record<MediaType, Set<string>>;

export function checkMediaType(ext: string): MediaType | null {
  ext = ext.replace(/^\./, "").toLowerCase();
  for (const type of mediaTypes) {
    if (checkerSet[type].has(ext)) return type;
  }
  return null;
}

export function isMediaFile(ext: string): ext is SupportedMediaExt {
  return checkerSet.video.has(ext) || checkerSet.audio.has(ext);
}

export const mediaExtensions = [
  ...mediaFileExtensions.video,
  ...mediaFileExtensions.audio,
];

export type SupportedMediaExt = (typeof mediaExtensions)[number];

const mediaTypes = ["video", "audio"] as const;
export type MediaType = (typeof mediaTypes)[number];
