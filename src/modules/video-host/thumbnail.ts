import https from "https";

export async function fetchVimeoThumbnail(
  url: string | URL,
): Promise<string | null> {
  const api = new URL("https://vimeo.com/api/oembed.json");
  if (typeof url === "string") api.searchParams.append("url", url);
  else api.searchParams.append("url", url.href);

  return fetch(api.href)
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      else return response.json();
    })
    .then((data) => {
      return (data.thumbnail_url as string) ?? null;
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
}

export async function fetchBiliThumbnail(aid: number): Promise<string | null>;
export async function fetchBiliThumbnail(bvid: string): Promise<string | null>;
export async function fetchBiliThumbnail(
  id: string | number,
): Promise<string | null> {
  const api = new URL("http://api.bilibili.com/x/web-interface/view");
  if (typeof id === "string") api.searchParams.append("bvid", id);
  else api.searchParams.append("aid", "av" + id);

  const options = {
    method: "GET",
    hostname: api.hostname,
    port: null,
    path: api.pathname + api.search,
    headers: {
      Origin: "https://www.bilibili.com",
      Referer: "https://www.bilibili.com",
      "Content-Length": "0",
    },
  };

  const request = httpRequest(options);

  return request
    .then((json) => {
      if (json.code !== 0) throw new Error(`${json.code}: ${json.message}`);
      else {
        return (json.data.pic as string) ?? null;
      }
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
}

function httpRequest(
  options: string | https.RequestOptions | URL,
  postData?: any,
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    var req = https.request(options, (res) => {
      // reject on bad status
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error("statusCode=" + res.statusCode));
      }
      // cumulate data
      const body: any[] = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      // resolve on end
      res.on("end", function () {
        try {
          const obj: any = JSON.parse(Buffer.concat(body).toString());
          resolve(obj);
        } catch (e) {
          reject(e);
        }
      });
    });
    // reject on request error
    req.on("error", function (err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });
    if (postData) {
      req.write(postData);
    }
    // IMPORTANT
    req.end();
  });
}
