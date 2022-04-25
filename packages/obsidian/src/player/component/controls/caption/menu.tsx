import {
  MenuUnstyledContext,
  MenuUnstyledContextType,
  useMenu,
} from "@mui/base";
import MenuItem from "@mui/base/MenuItemUnstyled";
import { useAppDispatch, useAppSelector } from "@player/hooks";
import { setActiveCaption, toggleCaption } from "@slice/controls";
import React from "react";

import Icon from "../basic/icon";

export const CaptionSelection = () => {
  const captions = useAppSelector((state) => state.controls.captions.list);
  const active = useAppSelector((state) => state.controls.captions.active);
  const enabled = useAppSelector((state) => state.controls.captions.enabled);
  const dispatch = useAppDispatch();
  return (
    <Menu className="menu">
      {captions.map((caption, i) => {
        return (
          <MenuItem
            className="menu-item"
            key={[caption.kind, caption.label, caption.language].join(";")}
            label={caption.label}
            component="div"
            onClick={() => {
              if (i === active) dispatch(toggleCaption());
              else dispatch(setActiveCaption(i));
            }}
          >
            {enabled && active === i ? (
              <Icon className="menu-item-icon" icon="checkmark" />
            ) : (
              <div className="menu-item-icon"></div>
            )}
            <span className="menu-item-title">
              {caption.label ? caption.label : "Default"}
            </span>
            {caption.language && (
              <span className="mx__menu-value">
                <span className="mx__caption-badge">{caption.language}</span>
              </span>
            )}
          </MenuItem>
        );
      })}
    </Menu>
  );
};

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
const Menu = React.forwardRef(function Menu(
  props: React.ComponentPropsWithoutRef<"div">,
  ref: React.Ref<HTMLDivElement>,
) {
  const { children, ...other } = props;

  const {
    registerItem,
    unregisterItem,
    getListboxProps,
    getItemProps,
    getItemState,
  } = useMenu({ listboxRef: ref });

  const contextValue: MenuUnstyledContextType = {
    registerItem,
    unregisterItem,
    getItemState,
    getItemProps,
    open: true,
  };

  return (
    <div className="menu" {...other} {...getListboxProps()}>
      <MenuUnstyledContext.Provider value={contextValue}>
        {children}
      </MenuUnstyledContext.Provider>
    </div>
  );
});

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
// const MenuItem = React.forwardRef(function MenuItem(
//   props: React.ComponentPropsWithoutRef<"div">,
//   ref: React.Ref<any>,
// ) {
//   const { children, ...other } = props;

//   const { getRootProps, itemState } = useMenuItem({ component: "div", ref });

//   const classes = {
//     "menu-item": true,
//     disabled: itemState?.disabled,
//   };

//   return (
//     <div className={cls(classes)} {...other} {...getRootProps()}>
//       {children}
//     </div>
//   );
// });
