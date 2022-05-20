import type { request } from "https";
import { Platform } from "obsidian";

export const getBiliRedirectUrl = (id: string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (Platform.isDesktopApp) {
      const req = (<typeof request>require("https").request)(
        { hostname: "b23.tv", port: 443, path: "/" + id, method: "GET" },
        (res) =>
          res.headers.location
            ? resolve(res.headers.location)
            : reject(new Error("No redirect location found")),
      );
      req.on("error", (err) => reject(err));
      req.end();
    } else
      reject(new TypeError("Calling node https in non-electron environment"));
  });
