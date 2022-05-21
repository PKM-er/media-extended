import URLParse from "url-parse";

export const getBasename = (filename: string) =>
    filename.split(".").slice(0, -1).join("."),
  getFilename = (pathname: string) => decodeURI(pathname).split("/").pop();

export const stripHash = (url: string): [url: string, hash: string] => {
  const { hash } = URLParse(url)!;
  url = hash.length > 0 ? url.slice(0, -hash.length) : url;
  return [url, hash];
};

export function empty(this: HTMLElement) {
  while (this.firstChild) this.removeChild(this.firstChild);
}
