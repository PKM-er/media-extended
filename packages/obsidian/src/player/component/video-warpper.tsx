import cls from "classnames";
import React, { PropsWithChildren } from "react";

import AspectRatio from "./aspect-ratio";

type VideoWarpperProps = PropsWithChildren<{ className?: string }>;

const VideoWarpper = React.forwardRef<HTMLDivElement, VideoWarpperProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function VideoWarpper({ children, className }: VideoWarpperProps, ref) {
    return (
      <AspectRatio ref={ref} className={cls("mx__video-wrapper", className)}>
        {children}
      </AspectRatio>
    );
  },
);
export default VideoWarpper;
