import type { Component, MetadataCache } from "obsidian";

export function waitUntilResolve(
  meta: MetadataCache,
  component?: Component,
): Promise<void> {
  if (meta.initialized) return Promise.resolve();
  return new Promise((resolve) => {
    const evt = meta.on("initialized", () => {
      meta.offref(evt);
      resolve();
    });
    component?.registerEvent(evt);
  });
}
