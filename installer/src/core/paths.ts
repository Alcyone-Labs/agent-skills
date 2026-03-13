import { homedir } from "os";
import { join, resolve } from "path";
import {
  CLIENT_CONFIGS,
  type CompatibilityClient,
  type InstallScope,
  type InstallationLayout,
} from "./types.js";

export function expandHome(path: string): string {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }

  return path;
}

export function resolveInstallationLayout(
  scope: InstallScope,
  cwd = process.cwd(),
): InstallationLayout {
  const agentsRoot =
    scope === "global" ? join(homedir(), ".agents") : resolve(cwd, ".agents");

  return {
    scope,
    agentsRoot,
    skillsDir: join(agentsRoot, "skills"),
    binDir: join(agentsRoot, "bin"),
  };
}

export function resolveClientSkillDirectory(
  client: CompatibilityClient,
  scope: InstallScope,
  cwd = process.cwd(),
): string {
  const config = CLIENT_CONFIGS[client];
  const rawPath = scope === "global" ? config.globalSkillDir : config.localSkillDir;

  if (scope === "global") {
    return resolve(expandHome(rawPath));
  }

  return resolve(cwd, rawPath);
}

export function resolveCommandAdapterDirectory(
  client: CompatibilityClient,
  scope: InstallScope,
  cwd = process.cwd(),
): string | null {
  const config = CLIENT_CONFIGS[client];
  if (!config.commandAdapter) {
    return null;
  }

  const rawPath =
    scope === "global"
      ? config.commandAdapter.globalDir
      : config.commandAdapter.localDir;

  if (scope === "global") {
    return resolve(expandHome(rawPath));
  }

  return resolve(cwd, rawPath);
}
