import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchBiliMetaName } from "mx-player";
import { RootState } from "mx-store";
import { requestUrl } from "obsidian";

const aid = /^av(\d+)$/i,
  bid = /^(BV[A-Za-z0-9]+)$/;
const parseVid = (
  videoId: string,
): [type: "aid" | "bvid", id: string] | null => {
  let match;
  if ((match = videoId.match(aid))) {
    return ["aid", match[1]];
  } else if ((match = videoId.match(bid))) {
    return ["bvid", match[1]];
  } else {
    return null;
  }
};
/**
 * 获取视频详细信息web端
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/info.md#获取视频详细信息web端
 */
const fetchVideoDetails = async (videoId: string) => {
  const parsedId = parseVid(videoId);
  if (!parsedId) {
    throw new Error("Failed to fetch: invaild video id: " + videoId);
  }
  let url = new URL("http://api.bilibili.com/x/web-interface/view");
  url.searchParams.append(...parsedId);
  const { status, json } = await requestUrl({
    url: url.toString(),
    method: "GET",
  });
  if (status !== 200) {
    throw new Error(`Failed to fetch: (${status}) `);
  }
  const { code, message, data } = json;
  if (code !== 0) {
    let statusText: string;
    switch (code) {
      case -400:
        statusText = "请求错误";
        break;
      case -403:
        statusText = "权限不足";
        break;
      case -404:
        statusText = "无视频";
        break;
      case 62002:
        statusText = "稿件不可见";
        break;
      case 62004:
        statusText = "稿件审核中";
        break;
      default:
        statusText = "未知错误";
        break;
    }
    throw new Error(
      `Failed to fetch: internal (${code}:${message}) ${statusText}`,
    );
  }
  return data;
};
/**
 * 查询视频分p列表
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/info.md#查询视频分p列表--avidbvid转cid
 */
const fetchPageList = async (videoId: string) => {
  const parsedId = parseVid(videoId);
  if (!parsedId) {
    throw new Error("Failed to fetch: invaild video id: " + videoId);
  }
  let url = new URL("http://api.bilibili.com/x/player/pagelist");
  url.searchParams.append(...parsedId);
  const { status, json } = await requestUrl({
    url: url.toString(),
    method: "GET",
  });
  if (status !== 200) {
    throw new Error(`Failed to fetch: (${status}) `);
  }
  const { code, message, data } = json;
  if (code !== 0) {
    let statusText: string;
    switch (code) {
      case -400:
        statusText = "请求错误";
        break;
      case -404:
        statusText = "无视频";
        break;
      default:
        statusText = "未知错误";
        break;
    }
    throw new Error(
      `Failed to fetch: internal (${code}:${message}) ${statusText}`,
    );
  }
  return data;
};
export const fetchBiliMeta = createAsyncThunk<
  Record<"title", string>,
  string,
  { state: RootState }
>(fetchBiliMetaName, async (videoId, { dispatch }) => {
  const { title } = await fetchVideoDetails(videoId);
  return { title };
});
