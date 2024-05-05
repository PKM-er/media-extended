import { assertNever } from "assert-never";
import { useMemo, useRef, useState } from "react";
import type { CueSearchResult } from "@/transcript/view/context";
import {
  usePlay,
  useSearch,
  useSearchBox,
  useTranscriptViewStore,
} from "@/transcript/view/context";
import type { CueLineListRef } from "./cue-line-list";
import { CueLineList } from "./cue-line-list";
import { SearchInput } from "./search-input";

export default function Lines() {
  const cues = useTranscriptViewStore((s) => s.textTrack?.content.cues || []);
  const activeCueIDs = useTranscriptViewStore((s) => s.activeCueIDs);
  const play = usePlay();
  const cueHash = useMemo(
    () => new Map(cues.map((cue, index) => [cue.id, { cue, index }])),
    [cues],
  );

  const [showSearch, toggleSearch] = useSearchBox();

  const [searchResult, setSearchResult] = useState<CueSearchResult[]>([]);
  const currResultIdxRef = useRef<number>(-1);

  const search = useSearch();
  const cueListRef = useRef<CueLineListRef>(null);

  return (
    <div className="h-full">
      {search && showSearch && (
        <SearchInput
          noResult={searchResult.length === 0}
          onSubmit={(query, changed, target) => {
            if (!changed) {
              if (currResultIdxRef.current < 0 || searchResult.length === 0)
                return;
              if (target === "next") {
                if (currResultIdxRef.current < searchResult.length - 1) {
                  currResultIdxRef.current += 1;
                } else {
                  currResultIdxRef.current = 0;
                }
              } else if (target === "prev") {
                if (currResultIdxRef.current > 0) {
                  currResultIdxRef.current -= 1;
                } else {
                  currResultIdxRef.current = searchResult.length - 1;
                }
              } else {
                assertNever(target);
              }
              cueListRef.current?.scrollToIndex(
                cueHash.get(searchResult[currResultIdxRef.current].id)?.index ??
                  -1,
              );
              return;
            }
            const result = search(query.trim(), { prefix: true, fuzzy: true });
            if (result.length === 0) {
              setSearchResult([]);
              return;
            }
            // exact match, sort by position
            const { top: topMatches, alt: altMatches } = result.reduce<
              Record<"top" | "alt", CueSearchResult[]>
            >(
              (out, r, _i, arr) => {
                if (r.queryTerms.length >= arr[0].queryTerms.length) {
                  out.top.push(r);
                } else {
                  out.alt.push(r);
                }
                return out;
              },
              { top: [], alt: [] },
            );
            const [{ score: topScore }, b] = topMatches;
            if (b && topScore - b.score < 10) {
              topMatches.sort((a, b) => {
                const aIdx = cueHash.get(a.id)?.index ?? -1;
                const bIdx = cueHash.get(b.id)?.index ?? -1;
                return aIdx - bIdx;
              });
            }
            const firstMatch = topMatches[0].id;
            const { index } = cueHash.get(firstMatch) ?? {};
            if (typeof index !== "number") return;
            setSearchResult([...topMatches, ...altMatches]);
            cueListRef.current?.scrollToIndex(index);
            currResultIdxRef.current = 0;
          }}
          onExit={() => {
            toggleSearch(false);
            setSearchResult([]);
          }}
        />
      )}
      <CueLineList
        className="p-[var(--file-margins)] pt-0"
        ref={cueListRef}
        onPlay={play}
        activeCueIDs={activeCueIDs}
        searchResult={searchResult}
      >
        {cues}
      </CueLineList>
    </div>
  );
}
