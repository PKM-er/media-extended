import { parse } from "query-string";

const TFDef = {
  tFrag: /^(?<start>[\w:\.]*?)(?:,(?<end>[\w:\.]+?))?$/,

  npt_sec: /^\d+(?:\.\d+)?$/,
  npt_mmss: /^(?<mm>[0-5]\d):(?<ss>[0-5]\d(?:\.\d+)?)$/,
  npt_hhmmss: /^(?<hh>\d+):(?<mm>[0-5]\d):(?<ss>[0-5]\d(?:\.\d+)?)$/,
  npt_time: /^(?:npt:)?([\d\.:]+)$/,
};

/** parse temporal fragment from hash */
export const parseTF = (hash: string | undefined): TimeSpan | null => {
  if (hash) {
    const params = parse(hash);
    const paramT = params.t;
    let match;
    if (
      paramT &&
      typeof paramT === "string" &&
      (match = TFDef.tFrag.exec(paramT)) !== null
    ) {
      if (!match.groups) throw new Error("tFragRegex match error");
      const { start, end } = match.groups;
      const timeSpan = getTimeSpan(start, end);
      if (timeSpan) return { ...timeSpan, raw: paramT };
    }
  }
  return null;
};
export interface TimeSpan {
  end: number;
  start: number;
  /**
   * raw value of key "t" in #t={value}
   */
  raw: string;
}

const getTimeSpan = (
  start: string | undefined,
  end: string | undefined,
): Omit<TimeSpan, "raw"> | null => {
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
};

const convertTime = (input: string): number | null => {
  let match;
  if ((match = input.match(TFDef.npt_time))) {
    const rawTime = match[1];
    if ((match = TFDef.npt_sec.exec(rawTime)) !== null) {
      return +match[0];
    } else if ((match = rawTime.match(TFDef.npt_mmss)) !== null) {
      const { mm, ss } = match.groups!;
      return +mm * 60 + +ss;
    } else if ((match = rawTime.match(TFDef.npt_hhmmss)) !== null) {
      const { hh, mm, ss } = match.groups!;
      return +hh * 60 * 60 + +mm * 60 + +ss;
    } else return null;
  } else {
    // console.error("fail to parse npt: " + input);
    return null;
  }
};
