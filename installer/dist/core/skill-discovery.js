import { access, readdir, stat } from "fs/promises";
import { join, resolve } from "path";
import { loadSkillManifest } from "./manifest.js";
import { resolveInstallationLayout } from "./paths.js";
async function directoryExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
async function isSkillDirectory(path) {
    const hasSkillMd = await directoryExists(join(path, "SKILL.md"));
    if (hasSkillMd) {
        return true;
    }
    return directoryExists(join(path, "Skill.md"));
}
export async function discoverSkillsInDirectory(skillsDir, source) {
    if (!(await directoryExists(skillsDir))) {
        return [];
    }
    const entries = await readdir(skillsDir);
    const skills = [];
    for (const entry of entries) {
        const skillPath = join(skillsDir, entry);
        const entryStats = await stat(skillPath);
        if (!entryStats.isDirectory()) {
            continue;
        }
        if (!(await isSkillDirectory(skillPath))) {
            continue;
        }
        const hasCommands = await directoryExists(join(skillPath, "commands"));
        const { manifestPath, manifest } = await loadSkillManifest(skillPath);
        skills.push({
            name: entry,
            path: skillPath,
            source,
            hasCommands,
            manifestPath,
            manifest,
        });
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name));
}
/**
 * Resolve source skills directory for self-install / local repository mode.
 * Search current working directory first, then repository-relative fallbacks.
 */
export async function getSourceDirectory(cwd = process.cwd()) {
    const possiblePaths = [
        resolve(cwd, "skills"),
        resolve(new URL(import.meta.url).pathname, "..", "..", "..", "..", "skills"),
        resolve(new URL(import.meta.url).pathname, "..", "..", "..", "..", "..", "skills"),
    ];
    for (const candidateSkillsDir of possiblePaths) {
        if (!(await directoryExists(candidateSkillsDir))) {
            continue;
        }
        return {
            srcDir: resolve(candidateSkillsDir, ".."),
            skillsDir: candidateSkillsDir,
            isSelfInstall: true,
        };
    }
    throw new Error("No local skills directory found");
}
export async function discoverSourceSkills(cwd = process.cwd()) {
    try {
        const source = await getSourceDirectory(cwd);
        return discoverSkillsInDirectory(source.skillsDir, "source");
    }
    catch {
        return [];
    }
}
export async function discoverInstalledSkills(scope, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(scope, cwd);
    return discoverSkillsInDirectory(layout.skillsDir, scope === "local" ? "local" : "global");
}
export async function discoverAllSkillsByPrecedence(cwd = process.cwd()) {
    const [source, localInstalled, globalInstalled] = await Promise.all([
        discoverSourceSkills(cwd),
        discoverInstalledSkills("local", cwd),
        discoverInstalledSkills("global", cwd),
    ]);
    const seen = new Set();
    const ordered = [];
    for (const group of [source, localInstalled, globalInstalled]) {
        for (const skill of group) {
            if (seen.has(skill.name)) {
                continue;
            }
            seen.add(skill.name);
            ordered.push(skill);
        }
    }
    return ordered;
}
export async function discoverAllInstalledSkills(cwd = process.cwd()) {
    const [localInstalled, globalInstalled] = await Promise.all([
        discoverInstalledSkills("local", cwd),
        discoverInstalledSkills("global", cwd),
    ]);
    return [...localInstalled, ...globalInstalled];
}
export async function findSkillByName(skillName, cwd = process.cwd()) {
    const skills = await discoverAllSkillsByPrecedence(cwd);
    return skills.find((skill) => skill.name === skillName) ?? null;
}
export async function findInstalledSkillByName(skillName, scope, cwd = process.cwd()) {
    const installed = await discoverInstalledSkills(scope, cwd);
    return installed.find((skill) => skill.name === skillName) ?? null;
}
async function commandExists(skill, commandName) {
    return directoryExists(join(skill.path, "bin", commandName));
}
async function runtimeReady(skill) {
    const requiredPaths = skill.manifest.runtime?.requiredPaths ?? [];
    for (const relativePath of requiredPaths) {
        if (!(await directoryExists(join(skill.path, relativePath)))) {
            return false;
        }
    }
    return true;
}
export async function findRunnableSkillByName(skillName, commandName, cwd = process.cwd()) {
    const [source, localInstalled, globalInstalled] = await Promise.all([
        discoverSourceSkills(cwd),
        discoverInstalledSkills("local", cwd),
        discoverInstalledSkills("global", cwd),
    ]);
    const candidates = [...source, ...localInstalled, ...globalInstalled].filter((skill) => skill.name === skillName);
    const commandCandidates = [];
    for (const candidate of candidates) {
        if (await commandExists(candidate, commandName)) {
            commandCandidates.push(candidate);
        }
    }
    if (commandCandidates.length === 0) {
        return null;
    }
    for (const candidate of commandCandidates) {
        if (await runtimeReady(candidate)) {
            return candidate;
        }
    }
    return commandCandidates[0] ?? null;
}
export function validateSkills(selectedSkills, availableSkills) {
    const available = new Set(availableSkills.map((skill) => skill.name));
    return selectedSkills.filter((skill) => available.has(skill));
}
//# sourceMappingURL=skill-discovery.js.map