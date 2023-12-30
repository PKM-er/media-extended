import type { MsgCtrlRemote } from "../type";
import {
  capitalize,
  mediaActionProps,
  mediaReadonlyStateProps,
  mediaWritableStateProps,
  serializeMediaStatePropValue,
} from "../type";

export function registerHandlers(
  port: MsgCtrlRemote,
  player: HTMLMediaElement,
) {
  mediaReadonlyStateProps.forEach((prop) => {
    port.handle(`get${capitalize(prop)}`, () => ({
      value: serializeMediaStatePropValue(player[prop]),
    }));
  });
  mediaWritableStateProps.forEach((prop) => {
    port.handle(`get${capitalize(prop)}`, () => ({
      value: serializeMediaStatePropValue(player[prop]),
    }));
    port.handle(`set${capitalize(prop)}`, (val) => {
      (player as any)[prop] = val;
    });
  });
  mediaActionProps.forEach((prop) => {
    port.handle(prop, async (...args) => ({
      value: await (player as any)[prop](...args),
    }));
  });
}
