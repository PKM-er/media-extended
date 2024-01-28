import { requestUrl } from "obsidian";
import {
  generateNonce,
  getYoutubeHeader,
  getYoutubeToken,
} from "../session/youtube";

export interface TranscriptConfig {
  lang?: string;
  country?: string;
}

export interface TranscriptResponse {
  title: string;
  lines: TranscriptLine[];
}

export interface TranscriptLine {
  text: string;
  duration: number;
  offset: number;
}

export async function getYoutubeTranscript(
  url: string,
  { country = "US", lang = "en" }: TranscriptConfig = {},
) {
  const token = await getYoutubeToken(url);
  const headers = getYoutubeHeader();
  const body = {
    context: {
      client: {
        hl: lang,
        gl: country,
        visitorData: token.visitorData,
        userAgent: headers["User-Agent"],
        clientName: "WEB",
        clientVersion: "2.20200925.01.00",
        osName: "Macintosh",
        osVersion: "10_15_4",
        browserName: "Chrome",
        browserVersion: "85.0f.4183.83",
        screenWidthPoints: 1440,
        screenHeightPoints: 770,
        screenPixelDensity: 2,
        utcOffsetMinutes: 120,
        userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
        connectionType: "CONN_CELLULAR_3G",
      },
      request: {
        sessionId: token.sessionId,
        internalExperimentFlags: [],
        consistencyTokenJars: [],
      },
      user: {},
      clientScreenNonce: generateNonce(),
      clickTracking: {
        clickTrackingParams: token.clickTrackingParams,
      },
    },
    params: token.serializedShareEntity,
  };
  const resp = await requestUrl({
    headers,
    url: `https://www.youtube.com/youtubei/v1/get_transcript?key=${token.apiKey}`,
    method: "POST",
    body: JSON.stringify(body),
  });
  const respPayload = resp.json;
  if (!respPayload.responseContext) {
    throw new Error("Failed to get transcript");
  }
  if (!respPayload.actions) {
    throw new Error("Transcript is disabled on this video");
  }
  const cueGroups = respPayload.actions[0].updateEngagementPanelAction.content
    .transcriptRenderer.body.transcriptBodyRenderer.cueGroups as any[];

  return {
    lines: cueGroups.map((c: any) => {
      const cue = c.transcriptCueGroupRenderer.cues[0].transcriptCueRenderer;
      return {
        text: cue.simpleText as string,
        duration: Number.parseInt(cue.durationMs, 10),
        offset: Number.parseInt(cue.startOffsetMs, 10),
      };
    }),
  };
}
