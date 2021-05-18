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
