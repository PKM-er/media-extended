import type {
  CaptionsFileFormat,
  ParsedCaptionsResult,
  VTTCue,
} from "media-captions";
import { parseText } from "media-captions";
import MiniSearch from "minisearch";
import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import type MxPlugin from "@/mx-main";
import type { MxSettings } from "@/settings/def";
import "./style.less";

interface TranscriptViewState {
  showSearchBox: boolean;
  toggleSearchBox(val?: boolean): void;
  captions: {
    _minisearch: MiniSearch<VTTCue> | null;
    result: ParsedCaptionsResult;
    locales: string[];
  } | null;
  setCaptions(
    result: {
      result: ParsedCaptionsResult;
      locales: string[];
    } | null,
  ): void;
  // parseLocalCaptions(file: TFile, vault: Vault): Promise<void>;
  parseCaptions(
    content: string,
    opts: { type: CaptionsFileFormat; locales: string[] },
  ): Promise<void>;
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
    showSearchBox: false,
    toggleSearchBox(val) {
      if (typeof val === "boolean") {
        set({ showSearchBox: val });
      } else {
        set(({ showSearchBox: prev }) => ({ showSearchBox: !prev }));
      }
    },
    captions: null,
    async parseCaptions(content, { type, locales }) {
      const result = await parseText(content, { type });
      this.setCaptions({ locales, result });
    },
    setCaptions(info) {
      if (!info) {
        set({ captions: null });
        return;
      }
      const { locales, result } = info;
      get().captions?._minisearch?.removeAll();
      const segmenter = getSegmenter(...info.locales);
      const minisearch = new MiniSearch<VTTCue>({
        idField: "id",
        fields: ["text"],
        tokenize: segmenter
          ? (text) =>
              [...segmenter.segment(text)]
                .filter((s) => s.isWordLike)
                .map((seg) => seg.segment)
          : undefined,
      });
      minisearch.addAll(result.cues);
      set({ captions: { _minisearch: minisearch, locales, result } });
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
