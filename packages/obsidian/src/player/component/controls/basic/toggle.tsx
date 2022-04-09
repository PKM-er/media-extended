import "@styles/button.less";

import { useIcon } from "@hook-utils";
import type { ButtonUnstyledProps } from "@mui/base";
import { useButton } from "@mui/base";
import cls from "classnames";
import React from "react";
import { useMergeRefs } from "use-callback-ref";

type ToggleButtonProps = ButtonUnstyledProps & {
  selected: boolean;
  selectedIcon: string;
  unselectedIcon: string;
};

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function ToggleButton(props, ref) {
    const {
      children,
      selected,
      selectedIcon,
      unselectedIcon,
      onClick,
      onChange,
    } = props;

    const setIconCallback = useIcon([selectedIcon, unselectedIcon]);

    const { active, disabled, focusVisible, getRootProps } = useButton({
      ...props,
      ref,
    });

    const handleChange = (event: any) => {
      if (onClick) {
        onClick(event);
        if (event.defaultPrevented) {
          return;
        }
      }
      if (onChange) {
        onChange(event);
      }
    };

    const classes = {
        active,
        disabled,
        focusVisible,
        selected,
      },
      { ref: buttonRef, ...rootProps } = getRootProps();
    return (
      <button
        ref={useMergeRefs([buttonRef, setIconCallback])}
        {...rootProps}
        className={cls("mx__toggle-button", classes)}
        onClick={handleChange}
        onChange={onChange}
        aria-pressed={selected}
      >
        {children}
      </button>
    );
  },
);

export default React.memo(ToggleButton);
