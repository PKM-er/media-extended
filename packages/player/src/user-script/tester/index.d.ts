import { UserScriptMeta } from "../parser";

export function testScript(
  url: string,
  script: { meta: UserScriptMeta },
): boolean;
