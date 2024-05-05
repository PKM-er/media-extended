import type { VTTCue } from "media-captions";
import MiniSearch from "minisearch";
import { createContext, useContext } from "react";
// eslint-disable-next-line import/no-deprecated
import { createStore, useStore } from "zustand";
import type { ParsedTextTrack } from "@/info/track-info";
import type { TranscriptSource } from "@/info/transcript-info";
import { langCodeToLabel, vaildate } from "@/lib/lang/lang";
import type MxPlugin from "@/mx-main";
import type { MxSettings } from "@/settings/def";
import "./style.less";
import type { VTTContent, VTTCueWithId } from "../handle/type";

interface TranscriptViewState {
  showSearchBox: boolean;
  source: TranscriptSource | null;
  title: string | null;
  toggleSearchBox(val?: boolean): void;
  captions: {
    _minisearch: MiniSearch<VTTCue> | null;
    content: VTTContent;
    locales: string[];
  } | null;
  setCaptions(
    result: {
      track: ParsedTextTrack;
      locales: string[];
    } | null,
  ): void;
  search(
    query: string,
    options?: Partial<{ fuzzy: boolean; prefix: boolean }>,
  ): CueSearchResult[];
}

export interface CueSearchResult {
  matches: string[];
  score: number;
  queryTerms: string[];
  id: string;
}

export function createTranscriptViewStore() {
  const store = createStore<TranscriptViewState>((set, get, _store) => ({
    source: null,
    title: null,
    showSearchBox: false,
    toggleSearchBox(val) {
      if (typeof val === "boolean") {
        set({ showSearchBox: val });
      } else {
        set(({ showSearchBox: prev }) => ({ showSearchBox: !prev }));
      }
    },
    captions: null,
    setCaptions(info) {
      if (!info) {
        set({ captions: null, title: null });
        return;
      }
      const { track, locales } = info;
      const { metadata: meta, cues } = track.content;
      const label = meta.Label || track.label;
      const lang = meta.Language || track.language;
      let title = label || (vaildate(lang) ? langCodeToLabel(lang) : "");
      if (title && meta.Title) {
        title = meta.Title + " - " + title;
      }
      set({ title: title ?? null });
      get().captions?._minisearch?.removeAll();
      const segmenter = getSegmenter(...info.locales);
      const minisearch = new MiniSearch<VTTCueWithId>({
        idField: "id",
        fields: ["text"],
        tokenize: segmenter
          ? (text) =>
              [...segmenter.segment(text)]
                .filter((s) => s.isWordLike)
                .map((seg) => seg.segment)
          : undefined,
      });
      minisearch.addAll(cues);
      set({
        captions: { _minisearch: minisearch, locales, content: track.content },
      });
    },
    search(query, options) {
      const minisearch = get().captions?._minisearch;
      if (!minisearch) return [];
      const result = minisearch.search(query, options);
      return result.map((r) => ({
        matches: Object.keys(r.match),
        queryTerms: r.queryTerms,
        score: r.score,
        id: r.id,
      }));
    },
  }));
  return store;
}

function getSegmenter(...locales: string[]) {
  // feature detect for window.Intl and Intl.Segmenter
  if (
    typeof window.Intl === "undefined" ||
    typeof Intl.Segmenter === "undefined"
  ) {
    return null;
  }
  return new Intl.Segmenter(locales, { granularity: "word" });
}

export type TranscriptViewStoreApi = ReturnType<
  typeof createTranscriptViewStore
>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TranscriptViewContext = createContext<{
  store: TranscriptViewStoreApi;
  plugin: MxPlugin;
}>(null as any);

export function useTranscriptViewStore<U>(
  selector: (state: TranscriptViewState) => U,
): U {
  const { store } = useContext(TranscriptViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(store, selector);
}

export function useSettings<U>(selector: (state: MxSettings) => U): U {
  const {
    plugin: { settings },
  } = useContext(TranscriptViewContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(settings, selector);
}

export function useSearch() {
  const minisearchReady = useTranscriptViewStore(
    (s) => !!s.captions?._minisearch,
  );
  const search = useTranscriptViewStore((s) => s.search);
  return minisearchReady ? search : null;
}

export function useSearchBox() {
  const showSearchBox = useTranscriptViewStore((s) => s.showSearchBox);
  const toggleSearchBox = useTranscriptViewStore((s) => s.toggleSearchBox);
  return [showSearchBox, toggleSearchBox] as const;
}
