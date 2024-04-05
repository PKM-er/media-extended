import { useVirtualizer } from "@tanstack/react-virtual";
import type { VTTCue } from "media-captions";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CueSearchResult } from "@/transcript/context";
import { CueActions, CueLine } from "./cue-line";

export interface CueLineListRef {
  scrollToIndex: (index: number) => void;
}
export interface CueLineListProps {
  className?: string;
  searchResult?: CueSearchResult[];
  children: VTTCue[];
}
export const CueLineList = forwardRef<CueLineListRef, CueLineListProps>(
  function CueLineList({ children: cues, className, searchResult }, ref) {
    const parentRef = useRef<HTMLDivElement>(null);

    const searchMatchesHash = useMemo(
      () => new Map(searchResult?.map((r) => [r.id, r.matches]) ?? []),
      [searchResult],
    );

    const rowVirtualizer = useVirtualizer({
      count: cues.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 45,
      overscan: 20,
    });

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: (index) =>
          rowVirtualizer.scrollToIndex(index, {
            behavior: "auto",
            align: "start",
          }),
      }),
      [rowVirtualizer],
    );

    const items = rowVirtualizer.getVirtualItems();
    return (
      <ScrollArea className={cn(className, "h-full")} ref={parentRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
          className="w-full relative max-w-[var(--file-line-width)] mx-auto"
        >
          <div
            className="absolute w-full top-0 left-0"
            style={{
              transform: `translateY(${items[0]?.start ?? 0}px)`,
            }}
          >
            {items.map((virtualItem) => {
              const cue = cues[virtualItem.index];
              return (
                <CueLine
                  key={cue.id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  time={cue.startTime}
                  matches={searchMatchesHash?.get(cue.id)}
                  actions={<CueActions>{cue}</CueActions>}
                >
                  {cue.text}
                </CueLine>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    );
  },
);
