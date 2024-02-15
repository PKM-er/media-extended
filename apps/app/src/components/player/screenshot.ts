import type { MediaProviderAdapter } from "@vidstack/react";
import { isVideoProvider } from "@vidstack/react";
import { Notice, Platform } from "obsidian";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { captureScreenshot } from "@/lib/screenshot";

export function canProviderScreenshot(provider: MediaProviderAdapter | null) {
  return isVideoProvider(provider) || provider instanceof WebiviewMediaProvider;
}

export async function takeScreenshot(provider: MediaProviderAdapter) {
  const mimeType = Platform.isSafari ? "image/jpeg" : "image/webp";
  try {
    if (isVideoProvider(provider)) {
      return await captureScreenshot(provider.video, mimeType);
    } else if (provider instanceof WebiviewMediaProvider) {
      return await provider.media.methods.screenshot(mimeType);
    } else {
      throw new Error("Unsupported provider for screenshot");
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "SecurityError") {
      new Notice(
        "Cannot take screenshot due to CORS restriction, you can try open media as webpage to bypass this",
      );
    } else {
      new Notice(
        "Cannot take screenshot: " +
          (e instanceof Error ? e.message : String(e)),
      );
    }
    throw e;
  }
}
