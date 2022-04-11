import cls from "classnames";
import React, { PropsWithChildren } from "react";

import AspectRatio from "./aspect-ratio";

type VideoWarpperProps = PropsWithChildren<{
  className?: string;
  keepRatio?: "width" | "height";
}>;

const VideoWarpper = React.forwardRef<HTMLDivElement, VideoWarpperProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function VideoWarpper(
    { children, className, keepRatio }: VideoWarpperProps,
    ref,
  ) {
    return (
      <AspectRatio
        ref={ref}
        className={cls("mx__video-wrapper", className)}
        style={{
          height: keepRatio === "width" ? "auto" : "100%",
          width: keepRatio === "height" ? "auto" : "100%",
        }}
      >
        {children}
      </AspectRatio>
    );
  },
);
export default VideoWarpper;
export { default as useKeepRatio } from "./use-keep-ratio";
