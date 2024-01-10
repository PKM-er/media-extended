import { Platform } from "obsidian";
import { partition } from "@/lib/remote-player/const";
import type MxPlugin from "@/mx-main";
import { modifyBilibiliSession } from "./bilibili";

export async function modifySession(this: MxPlugin) {
  if (!Platform.isDesktopApp) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const remote = require("@electron/remote");
  const session = (remote.session as typeof Electron.Session).fromPartition(
    partition,
  );
  await modifyBilibiliSession(session);
}
