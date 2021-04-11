import { parse } from "query-string";
import MFDefs from "./MFDefs";

export function parseTF(hash: string | undefined): TimeSpan | null {
  if (hash) {
    const params = parse(hash);
    const paramT = params.t;
    let match;
    if (
      paramT &&
      typeof paramT === "string" &&
      (match = MFDefs.tFrag.exec(paramT)) !== null
    ) {
      if (!match.groups) throw new Error("tFragRegex match error");
      const { start, end } = match.groups;
      const timeSpan = getTimeSpan(start, end);
      if (timeSpan) return { ...timeSpan, raw: paramT };
    }
  }
  return null;
}
export function bindTimeSpan(timeSpan: TimeSpan, player: HTMLMediaElement|null) {
  if (!player) return; 
  if (timeSpan.end !== Infinity) {
    player.ontimeupdate = function (e) {
      const p = this as HTMLMediaElement;
      if (p.currentTime >= timeSpan.end) {
        p.pause();
        p.ontimeupdate = null;
      }
    };
  }
  player.currentTime = timeSpan.start;
  if (player.paused) player.play();
}
interface TimeSpan {
  end: number;
  start: number;
  /**
   * raw value of key "t" in #t={value}
   */
  raw: string;
}
function getTimeSpan(
  start: string | undefined,
  end: string | undefined
): Omit<TimeSpan, "raw"> | null {
  // start may be an empty string
  const startRaw = start ? start : null;
  const endRaw = end ?? null;

  let startTime, endTime;
  if (startRaw && endRaw) {
    startTime = convertTime(startRaw);
    endTime = convertTime(endRaw);
  } else if (startRaw) {
    startTime = convertTime(startRaw);
    endTime = Infinity;
  } else if (endRaw) {
    startTime = 0;
    endTime = convertTime(endRaw);
  } else {
    console.error(start, end);
    throw new Error("Missing startTime and endTime");
  }

  if (startTime === null || endTime === null) {
    return null;
  } else {
    return { start: startTime, end: endTime };
  }
}
function convertTime(input: string): number | null {
  const npttimedef = /^(?:npt:)?([\d\.:]+)$/;
  if (npttimedef.test(input)) {
    const rawTime = (input.match(npttimedef) as RegExpMatchArray)[1];

    let match;

    if ((match = MFDefs.npt_sec.exec(rawTime)) !== null) {
      return +match[0];
    } else if ((match = MFDefs.npt_mmss.exec(rawTime)) !== null) {
      if (!match.groups) throw new Error("npt_mmss match error");
      const { mm, ss } = match.groups;
      return +mm * 60 + +ss;
    } else if ((match = MFDefs.npt_hhmmss.exec(rawTime)) !== null) {
      if (!match.groups) throw new Error("npt_hhmmss match error");
      const { hh, mm, ss } = match.groups;
      return +hh * 60 + +mm * 60 + +ss;
    } else return null;
  } else {
    console.error("fail to parse npt: " + input);
    return null;
  }
}
