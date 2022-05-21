import URLParse from "url-parse";

const addBasicAuthToURL = (
  url: string,
  username: string,
  password: string,
): string => {
  const { protocol, username: usr, password: pwd } = URLParse(url);
  if (usr && pwd) return url; // if explicitly set, do not override
  if (protocol !== "http:" && protocol !== "https:")
    throw new Error("mx: only http and https are supported for basic auth");
  username = encodeURIComponent(username);
  password = encodeURIComponent(password);
  return `${protocol}//${username}:${password}@${url.substring(
    `${protocol}//`.length,
  )}`;
};
export default addBasicAuthToURL;
