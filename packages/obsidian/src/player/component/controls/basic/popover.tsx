import "@styles/popover.less";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react-dom-interactions";
import cls from "classnames";
import React, { cloneElement, useEffect, useState } from "react";

interface Props {
  render: (data: {
    close: () => void;
    // labelId: string;
    // descriptionId: string;
  }) => React.ReactNode;
  placement?: Placement;
  children: JSX.Element;
  /** class name for tooltip container */
  className?: string;
  useSafePolygon?: boolean;
}

const Popover = ({
  children,
  render,
  placement,
  className,
  useSafePolygon = true,
}: Props) => {
  const [open, setOpen] = useState(false);

  const { x, y, reference, floating, strategy, refs, update, context } =
    useFloating({
      open,
      onOpenChange: setOpen,
      middleware: [offset(5), flip(), shift({ padding: 5 })],
      placement,
    });

  // const id = useId();
  // const labelId = `${id}-label`;
  // const descriptionId = `${id}-description`;

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, {
      handleClose: useSafePolygon ? safePolygon({ restMs: 200 }) : undefined,
    }),
    useRole(context),
    useDismiss(context),
    // useFocusTrap(context),
  ]);

  useEffect(() => {
    if (refs.reference.current && refs.floating.current && open) {
      return autoUpdate(refs.reference.current, refs.floating.current, update);
    }
  }, [open, update, refs.reference, refs.floating]);

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({ ref: reference, ...children.props }),
      )}
      <FloatingPortal>
        {open && (
          <div
            {...getFloatingProps({
              className: cls("mx__popover", className),
              ref: floating,
              style: {
                position: strategy,
                top: y ?? "",
                left: x ?? "",
              },
              // "aria-labelledby": labelId,
              // "aria-describedby": descriptionId,
            })}
          >
            {render({
              // labelId,
              // descriptionId,
              close: () => {
                setOpen(false);
                (refs.reference.current as HTMLElement).focus();
              },
            })}
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default Popover;
