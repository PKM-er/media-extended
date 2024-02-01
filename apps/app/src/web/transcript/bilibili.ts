import type { MsgCtrlLocal } from "@/lib/remote-player/type";
import type MxPlugin from "@/mx-main";

export async function cacheBilibiliTranscripts(
  port: MsgCtrlLocal,
  plugin: MxPlugin,
): Promise<{
  subtitles: { id: number; lan: string; lanDesc: string }[];
  aid: number;
  bvid: string;
  cid: number;
}> {
  const gzip = true;
  const {
    aid,
    bvid,
    cid,
    subtitle: { subtitles },
  } = await plugin.biliReq.getPlayerApiResp(port);
  const id = { aid, bvid, cid };
  if (subtitles.length === 0) return { ...id, subtitles: [] };
  const subtitleInfo = await Promise.all(
    subtitles.map(async ({ id, lan, lan_doc, subtitle_url }) => {
      const {
        type,
        ab,
        respHeaders: { ["content-md5"]: md5 },
      } = await port.methods.fetch(subtitle_url, {
        gzip,
      });
      if (type !== "application/json") {
        throw new Error(`Unexpected subtitle type ${type}: ${lan}@${id}`);
      }
      const data = {
        ab,
        aid,
        bvid,
        cid,
        gzip,
        id,
        md5,
        lan,
        lan_doc,
      };
      await plugin.biliReq.cacheSubtitle(id, data);
      return { id, md5, lan, lanDesc: lan_doc };
    }),
  );
  return {
    ...id,
    subtitles: subtitleInfo,
  };
}
