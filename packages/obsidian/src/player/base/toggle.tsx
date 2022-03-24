import type { ButtonUnstyledProps } from "@mui/base";
import Button from "@mui/base/ButtonUnstyled";
import React, { forwardRef, useState } from "preact/compat";

type ToggleButtonProps = ButtonUnstyledProps & {
  onChange?: (evt: MouseEvent, val: boolean) => any;
  value: boolean;
  onIcon: string;
  offIcon: string;
};

const ToggleButton = forwardRef<ToggleButtonProps["ref"], ToggleButtonProps>(
  ({ onClick, onChange, value }, ref) => {
    const handleChange = (event: MouseEvent) => {
      if (onClick) {
        onClick(event, value);
        if (event.defaultPrevented) {
          return;
        }
      }
      if (onChange) {
        onChange(event, value);
      }
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        aria-label={props["aria-label"]}
        aria-pressed={active}
        {...props}
      />
    );
  },
);
