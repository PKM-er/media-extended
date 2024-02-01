import { useMediaState, useChapterTitle } from "@vidstack/react";

export function Title() {
  const $title = useMediaState("title").trim();
  const $chapter = useChapterTitle().trim();
  if (!$title && !$chapter) return null;
  return (
    <span className="inline-block flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-2 text-sm font-medium text-white/70">
      <span className="mr-1">|</span>
      <span>{$chapter || $title}</span>
    </span>
  );
}
