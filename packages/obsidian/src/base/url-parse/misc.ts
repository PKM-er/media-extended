export const getBasename = (filename: string) =>
    filename.split(".").slice(0, -1).join("."),
  getFilename = (pathname: string) => decodeURI(pathname).split("/").pop();
