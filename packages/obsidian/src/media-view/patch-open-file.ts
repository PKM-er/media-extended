import "obsidian";

import MediaExtended from "@plugin";
import { around } from "monkey-around";
import { WorkspaceLeaf } from "obsidian";

const PatchOpenFile = (plugin: MediaExtended) => {
  plugin.register(
    around(WorkspaceLeaf.prototype, {
      openFile: (next) =>
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        function (this: WorkspaceLeaf, file, state, ...args) {
          if (!state) {
            state = { eState: { fromLink: true } };
            state.eState.fromLink = true;
          } else if (!state.eState) {
            state.eState = { fromLink: true };
          } else {
            state.eState.fromLink = true;
          }
          return next.call(this, file, state, ...args);
        },
    }),
  );
};
export default PatchOpenFile;
