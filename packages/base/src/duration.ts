import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

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

export const secondToFragFormat = (_seconds: number | string) => {
  _seconds = +_seconds;
  if (Number.isNaN(_seconds)) return "NaN";

  const duration = dayjs.duration(+_seconds, "seconds");

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
    return "0";
  }
};

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
