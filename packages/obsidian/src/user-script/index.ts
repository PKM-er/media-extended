import type MediaExtended from "@plugin";
import { parseMeta, testScript, UserscriptMeta } from "mx-player";
import path, { join } from "path";

const folder = "mx-user-script";

type ScriptRecord = { meta: UserscriptMeta; js: string; css?: string };

export default class UserScriptManager {
  constructor(public plugin: MediaExtended) {
    this._initScriptPromise();
  }

  get scriptDir() {
    return join(app.vault.configDir, folder);
  }

  public scriptsLoaded!: boolean;
  public scripts!: Promise<Map<string, ScriptRecord>>;
  private _initScriptPromise(): void {
    this.scriptsLoaded = false;
    this.scripts = new Promise((resolve, reject) => {
      this.onLoaded = (scripts) => {
        this.scriptsLoaded = true;
        resolve(scripts);
      };
      this.onError = reject;
    });
  }
  private onLoaded!: (scripts: Map<string, ScriptRecord>) => void;
  private onError!: (reason: any) => void;

  /**
   * list all user script files, create script folder if not exists
   */
  private async listAllScriptFiles(): Promise<
    [jsPath: string, cssPath?: string][]
  > {
    if (!(await app.vault.adapter.exists(this.scriptDir))) {
      await app.vault.adapter.mkdir(this.scriptDir);
    }
    const { files } = await app.vault.adapter.list(this.scriptDir);
    return files
      .filter((f) => f.endsWith(".js"))
      .map((jsPath) => {
        const cssPath = jsPath.replace(/\.js$/, ".css");
        return files.includes(cssPath) ? [jsPath, cssPath] : [jsPath];
      });
  }

  public loadScripts() {
    if (this.scriptsLoaded) {
      this._initScriptPromise();
    }
    this._loadScripts().then(this.onLoaded, this.onError);
  }

  public getUserScriptFor(url: string) {
    return new Promise<ScriptRecord | null>((resolve, reject) => {
      let timeout = -1;
      if (!this.scriptsLoaded) {
        timeout = window.setTimeout(() => {
          reject("Timeout: user scripts not available");
        }, 5e3);
      }
      this.scripts.then((scripts) => {
        window.clearTimeout(timeout);
        for (const script of scripts.values()) {
          if (testScript(url, script)) {
            resolve(script);
          } else continue;
        }
        resolve(null);
      }, reject);
    });
  }

  private async _loadScripts() {
    const scripts = await this.listAllScriptFiles();
    const scriptLoadPromises = scripts.map<
        Promise<ScriptRecord & Record<"path", string>>
      >(([jsPath, cssPath]) => {
        const jsMeta = app.vault.adapter.read(jsPath).then((content) => {
            const result = parseMeta(content);
            if (!result)
              throw new Error("Failed to parse meta from script: " + jsPath);
            const { meta, script } = result;
            return { meta, js: script };
          }),
          css = cssPath ? app.vault.adapter.read(cssPath) : Promise.resolve();
        return Promise.allSettled([jsMeta, css]).then(([jsMeta, css]) => {
          if (jsMeta.status === "rejected") {
            throw jsMeta.reason;
          }
          if (css.status === "rejected") {
            console.error("Failed to load css for script" + jsPath, css.reason);
          }
          return css.status === "fulfilled" && css.value
            ? { path: jsPath, ...jsMeta.value, css: css.value }
            : { path: jsPath, ...jsMeta.value };
        });
      }),
      scriptLoadResult = await Promise.allSettled(scriptLoadPromises);
    let records = new Map<string, ScriptRecord>();
    for (const result of scriptLoadResult) {
      if (result.status === "fulfilled") {
        const { path, ...record } = result.value;
        records.set(path, record);
      } else {
        console.error("Failed to load script " + path, result.reason);
      }
    }
    if (records.size > 0 || scriptLoadResult.length === 0) {
      return records;
    } else {
      throw new Error(
        "None of the script is loaded sucessfully, check the log for more info",
      );
    }
  }
}
