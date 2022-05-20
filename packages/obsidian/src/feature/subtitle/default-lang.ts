export const isDefaultLang = (languageCode: string) =>
  (localStorage.language ?? "en") === languageCode;
