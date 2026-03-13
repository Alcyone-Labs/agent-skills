import { access, chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { discoverSkillsInDirectory } from "./skill-discovery.js";
import type { SkillInfo } from "./types.js";

interface CreateSkillOptions {
  manifestContent?: string;
  commandNames?: string[];
  commandContents?: Record<string, string>;
  description?: string;
  skillMarkdown?: string;
}

export async function createSkill(
  skillsRoot: string,
  skillName: string,
  options: CreateSkillOptions = {},
): Promise<SkillInfo> {
  const skillDir = join(skillsRoot, skillName);
  const binDir = join(skillDir, "bin");
  const commandNames = options.commandNames ?? [`${skillName}-cmd`];
  const skillMarkdown =
    options.skillMarkdown ??
    (options.description
      ? `---\nname: ${skillName}\ndescription: ${options.description}\n---\n\n# ${skillName}\n`
      : `# ${skillName}\n`);

  await mkdir(binDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), skillMarkdown, "utf-8");

  for (const commandName of commandNames) {
    const commandPath = join(binDir, commandName);
    const commandContent =
      options.commandContents?.[commandName] ?? "#!/usr/bin/env bash\nexit 0\n";
    await writeFile(commandPath, commandContent, "utf-8");
    await chmod(commandPath, 0o755);
  }

  if (options.manifestContent) {
    await writeFile(join(skillDir, "agent-skills.json"), options.manifestContent, "utf-8");
  }

  const discovered = await discoverSkillsInDirectory(skillsRoot, "source");
  const skill = discovered.find((entry) => entry.name === skillName);
  if (!skill) {
    throw new Error(`Failed to create skill ${skillName}`);
  }

  return skill;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
