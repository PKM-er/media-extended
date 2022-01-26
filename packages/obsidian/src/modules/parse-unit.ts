const KEYWORD = [
  "auto",
  "revert",
  "unset",
  "inherit",
  "initial",
  "max-content",
  "min-content",
  "fit-content",
  "-webkit-fill-available",
];

export const isCssValue = (key: string | number): boolean => {
  return cssUnitRegex.test(parseUnit(key)[1]);
};

export function parseUnit(key: string | number, out: "onlyValue"): number;
export function parseUnit(key: string | number, out: "onlyUnit"): string;
export function parseUnit(
  key: string | number,
): [value: number | string, unit: string];
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function parseUnit(
  key: string | number,
  out?: "onlyValue" | "onlyUnit",
): string | number | [value: number | string, unit: string] {
  if (typeof key === "number") {
    switch (out) {
      case "onlyValue":
        return key;
      case "onlyUnit":
        return "";
      default:
        return [key, ""];
    }
  }
  if (KEYWORD.includes(key)) {
    return [key, ""];
  }

  key = String(key);

  const num = parseFloat(key);
  const unit = key.match(/[\d.\-\+]*\s*(.*)/)![1];

  switch (out) {
    case "onlyValue":
      return num;
    case "onlyUnit":
      return unit;
    default:
      return [num, unit];
  }
}

/**
 * LINK_TO: https://developer.mozilla.org/zh-CN/docs/Learn/CSS/Building_blocks/Values_and_units#%E9%95%BF%E5%BA%A6
 */

// https://jex.im/regulex/#!flags=&re=(v%5Bh%7Cw%7Cmin%7Cmax%5D%7Cp%5Bc%7Ct%7Cx%5D%7C%5Bre%7Ce%7Cc%7Cm%5Dm%7C%5Bl%7Cc%5Dh%7C%25%7Cin%7CQ%7Cex)
export const cssUnit = "(v[h|w|min|max]|p[c|t|x]|[re|e|c|m]m|[l|c]h|%|in|Q|ex)";

export const cssUnitRegex = new RegExp(cssUnit);
