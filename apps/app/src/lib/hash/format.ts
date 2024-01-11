import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { isTimestamp, type TempFragment } from "./temporal-frag";

dayjs.extend(duration);

const fillZero = (time: number, fractionDigits = 2) => {
  let main: string, frac: string | undefined;
  if (Number.isInteger(time)) {
    main = time.toString();
  } else {
    [main, frac] = time.toFixed(fractionDigits).split(".");
  }
  if (main.length === 1) main = "0" + main;
  return frac ? main + "." + frac : main;
};

export function updateHash(url: URL, tempFrag: TempFragment | null): void {
  const hashWithoutTempFrag = url.hash.replace(/t=[^&]+/, "");
  if (!tempFrag) {
    url.hash = hashWithoutTempFrag;
  } else {
    const tempFragString = toTempFragString(tempFrag);
    url.hash = `${hashWithoutTempFrag}&${tempFragString}`;
  }
}

export function toTempFrag(start: number, end: number): TempFragment {
  const startTime = Number.isNaN(start) ? -1 : start;
  const endTime = Number.isNaN(end) ? -1 : end;
  return { start: startTime, end: endTime };
}

export function toTempFragString(tempFrag: TempFragment): string | null {
  const { start, end } = tempFrag;
  const str = {
    get start() {
      return durationToTempFrag(start);
    },
    get end() {
      return durationToTempFrag(end);
    },
  };
  if (isTimestamp(tempFrag)) {
    return `t=${str.start}`;
  }
  if (start < 0 && end > 0) {
    if (!Number.isFinite(end)) return null;
    return `t=,${str.end}`;
  }
  // handle t=1,e or t=1,2
  if (start > 0 && end > 0) {
    return `t=${str.start},${str.end}`;
  }
  return null;
}

function durationToTempFrag(durationInSecond: number): string {
  if (Number.isNaN(durationInSecond) || durationInSecond < 0) {
    throw new Error("durationInSecond must be positive");
  }
  if (durationInSecond === Infinity) return "e";
  const duration = dayjs.duration(durationInSecond, "seconds");

  const hours = duration.hours(),
    minutes = duration.minutes(),
    seconds = duration.seconds() + duration.milliseconds() / 1e3;

  if (hours > 0) {
    return [hours, ...[minutes, seconds].map((num) => fillZero(num))].join(":");
  } else if (minutes > 0) {
    return [minutes, seconds].map((num) => fillZero(num)).join(":");
  } else if (seconds > 0) {
    return seconds.toFixed(2);
  } else {
    throw new Error("durationInSecond must be positive");
  }
}

// no fill zero
export const secondToDuration = (_seconds: number | string) => {
  _seconds = +_seconds;
  if (Number.isNaN(_seconds)) return "NaN";
  const duration = dayjs.duration(+_seconds, "seconds");

  const hours = duration.hours(),
    minutes = duration.minutes(),
    seconds = duration.seconds() + duration.milliseconds() / 1e3;

  if (hours > 0) {
    return [hours, ...[minutes, seconds].map((num) => fillZero(num, 0))].join(
      ":",
    );
  } else if (minutes > 0) {
    return [minutes, fillZero(seconds, 0)].join(":");
  } else {
    return "0:" + fillZero(seconds, 0);
  }
};
