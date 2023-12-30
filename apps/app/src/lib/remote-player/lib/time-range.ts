export type SerilizableTimeRanges = {
  type: "TimeRanges";
  value: [number, number][];
};
export function toSerilizableTimeRange(
  range: TimeRanges,
): SerilizableTimeRanges {
  const result: [number, number][] = [];
  for (let i = 0; i < range.length; i++) {
    result.push([range.start(i), range.end(i)]);
  }
  return {
    type: "TimeRanges",
    value: result,
  };
}
export function isSerilizableTimeRange(
  value: unknown,
): value is SerilizableTimeRanges {
  return (value as Record<string, unknown>).type === "TimeRanges";
}
export class DummyTimeRanges implements TimeRanges {
  constructor(private ranges: [number, number][]) {}
  get length() {
    return this.ranges.length;
  }
  start(index: number) {
    return this.ranges[index][0];
  }
  end(index: number) {
    return this.ranges[index][1];
  }
}
