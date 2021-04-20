import { create } from "xmlbuilder2";
import { PlayUrl_Dash } from "./bili-api/getPlayUrl";

export function toMPD(data: PlayUrl_Dash) {
  const d = data.dash;

  let videos = d.video.filter(v=>v.codecs.startsWith("avc1")).map((v) => ({
    BaseURL: v.baseUrl,
    "@id": v.id,
    "@mimeType": v.mimeType,
    "@bandwidth": v.bandwidth,
    "@codecs": v.codecs,
    "@width": v.width,
    "@height": v.height,
    "@frameRate": v.frameRate,
    "@sar": v.sar,
    "@startWithSap": v.startWithSap,
    SegmentBase: {
      "@indexRange": v.SegmentBase.indexRange,
      "@Initialization": v.SegmentBase.Initialization
    },
  }));

  let audios = d.audio.map((v) => ({
    BaseURL: v.baseUrl,
    "@id": v.id,
    "@mimeType": v.mimeType,
    "@bandwidth": v.bandwidth,
    "@codecs": v.codecs,
    "@startWithSap": v.startWithSap,
    SegmentBase: {
      "@indexRange": v.SegmentBase.indexRange,
      "@Initialization": v.SegmentBase.Initialization
    },
  }));

  // prettier-ignore
  const root = create({ version: '1.0' })
  .ele("urn:mpeg:dash:schema:mpd:2011","MPD",{
      profiles: "urn:mpeg:dash:profile:isoff-on-demand:2011,http://dashif.org/guidelines/dash264",
      type:"static",
      minBufferTime: `PT${d.minBufferTime}S`,
      mediaPresentationDuration: `PT${d.duration}S`
    })
    .ele("Period", {duration: `PT${d.duration}S`})
      .ele("AdaptationSet",{ contentType:"video", bitstreamSwitching:true })
        .ele({Representation:videos}).up()
      .up()
      .ele("AdaptationSet",{ contentType:"audio", bitstreamSwitching:true })
        .ele({Representation:audios}).up()

  const xml = root.end({ prettyPrint: true });
  return xml;
}
