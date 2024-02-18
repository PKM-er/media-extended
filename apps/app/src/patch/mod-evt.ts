import { Keymap } from "obsidian";

export function isModEvent(evt: MouseEvent) {
  const mod = Keymap.isModEvent(evt);
  return toPaneAction(mod);
}

export function toPaneAction<A extends boolean | string | undefined>(
  action: A,
) {
  type R = A extends true ? "tab" | Exclude<A, true> : A;
  return (action === true ? "tab" : action) as R;
}
