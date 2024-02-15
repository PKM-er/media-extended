import { Platform } from "obsidian";
import { getPartition } from "@/lib/remote-player/const";
import type MxPlugin from "@/mx-main";
import { modifyBilibiliSession } from "./bilibili";

export async function modifySession(this: MxPlugin) {
  if (!Platform.isDesktopApp) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const remote = require("@electron/remote");
  const session = (remote.session as typeof Electron.Session).fromPartition(
    getPartition(this.app.appId),
  );
  this.settings.subscribe((s, prev) => {
    if (s.biliDefaultQuality !== prev.biliDefaultQuality) {
      modifyBilibiliSession(session, s.biliDefaultQuality);
    }
  });
  await modifyBilibiliSession(
    session,
    this.settings.getState().biliDefaultQuality,
  );
}
