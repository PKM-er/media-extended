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
