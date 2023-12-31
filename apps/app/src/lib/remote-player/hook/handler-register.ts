import { captureScreenshot } from "@/lib/screenshot";
import type MediaPlugin from "../lib/plugin";
import {
  capitalize,
  mediaActionProps,
  mediaReadonlyStateProps,
  mediaWritableStateProps,
  serializeMediaStatePropValue,
} from "../type";

export function registerHandlers(plugin: MediaPlugin) {
  const player = plugin.media;
  const port = plugin.controller;
  mediaReadonlyStateProps.forEach((prop) => {
    port.handle(`get${capitalize(prop)}`, () => ({
      value: serializeMediaStatePropValue(player[prop]),
    }));
  });
  mediaWritableStateProps.forEach((prop) => {
    port.handle(`get${capitalize(prop)}`, () => ({
      value: serializeMediaStatePropValue(player[prop]),
    }));
    port.handle(`set${capitalize(prop)}`, (val) => {
      (player as any)[prop] = val;
    });
  });
  mediaActionProps.forEach((prop) => {
    port.handle(prop, async (...args) => ({
      value: await (player as any)[prop](...args),
    }));
  });
  port.handle("screenshot", async (type) => {
    if (!(player instanceof HTMLVideoElement))
      throw new Error("Cannot take screenshot of non-video element");

    const value = await captureScreenshot(player, type);
    return {
      value,
      transfer: [value.blob.arrayBuffer],
    };
  });
}
