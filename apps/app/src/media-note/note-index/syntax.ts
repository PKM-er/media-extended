import type { Root, Link, ListItem } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit, EXIT } from "unist-util-visit";

export function parseMarkdown(text: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(text);
}

export function extractFirstMarkdownLink(text: string, tree: Root) {
  let link: Link | undefined;
  visit(tree, "link", (node: Link) => {
    link = node;
    return EXIT;
  });
  if (!link) return null;
  const displayTextStart = link.children.first()?.position?.start.offset,
    displayTextEnd = link.children.last()?.position?.end.offset;
  return {
    display:
      displayTextStart && displayTextEnd
        ? text.slice(displayTextStart, displayTextEnd)
        : "",
    url: link.url,
    title: link.title,
  };
}

/**
 * @returns raw markdown text
 */
export function extractListItemMainText(text: string, tree: Root) {
  let mainText = "";
  visit(tree, "listItem", (node: ListItem) => {
    const start = node.children.first()?.position?.start.offset,
      end = node.children.last()?.position?.end.offset;
    if (start && end) {
      mainText = text.slice(start, end);
    }
    return EXIT;
  });
  return mainText;
}

// function _extractFirstMarkdownLink(
//   input: string,
// ): { display: string; link: string } | null {
//   let state: "start" | "display" | "link" | "url" = "start";
//   let display = "";
//   let link = "";
//   let escape = false;

//   for (const char of input) {
//     switch (state) {
//       case "start":
//         if (char === "[") {
//           state = "display";
//         }
//         break;
//       case "display":
//         if (char === "\\" && !escape) {
//           escape = true;
//         } else if (char === "]" && !escape) {
//           state = "link";
//         } else {
//           display += char;
//           escape = false;
//         }
//         break;
//       case "link":
//         if (char === "(") {
//           state = "url";
//         } else {
//           // Reset if not a valid link
//           state = "start";
//           display = "";
//           link = "";
//         }
//         break;
//       case "url":
//         if (char === "\\" && !escape) {
//           escape = true;
//         } else if (char === ")" && !escape) {
//           if (!/\s/.test(link.trim()))
//             return { display: display.trim(), link: link.trim() }; // Return the first valid link
//           // reset if not a valid link
//           state = "start";
//           display = "";
//           link = "";
//         } else {
//           link += char;
//           escape = false;
//         }
//         break;
//     }
//   }

//   return null; // No valid link found
// }
