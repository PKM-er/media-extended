import pLimit from "p-limit";
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
  const reqLimit = pLimit(4);
  port.handle("fetch", async (url, { gzip = false, ...init } = {}) => {
    const resp = await reqLimit(() => window.fetch(url, init));
    const blob = await resp.blob();
    const head = {
      type: blob.type,
      respHeaders: Object.fromEntries(resp.headers),
    };
    if (!gzip) {
      const ab = await blob.arrayBuffer();
      return {
        value: { ab, gzip: false, ...head },
        transfer: [ab],
      };
    }
    const stream = blob.stream() as unknown as ReadableStream<Uint8Array>;
    const ab = await streamToArrayBuffer(
      stream.pipeThrough(new CompressionStream("gzip")),
    );
    return {
      value: { ab, gzip: true, ...head },
      transfer: [ab],
    };
  });
}

async function streamToArrayBuffer(readableStream: ReadableStream<Uint8Array>) {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const length = chunks.reduce((prev, curr) => prev + curr.byteLength, 0);
  const result = new Uint8Array(length);

  for (let i = 0, offset = 0; i < chunks.length; i++) {
    result.set(chunks[i], offset);
    offset += chunks[i].byteLength;
  }
  return result.buffer;
}
