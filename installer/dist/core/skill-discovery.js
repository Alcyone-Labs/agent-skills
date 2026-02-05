/**
 * Skill discovery and management utilities
 */
import { readdir, stat, access } from "fs/promises";
import { join, resolve } from "path";
/**
 * Discover available skills in the skills directory
 */
export async function discoverSkills(skillsDir) {
    const skills = [];
    try {
        await access(skillsDir);
    }
    catch {
        return skills;
    }
    try {
        const entries = await readdir(skillsDir);
        for (const entry of entries) {
            const skillPath = join(skillsDir, entry);
            const stats = await stat(skillPath);
            if (stats.isDirectory()) {
                // Check if it's a valid skill (has SKILL.md or Skill.md)
                const hasSkillFile = (await access(join(skillPath, "SKILL.md"))
                    .then(() => true)
                    .catch(() => false)) ||
                    (await access(join(skillPath, "Skill.md"))
                        .then(() => true)
                        .catch(() => false));
                if (hasSkillFile) {
                    // Check if it has commands directory
                    const hasCommands = await access(join(skillPath, "commands"))
                        .then(() => true)
                        .catch(() => false);
                    skills.push({
                        name: entry,
                        path: skillPath,
                        hasCommands,
                    });
                }
            }
        }
    }
    catch (error) {
        console.error("Error discovering skills:", error);
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name));
}
/**
 * Get the source directory for skills
 * Detects if running in self-install mode or from a cloned repo
 */
export async function getSourceDirectory() {
    // Check if we're running from the installer directory
    const currentFile = import.meta.url;
    const currentDir = resolve(new URL(currentFile).pathname, "..", "..", "..", "..");
    // Check for skills directory at various levels
    const possiblePaths = [
        join(currentDir, "skills"),
        join(currentDir, "..", "skills"),
        join(currentDir, "..", "..", "skills"),
        join(process.cwd(), "skills"),
    ];
    for (const path of possiblePaths) {
        try {
            await access(path);
            const stats = await stat(path);
            if (stats.isDirectory()) {
                return {
                    srcDir: resolve(path, ".."),
                    skillsDir: path,
                    isSelfInstall: true,
                };
            }
        }
        catch {
            continue;
        }
    }
    // No local skills found - will need to fetch from GitHub
    throw new Error("No local skills directory found");
}
/**
 * Validate selected skills against available skills
 */
export function validateSkills(selectedSkills, availableSkills) {
    const availableNames = new Set(availableSkills.map((s) => s.name));
    return selectedSkills.filter((name) => availableNames.has(name));
}
//# sourceMappingURL=skill-discovery.js.map