import type { Menu } from "obsidian";

declare module "obsidian" {
  interface MenuItem {
    setSubmenu(): Menu;
  }
  interface Menu {
    addSections(sections: string[]): void;
    setParentElement(parent: HTMLElement): this;
  }
}

export function showAtButton(evt: Event | HTMLElement, menu: Menu) {
  const target = ("target" in evt ? evt.target : evt) as HTMLElement;
  if (!target.instanceOf?.(HTMLElement)) return;
  const rect = target.getBoundingClientRect();
  return menu.setParentElement(target).showAtPosition(
    {
      x: rect.x,
      y: rect.bottom,
      width: rect.width,
      overlap: true,
      left: true,
    },
    target.doc,
  );
}
