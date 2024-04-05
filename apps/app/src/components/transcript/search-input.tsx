import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SearchInput({
  onSubmit,
  onExit,
  noResult = false,
}: {
  onSubmit: (query: string, changed: boolean, target: "next" | "prev") => void;
  onExit?: () => void;
  noResult?: boolean;
}) {
  const [search, setSearch] = useState("");
  const prevSubmitRef = useRef<string>("");
  function handleExit(evt: React.KeyboardEvent | React.MouseEvent) {
    evt.preventDefault();
    setSearch("");
    prevSubmitRef.current = "";
    onExit?.();
  }

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="document-search-container">
      <form
        className={cn("document-search")}
        onSubmit={(evt) => {
          evt.preventDefault();
          onSubmit(search, prevSubmitRef.current !== search, "next");
          prevSubmitRef.current = search;
        }}
      >
        <input
          type="text"
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(evt) => {
            if (evt.key === "Escape") handleExit(evt);
          }}
          placeholder="Search transcript"
          className={cn(
            "document-search keep-ob",
            noResult &&
              prevSubmitRef.current &&
              prevSubmitRef.current === search &&
              "bg-[rgba(var(--background-modifier-error-rgb),0.2)]",
          )}
        />
        <div className="document-search-buttons">
          <button
            type="button"
            className="document-search-button keep-ob"
            onClick={(evt) => {
              evt.preventDefault();
              onSubmit(search, prevSubmitRef.current !== search, "prev");
              prevSubmitRef.current = search;
            }}
          >
            Prev
          </button>
          <button type="submit" className="document-search-button keep-ob">
            Next
          </button>
        </div>
        <span
          className="document-search-close-button"
          tabIndex={0}
          role="button"
          onKeyDown={(evt) => {
            if (evt.key === "Enter") handleExit(evt);
          }}
          onClick={handleExit}
        />
      </form>
    </div>
  );
}
