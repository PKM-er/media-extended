export interface LinkEvent {
  onExternalLinkClick(url: string, newLeaf: boolean, fallback: () => void): any;
  onInternalLinkClick(
    linktext: string,
    sourcePath: string,
    newLeaf: boolean,
    fallback: () => void
  ): any;
}
