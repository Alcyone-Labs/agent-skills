import { access, readdir, stat } from "fs/promises";
import { join, resolve } from "path";
import { loadSkillManifest } from "./manifest.js";
import { resolveInstallationLayout } from "./paths.js";
import type { InstallScope, SkillInfo, SkillSource } from "./types.js";

async function directoryExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isSkillDirectory(path: string): Promise<boolean> {
  const hasSkillMd = await directoryExists(join(path, "SKILL.md"));
  if (hasSkillMd) {
    return true;
  }

  return directoryExists(join(path, "Skill.md"));
}

export async function discoverSkillsInDirectory(
  skillsDir: string,
  source: SkillSource,
): Promise<SkillInfo[]> {
  if (!(await directoryExists(skillsDir))) {
    return [];
  }

  const entries = await readdir(skillsDir);
  const skills: SkillInfo[] = [];

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
export async function getSourceDirectory(cwd = process.cwd()): Promise<{
  srcDir: string;
  skillsDir: string;
  isSelfInstall: boolean;
}> {
  const possiblePaths = [
    resolve(cwd, "skills"),
    resolve(new URL(import.meta.url).pathname, "..", "..", "..", "..", "skills"),
    resolve(
      new URL(import.meta.url).pathname,
      "..",
      "..",
      "..",
      "..",
      "..",
      "skills",
    ),
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

export async function discoverSourceSkills(cwd = process.cwd()): Promise<SkillInfo[]> {
  try {
    const source = await getSourceDirectory(cwd);
    return discoverSkillsInDirectory(source.skillsDir, "source");
  } catch {
    return [];
  }
}

export async function discoverInstalledSkills(
  scope: InstallScope,
  cwd = process.cwd(),
): Promise<SkillInfo[]> {
  const layout = resolveInstallationLayout(scope, cwd);
  return discoverSkillsInDirectory(layout.skillsDir, scope === "local" ? "local" : "global");
}

export async function discoverAllSkillsByPrecedence(
  cwd = process.cwd(),
): Promise<SkillInfo[]> {
  const [source, localInstalled, globalInstalled] = await Promise.all([
    discoverSourceSkills(cwd),
    discoverInstalledSkills("local", cwd),
    discoverInstalledSkills("global", cwd),
  ]);

  const seen = new Set<string>();
  const ordered: SkillInfo[] = [];

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

export async function discoverAllInstalledSkills(
  cwd = process.cwd(),
): Promise<SkillInfo[]> {
  const [localInstalled, globalInstalled] = await Promise.all([
    discoverInstalledSkills("local", cwd),
    discoverInstalledSkills("global", cwd),
  ]);

  return [...localInstalled, ...globalInstalled];
}

export async function findSkillByName(
  skillName: string,
  cwd = process.cwd(),
): Promise<SkillInfo | null> {
  const skills = await discoverAllSkillsByPrecedence(cwd);
  return skills.find((skill) => skill.name === skillName) ?? null;
}

export async function findInstalledSkillByName(
  skillName: string,
  scope: InstallScope,
  cwd = process.cwd(),
): Promise<SkillInfo | null> {
  const installed = await discoverInstalledSkills(scope, cwd);
  return installed.find((skill) => skill.name === skillName) ?? null;
}

async function commandExists(skill: SkillInfo, commandName: string): Promise<boolean> {
  return directoryExists(join(skill.path, "bin", commandName));
}

async function runtimeReady(skill: SkillInfo): Promise<boolean> {
  const requiredPaths = skill.manifest.runtime?.requiredPaths ?? [];
  for (const relativePath of requiredPaths) {
    if (!(await directoryExists(join(skill.path, relativePath)))) {
      return false;
    }
  }

  return true;
}

export async function findRunnableSkillByName(
  skillName: string,
  commandName: string,
  cwd = process.cwd(),
): Promise<SkillInfo | null> {
  const [source, localInstalled, globalInstalled] = await Promise.all([
    discoverSourceSkills(cwd),
    discoverInstalledSkills("local", cwd),
    discoverInstalledSkills("global", cwd),
  ]);
  const candidates = [...source, ...localInstalled, ...globalInstalled].filter(
    (skill) => skill.name === skillName,
  );

  const commandCandidates: SkillInfo[] = [];
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

export function validateSkills(selectedSkills: string[], availableSkills: SkillInfo[]): string[] {
  const available = new Set(availableSkills.map((skill) => skill.name));
  return selectedSkills.filter((skill) => available.has(skill));
}
