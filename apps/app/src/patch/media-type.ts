// eslint-disable-next-line @typescript-eslint/naming-convention
export const MediaFileExtensions = {
  video: ["mp4", "webm", "ogv", "mov", "mkv"],
  audio: ["mp3", "wav", "m4a", "3gp", "flac", "ogg", "oga", "opus"],
};

export function checkMediaType(ext: string): MediaType | null {
  for (const type of Object.keys(
    MediaFileExtensions,
  ) as (keyof typeof MediaFileExtensions)[]) {
    if (MediaFileExtensions[type].includes(ext)) return type;
  }
  return null;
}

export const mediaExtensions = [
  ...MediaFileExtensions.video,
  ...MediaFileExtensions.audio,
];

export type MediaType = keyof typeof MediaFileExtensions;
