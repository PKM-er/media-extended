import type { Menu, MenuItem } from "obsidian";
import type { PlaylistItem } from "@/media-note/playlist/def";

interface PlaylistItemNode extends PlaylistItem {
  index: number;
  children: PlaylistItemNode[];
}

export function addItemsToMenu(
  menu: Menu,
  list: PlaylistItem[],
  onMenu: (
    item: Menu,
    node: PlaylistItemNode,
    submenuTriggerMap: SubmenuTriggerMap,
  ) => MenuItem | null,
) {
  const tree = buildTree(list);
  addNodesToMenu(menu, tree, onMenu, new Map());
}

type SubmenuTriggerMap = Map<number, MenuItem>;

// Recursive function to build the menu
function addNodesToMenu(
  menu: Menu,
  nodes: PlaylistItemNode[],
  onMenu: (
    menu: Menu,
    node: PlaylistItemNode,
    submenuTriggerMap: SubmenuTriggerMap,
  ) => MenuItem | null,
  submenuTriggerMap: SubmenuTriggerMap,
) {
  nodes.forEach((li) => {
    const submenuItem = onMenu(menu, li, submenuTriggerMap);
    if (submenuItem && li.children.length > 0) {
      submenuTriggerMap.set(li.index, submenuItem);
      const submenu = submenuItem.setSubmenu();
      addNodesToMenu(submenu, li.children, onMenu, submenuTriggerMap);
    }
  });
}
function buildTree(list: PlaylistItem[]): PlaylistItemNode[] {
  const roots: PlaylistItemNode[] = [];
  const nodes = list.map(
    (node, index): PlaylistItemNode => ({
      ...node,
      index,
      children: [],
    }),
  );

  nodes.forEach((node) => {
    if (node.parent >= 0) {
      // if you have dangling branches check that map[node.parentId] exists
      nodes[node.parent]?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
