import { uniq } from "../uniq";
import { format } from "./lang";

export function getDefaultLang(
  list: { language?: string }[],
  defaultLangCode?: string,
) {
  const allLanguages = uniq(
    list.reduce<string[]>((langs, track) => {
      const lang = format(track.language);
      if (lang) langs.push(lang);
      return langs;
    }, []),
  );
  const defaultLang = !defaultLangCode
    ? allLanguages.filter((l) => !!l)[0]
    : allLanguages.find((code) => {
        // exact match
        if (!code) return;
        return code === defaultLangCode;
      }) ??
      allLanguages.find((code) => {
        // only language match
        if (!code) return;
        const lang = code.split("-")[0],
          defaultLang = defaultLangCode.split("-")[0];
        return lang === defaultLang;
      });
  return defaultLang;
}
