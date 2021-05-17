export type mutationParam = {
  callback: MutationCallback;
  option: MutationObserverInit;
};

export function filterDuplicates(list: MutationRecord[]): MutationRecord[] {
  const targets = list.map((v) => v.target);
  return list
    .reverse()
    .filter((item, index) => targets.indexOf(item.target) == index);
}

export type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown;
}
  ? U
  : T;

export function getUrl(src: string): URL | null {
  try {
    return new URL(src);
  } catch (error) {
    // if url is invaild, do nothing and break current loop
    return null;
  }
}

type mediaType = "audio" | "video";
const acceptedExt: Map<mediaType, string[]> = new Map([
  ["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
  ["video", ["mp4", "webm", "ogv"]],
]);

export function getMediaType(url: URL): mediaType | null {
  // if url contains no extension, type = null
  let fileType: mediaType | null = null;
  if (url.pathname.includes(".")) {
    const ext = url.pathname.split(".").pop() as string;
    for (const [type, extList] of acceptedExt) {
      if (extList.includes(ext)) fileType = type;
    }
  }
  return fileType;
}
