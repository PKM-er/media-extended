import { Notice, htmlToMarkdown } from "obsidian";
import { forwardRef, useMemo } from "react";
import { formatDuration } from "@/lib/hash/format";
import { cn } from "@/lib/utils";
import type { VTTCueWithId } from "@/transcript/handle/type";
import { CopyIcon, PlayIcon } from "../icon";

export interface CueLineProps extends React.HTMLProps<HTMLDivElement> {
  children: string;
  matches?: string[];
  time: number;
  actions: React.ReactNode;
}

export interface CueActionsProps {
  children: VTTCueWithId;
  onPlay?: (evt: React.MouseEvent | React.KeyboardEvent) => void;
}

export function CueActions({ children: cue, onPlay }: CueActionsProps) {
  async function handleCopy() {
    const { text, startTime } = cue;
    const mainText = htmlToMarkdown(`<pre>${text}</pre>`);
    const timestamp = `\\[${formatDuration(startTime)}\\]`;
    await navigator.clipboard.writeText(`${timestamp} ${mainText}`);
    new Notice("Copied to clipboard");
  }
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCopy}
        aria-label="Copy markdown"
        onKeyDown={(evt) => {
          if (evt.key === "Enter") handleCopy();
        }}
      >
        <CopyIcon className="w-3 h-3" />
      </div>
      {onPlay && (
        <div
          role="button"
          tabIndex={0}
          onClick={onPlay}
          onKeyDown={(evt) => {
            if (evt.key === "Enter") onPlay(evt);
          }}
        >
          <PlayIcon className="w-3 h-3" />
        </div>
      )}
    </>
  );
}

export const CueLine = forwardRef<HTMLDivElement, CueLineProps>(
  function CueLine(
    { children: content, matches, time, className, actions, ...props },
    ref,
  ) {
    const highlightedText = matches
      ? splitByKeywords(content, matches)
      : ((content: string) => {
          const segments: React.ReactNode[] = [];
          insertLineBreaks(content, segments, 0);
          return segments;
        })(content);
    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          "grid items-center group hover:bg-accent pr-2 py-1 mr-1 transition-all rounded-md hover:delay-100",
          className,
          matches?.length && "bg-text-highlight bg-opacity-10",
        )}
      >
        <div className="text-xs font-medium select-none text-gray-400 group-hover:text-black group-hover:pl-1 transition-all flex items-center group-hover:delay-100">
          <div className="flex cursor-pointer items-center">
            <Timestamp>{time}</Timestamp>
            <div className="ml-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity group-hover:duration-300 group-hover:delay-100">
              {actions}
            </div>
          </div>
        </div>
        <p className="select-text">{highlightedText}</p>
      </div>
    );
  },
);

function escapeStringRegexp(content: string) {
  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return content.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

function splitByKeywords(content: string, keywords: string[]) {
  const regexp = new RegExp(
    keywords
      .map((w) => w.trim())
      .filter(Boolean)
      .map(escapeStringRegexp)
      .join("|"),
    "gi",
  );
  const segments = [...content.matchAll(regexp)].reduceRight<React.ReactNode[]>(
    (segments, match) => {
      const idx = match.index!,
        matchedWord = match[0];
      const after = content.slice(idx + matchedWord.length);
      insertLineBreaks(after, segments, idx);
      segments.push(<mark key={idx}>{matchedWord}</mark>);
      content = content.slice(0, idx);
      return segments;
    },
    [],
  );
  segments.push(content);
  segments.reverse();
  return segments;
}

function Timestamp({ children: time }: { children: number }) {
  const formattedTime = useMemo(() => formatDuration(time), [time]);
  return <span>{formattedTime}</span>;
}

function insertLineBreaks(
  content: string,
  segments: React.ReactNode[],
  idx: number,
): void {
  if (content.includes("\n")) {
    content.split("\n").forEach((line, i) => {
      if (i === 0) segments.push(line);
      else segments.push(<br key={`${idx}seg-${i}`} />, line);
    });
  } else {
    segments.push(content);
  }
}
