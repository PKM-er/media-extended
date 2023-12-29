import type { MediaProviderLoader, MediaSrc, MediaType } from "@vidstack/react";
import type { WebviewTag } from "electron";

import { isString } from "maverick.js/std";
import { WebiviewMediaProvider } from "./provider";

export class WebviewProviderLoader
  implements MediaProviderLoader<WebiviewMediaProvider>
{
  target!: WebviewTag;

  canPlay({ src }: MediaSrc) {
    return isString(src) && src.startsWith("webview::");
  }

  mediaType(): MediaType {
    return "video";
  }

  async load() {
    return new WebiviewMediaProvider(this.target);
  }
}
