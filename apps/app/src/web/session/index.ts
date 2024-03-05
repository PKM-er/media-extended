import { Platform } from "obsidian";
import type MxPlugin from "@/mx-main";
import { modifyBilibiliSession } from "./bilibili";
import { getSession } from "./utils";

export async function modifySession(this: MxPlugin) {
  if (!Platform.isDesktopApp) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const session = getSession(this.app.appId);
  if (!session) return;
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
