/* eslint-disable @typescript-eslint/no-var-requires */
import type { PluginExports } from "../../lib/remote-player/lib/require";

/**
 * dummy function to make typescript happy
 */
export const requireMx = () => require("media-extended") as PluginExports;
