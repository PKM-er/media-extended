import { assertNever } from "assert-never";
import { setupThumbnail } from "./setupThumbnail";
import { getVideoInfo, Host, setupPlyr, setupIFrame } from "./tools";

export function getPlayer(url: URL, thumbnail = false): HTMLDivElement | null {
  let info = getVideoInfo(url);
  if (!info) return null;
  const container = createDiv({ cls: "external-video" });
  switch (info.host) {
    case Host.YouTube:
    case Host.Vimeo:
      if (thumbnail) setupThumbnail(container, info);
      else setupPlyr(container, info);
      break;
    case Host.Bilibili:
      if (thumbnail) setupThumbnail(container, info);
      else setupIFrame(container, info);
      break;
    default:
      assertNever(info.host);
  }
  return container;
}
