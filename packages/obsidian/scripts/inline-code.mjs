/* eslint-env node */
import esbuild from "esbuild";
import path from "path";

/**
 *
 * @param {string} message
 * @returns {import("esbuild").Plugin}
 */
const onEnd = (message) => ({
  name: "on-end-message",
  setup: (build) => {
    build.onEnd(() => console.log(message));
  },
});

/**
 *
 * @param {Partial<import("esbuild").BuildOptions>} extraConfig
 * @returns {import("esbuild").Plugin}
 */
const inlineCodePlugin = (extraConfig) => ({
  name: "inline-code",
  setup: (build) => {
    const codePrefixPattern = new RegExp(`^inline:`),
      namespace = "inline";
    build.onResolve(
      { filter: codePrefixPattern },
      ({ path: workerPath, resolveDir }) => {
        return {
          path: path.resolve(
            resolveDir,
            workerPath.replace(codePrefixPattern, ""),
          ),
          namespace,
        };
      },
    );
    build.onLoad({ filter: /.*/, namespace }, async ({ path: workerPath }) => {
      let contents;
      if (workerPath.startsWith("__")) contents = inlineWorkerCode;
      else {
        contents = await buildWorker(workerPath, extraConfig);
      }
      return { contents, loader: "text" };
    });
    build.onEnd(() => console.log("inline code built"));
  },
});
export default inlineCodePlugin;

const buildWorker = async (workerPath, extraConfig) => {
  const scriptName = path.basename(workerPath).replace(/\.[^.]*$/, ".js");

  if (extraConfig) {
    delete extraConfig.entryPoints;
    delete extraConfig.outfile;
    delete extraConfig.outdir;
  }

  const result = await esbuild.build({
    entryPoints: [workerPath],
    write: false, // write in memory
    outfile: scriptName,
    bundle: true,
    minify: true,
    target: "es2017",
    format: "iife",
    ...extraConfig,
    plugins: [
      /* onEnd(`${scriptName} built`) */
    ],
  });

  return new TextDecoder("utf-8").decode(result.outputFiles[0].contents);
};
