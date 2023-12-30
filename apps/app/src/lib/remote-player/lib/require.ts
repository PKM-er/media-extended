/* eslint-disable @typescript-eslint/naming-convention */
import MediaPlugin from "./plugin";
import { waitForSelector } from "./wait-el";

const pluginExports = {
  waitForSelector,
  MediaPlugin,
};

export type PluginExports = typeof pluginExports;

export const require = (<M extends Record<string, Record<string, any>>>(
  modules: M,
) =>
  function require<K extends keyof M>(e: K): (typeof modules)[K] {
    if (e in modules) return modules[e];
    throw new Error(`Module not found: ${e.toString()}`);
  })({
  "media-extended": pluginExports,
});
