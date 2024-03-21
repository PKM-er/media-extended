import type { MsgCtrlRemote } from "../interface";
import Plugin from "./plugin";
import { require } from "./require";

export async function loadPlugin(
  code: string | undefined,
  port: MsgCtrlRemote,
): Promise<Plugin> {
  if (!code) return new Plugin(port);
  const initializer = window.eval(
    `(function anonymous(require,module,exports){${code}\n})`,
  );
  let exports: Record<string, any> = {};
  const module = { exports };
  initializer(require, module, exports);
  exports = module.exports || exports;
  const defaultExport = (exports.default || module.exports) as
    | typeof Plugin
    | null;
  if (!defaultExport)
    throw new Error("Failed to load plugin. No exports detected.");

  const plugin = new defaultExport(port);
  if (!(plugin instanceof Plugin))
    throw new Error("Failed to load plugin. plugin not extends MediaPlugin");
  return plugin;
}
