import axios from "axios";

const fetchBiliPoster = async (
  ...args: [aid: number] | [bvid: string]
): Promise<string | null> => {
  const [id] = args;

  const api = new URL("http://api.bilibili.com/x/web-interface/view");
  if (typeof id === "string") api.searchParams.append("bvid", id);
  else api.searchParams.append("aid", "av" + id);

  return axios
    .get(api.toString(), {
      headers: {
        Origin: "https://www.bilibili.com",
        Referer: "https://www.bilibili.com",
        "Content-Length": "0",
      },
    })
    .then((response) => {
      const json = response.data;
      if (json.code !== 0) throw new Error(`${json.code}: ${json.message}`);
      else {
        return (json.data.pic as string) ?? null;
      }
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
};

export default fetchBiliPoster;
