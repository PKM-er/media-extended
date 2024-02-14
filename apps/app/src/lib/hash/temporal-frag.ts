const tempFragPattern = {
  main: /^(?<start>[\w:.]*)(?:,(?<end>[\w:.]+))?$/,
  npt_sec: /^\d+(?:\.\d+)?$/,
  npt_mmss: /^(?<mm>[0-5]\d):(?<ss>[0-5]\d(?:\.\d+)?)$/,
  npt_hhmmss: /^(?<hh>\d+):(?<mm>[0-5]\d):(?<ss>[0-5]\d(?:\.\d+)?)$/,
  npt_time: /^(?:npt:)?([\d.:]+)$/,
};

export const isTimestamp = ({ start, end }: TempFragment) =>
  start >= 0 && end < 0;

export function isTempFragEqual(
  a: TempFragment | null,
  b: TempFragment | null,
): boolean {
  if (a === null && b === null) return true;
  return a !== null && b !== null && a.start === b.start && a.end === b.end;
}

/** parse temporal fragment from hash */
export function parseTempFrag(hash: string | undefined): TempFragment | null {
  if (!hash) return null;
  const query = new URLSearchParams(hash.replace(/^#+/, ""));
  const tempFragQuery = query.get("t");
  if (!tempFragQuery) return null;
  const match = tempFragQuery.match(tempFragPattern.main);
  if (!match) return null;
  const { start, end } = match.groups!;
  return getTimeSpan(start, end);
}

export interface TempFragment {
  /** -1 if not explicitly specified */
  end: number;
  /** -1 if not explicitly specified */
  start: number;
  /**
   * raw value of key "t" in #t={value}
   */
  // raw: string;
}

const getTimeSpan = (
  start: string | undefined,
  end: string | undefined,
): Omit<TempFragment, "raw"> | null => {
  // start may be an empty string
  const startRaw = start ? start : null;
  const endRaw = end ?? null;

  let startTime, endTime;
  if (startRaw && endRaw) {
    startTime = convertTime(startRaw);
    // use t=1,e to specify time range from 1->end
    endTime = endRaw === "e" ? Infinity : convertTime(endRaw);
  } else if (startRaw) {
    // use t=1 to specify timestamp
    startTime = convertTime(startRaw);
    endTime = -1;
  } else if (endRaw) {
    // use t=,1 to specify time range from 0->1
    startTime = -1;
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

function convertTime(input: string): number | null {
  const match = input.match(tempFragPattern.npt_time);
  if (!match) {
    return null;
  }

  const rawTime = match[1];
  const secMatch = rawTime.match(tempFragPattern.npt_sec);
  if (secMatch) {
    return Number(secMatch[0]);
  }

  const mmssMatch = rawTime.match(tempFragPattern.npt_mmss);
  if (mmssMatch) {
    const { mm, ss } = mmssMatch.groups!;
    return Number(mm) * 60 + Number(ss);
  }

  const hhmmssMatch = rawTime.match(tempFragPattern.npt_hhmmss);
  if (hhmmssMatch) {
    const { hh, mm, ss } = hhmmssMatch.groups!;
    return Number(hh) * 60 * 60 + Number(mm) * 60 + Number(ss);
  }

  return null;
}
