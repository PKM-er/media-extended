import {
  MediaProvider,
  type MediaProviderAdapter,
  type MediaProviderInstance,
  type MediaProviderLoader,
  type MediaProviderProps,
} from "@vidstack/react";
import { useCallback } from "react";
import { WebviewProviderLoader } from "@/lib/remote-player/loader";
import { WebView } from "./webview";

export function MediaProviderEnhanced({
  loaders,
  ...props
}: Omit<MediaProviderProps, "buildMediaEl">) {
  return (
    <MediaProvider
      loaders={[WebviewProviderLoader, ...(loaders ?? [])]}
      buildMediaEl={useCallback(
        (
          loader: MediaProviderLoader<MediaProviderAdapter> | null,
          provider: MediaProviderInstance,
        ) => {
          if (!(loader instanceof WebviewProviderLoader)) return null;
          return (
            <WebView
              aria-hidden
              devtools
              ref={(inst) => {
                provider.load(inst);
              }}
            />
          );
        },
        [],
      )}
      {...props}
    />
  );
}
