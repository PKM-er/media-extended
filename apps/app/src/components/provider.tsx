import {
  MediaProvider,
  useMediaState,
  type MediaProviderAdapter,
  type MediaProviderInstance,
  type MediaProviderLoader,
  type MediaProviderProps,
} from "@vidstack/react";
import { useCallback } from "react";
import { getPartition } from "@/lib/remote-player/const";
import { WebviewProviderLoader } from "@/lib/remote-player/loader";
import { cn } from "@/lib/utils";
import { channelId } from "@/web/bili-req/channel";
import { BILI_REQ_STORE } from "@/web/bili-req/const";
import { useApp, useMediaViewStore } from "./context";
import { useControls } from "./hook/use-hash";
import { WebView } from "./webview";

const { preload } = channelId(BILI_REQ_STORE);

export function MediaProviderEnhanced({
  loaders,
  ...props
}: Omit<MediaProviderProps, "buildMediaEl">) {
  const appId = useApp((x) => x.appId);
  const type = useMediaState("viewType");
  const flipHorizontal = useMediaViewStore(
      (s) => !!s.transform?.flipHorizontal,
    ),
    flipVertical = useMediaViewStore((s) => !!s.transform?.flipVertical),
    rotate = useMediaViewStore((s) => {
      if (!s.transform?.rotate) return;
      switch (s.transform.rotate) {
        case "90":
          return "rotate-90";
        case "180":
          return "rotate-180";
        case "270":
          return "rotate-[270deg]";
        default:
          return undefined;
      }
    });
  const controls = useControls();
  return (
    <MediaProvider
      className={cn(
        type === "video" && flipHorizontal && "-scale-x-100",
        type === "video" && flipVertical && "-scale-y-100",
        type === "video" && rotate,
      )}
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
              className={cn(
                "data-[play-ready]:blur-none blur-lg transition-opacity",
                controls && "pointer-events-none",
              )}
              webpreferences="autoplayPolicy=user-gesture-required"
              // devtools
              partition={getPartition(appId)}
              preload={preload}
              ref={(inst) => {
                provider.load(inst);
              }}
            />
          );
        },
        [appId, controls],
      )}
      {...props}
    ></MediaProvider>
  );
}
