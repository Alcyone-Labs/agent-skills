import { homedir } from "os";
import { join, resolve } from "path";
import { CLIENT_CONFIGS, } from "./types.js";
export function expandHome(path) {
    if (path === "~") {
        return homedir();
    }
    if (path.startsWith("~/")) {
        return join(homedir(), path.slice(2));
    }
    return path;
}
export function resolveInstallationLayout(scope, cwd = process.cwd()) {
    const agentsRoot = scope === "global" ? join(homedir(), ".agents") : resolve(cwd, ".agents");
    return {
        scope,
        agentsRoot,
        skillsDir: join(agentsRoot, "skills"),
        binDir: join(agentsRoot, "bin"),
    };
}
export function resolveClientSkillDirectory(client, scope, cwd = process.cwd()) {
    const config = CLIENT_CONFIGS[client];
    const rawPath = scope === "global" ? config.globalSkillDir : config.localSkillDir;
    if (scope === "global") {
        return resolve(expandHome(rawPath));
    }
    return resolve(cwd, rawPath);
}
export function resolveCommandAdapterDirectory(client, scope, cwd = process.cwd()) {
    const config = CLIENT_CONFIGS[client];
    if (!config.commandAdapter) {
        return null;
    }
    const rawPath = scope === "global"
        ? config.commandAdapter.globalDir
        : config.commandAdapter.localDir;
    if (scope === "global") {
        return resolve(expandHome(rawPath));
    }
    return resolve(cwd, rawPath);
}
//# sourceMappingURL=paths.js.map