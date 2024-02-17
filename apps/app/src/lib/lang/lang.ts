/* eslint-disable @typescript-eslint/naming-convention */

import iso from "iso-639-1";
import { groupBy } from "../group-by";

export const langExtra = {
  "de-AT": "Österreichisches Deutsch",
  "de-CH": "Schweizer Hochdeutsch",
  "en-AU": "Australian English",
  "en-CA": "Canadian English",
  "en-GB": "British English",
  "en-US": "American English",
  "es-ES": "español de España",
  "es-MX": "español de México",
  "fr-CA": "français canadien",
  "fr-CH": "français suisse",
  "nl-BE": "Vlaams",
  "pt-BR": "português do Brasil",
  "pt-PT": "português europeu",
  "ro-MD": "moldovenească",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
} as Record<string, string>;

export const getGroupedLangExtra = () =>
  groupBy(Object.entries(langExtra), ([k]) => k.split("-")[0]);

export const countryMap = {
  "zh-Hans": ["CN", "SG", "MY"],
  "zh-Hant": ["TW", "HK", "MO"],
} as Record<string, string[]>;

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export function langCodeToLabel(code: string): string {
  const tags = code.split("-");
  const lang = tags[0].toLowerCase();
  if (tags.length === 1) {
    return iso.getNativeName(lang);
  }
  const langCountry = tags.slice(0, 2).join("-");
  return langExtra[langCountry] || `${iso.getNativeName(tags[0])} (${code})`;
}

function detectChs(subtag: string) {
  if (
    subtag.toLowerCase() === "hans" ||
    countryMap["zh-Hans"].includes(subtag.toUpperCase())
  )
    return "zh-Hans";
  if (
    subtag.toLowerCase() === "hant" ||
    countryMap["zh-Hant"].includes(subtag.toUpperCase())
  )
    return "zh-Hant";
  return "zh";
}

export function vaildate(code: string) {
  const lang = code.split("-")[0].toLowerCase();
  return iso.validate(lang);
}

export function format(code: string) {
  if (!vaildate(code)) return null;
  const tags = code.split("-");
  const lang = tags[0].toLowerCase();
  if (tags.length === 1) return lang;
  const subtag = tags[1];
  if (lang === "zh") return detectChs(subtag);
  return (
    langExtra[`${lang}-${subtag.toUpperCase()}`] ??
    `${lang}-${tags.slice(1).join("-")}`
  );
}
