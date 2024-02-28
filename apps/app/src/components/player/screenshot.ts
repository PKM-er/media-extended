import type { MediaProviderAdapter, VideoProvider } from "@vidstack/react";
import { isVideoProvider } from "@vidstack/react";
import { Notice, Platform } from "obsidian";
import { WebiviewMediaProvider } from "@/lib/remote-player/provider";
import { captureScreenshot } from "@/lib/screenshot";

export function canProviderScreenshot(
  provider: MediaProviderAdapter | null,
): provider is VideoProvider | WebiviewMediaProvider {
  return isVideoProvider(provider) || provider instanceof WebiviewMediaProvider;
}

export async function takeScreenshot(
  provider: MediaProviderAdapter,
  type: "image/jpeg" | "image/webp" | "image/png",
  quality: number | undefined,
) {
  const mimeType =
    Platform.isSafari && type === "image/webp" ? "image/jpeg" : type;
  try {
    if (isVideoProvider(provider)) {
      return await captureScreenshot(provider.video, mimeType, quality);
    } else if (provider instanceof WebiviewMediaProvider) {
      return await provider.media.methods.screenshot(mimeType, quality);
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
