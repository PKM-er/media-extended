import { useIcon } from "@hook-utils";
import React from "react";
import { useMergeRefs } from "use-callback-ref";

interface IconProps {
  icon: string;
  size?: number;
}

const Icon = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & IconProps
>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function Icon({ icon, size = 16, children, ...props }, ref) {
    const setIconCallback = useIcon([icon], size);
    return (
      <div ref={useMergeRefs([ref, setIconCallback])} {...props}>
        {children}
      </div>
    );
  },
);

export default React.memo(Icon);
