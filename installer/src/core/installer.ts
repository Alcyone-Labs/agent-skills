/**
 * Installation logic for skills
 */

import { cp, mkdir, rm, access, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { homedir } from "os";
import {
  PLATFORM_CONFIGS,
  type AgentPlatform,
  type InstallConfig,
  type InstallResult,
  type PlatformConfig,
  type SkillInfo,
} from "./types.js";

/**
 * Expand tilde in paths to home directory
 */
function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

/**
 * Install a single skill to a platform
 */
export async function installSkill(
  platform: AgentPlatform,
  skill: SkillInfo,
  config: InstallConfig,
  srcDir: string
): Promise<InstallResult> {
  const platformConfig = PLATFORM_CONFIGS[platform];
  const basePath =
    config.installType === "global"
      ? expandPath(platformConfig.globalPath)
      : platformConfig.localPath;
  const targetSkillDir = join(basePath, skill.name);

  try {
    // Safety checks - prevent deletion of critical directories
    const resolvedPath = resolve(targetSkillDir);
    const homeDir = homedir();
    
    // Block empty or invalid skill names
    if (!skill.name || skill.name.includes("..") || skill.name.includes("/")) {
      throw new Error(`Invalid skill name: ${skill.name}`);
    }
    
    // Block critical system directories
    const blockedPaths = [
      "/",
      homeDir,
      "/usr",
      "/bin",
      "/sbin",
      "/lib",
      "/lib64",
      "/etc",
      "/var",
      "/opt",
      "/home",
      "/Users",
    ];
    
    for (const blocked of blockedPaths) {
      if (resolvedPath === blocked || resolvedPath.startsWith(blocked + "/")) {
        // Allow paths that are within the expected agent directories
        const isAgentPath = Object.values(PLATFORM_CONFIGS).some(config => {
          const globalPath = resolve(expandPath(config.globalPath));
          const localPath = resolve(config.localPath);
          return resolvedPath.startsWith(globalPath) || resolvedPath.startsWith(localPath);
        });
        
        if (!isAgentPath) {
          throw new Error(`Blocked potentially dangerous path: ${resolvedPath}`);
        }
      }
    }
    
    // Ensure the target is within an agent directory
    const isInAgentDir = Object.values(PLATFORM_CONFIGS).some(config => {
      const globalPath = resolve(expandPath(config.globalPath));
      const localPath = resolve(config.localPath);
      return resolvedPath.startsWith(globalPath) || resolvedPath.startsWith(localPath);
    });
    
    if (!isInAgentDir) {
      throw new Error(`Target path is not within an agent directory: ${resolvedPath}`);
    }

    // Create base directory
    await mkdir(basePath, { recursive: true });

    // Remove old target directory
    try {
      await rm(targetSkillDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }

    // Create target directory
    await mkdir(targetSkillDir, { recursive: true });

    // Copy skill contents
    const skillSrcPath = join(srcDir, "skills", skill.name);
    await cp(skillSrcPath, targetSkillDir, { recursive: true });

    // Standardize SKILL.md (handle case-insensitive filesystems)
    // On case-insensitive filesystems (macOS, Windows), Skill.md and SKILL.md are the same file
    // We need to check if they're actually different files before renaming
    try {
      const oldPath = join(targetSkillDir, "Skill.md");
      const newPath = join(targetSkillDir, "SKILL.md");
      
      // Check if SKILL.md (preferred) already exists
      let skillMdExists = false;
      try {
        await access(newPath);
        skillMdExists = true;
      } catch {
        // SKILL.md doesn't exist
      }
      
      // Check if Skill.md (old naming) exists
      let skillMdLowerExists = false;
      try {
        await access(oldPath);
        skillMdLowerExists = true;
      } catch {
        // Skill.md doesn't exist
      }
      
      // Only rename if Skill.md exists but SKILL.md doesn't
      // On case-insensitive filesystems, both will be true (same file), so skip
      if (skillMdLowerExists && !skillMdExists) {
        const content = await readFile(oldPath, "utf-8");
        await writeFile(newPath, content);
        await rm(oldPath);
      }
    } catch {
      // Ignore errors during standardization
    }

    let commandInstalled = false;

    // Install command if needed and supported
    if (config.installCommands && platformConfig.supportsCommands) {
      const commandDir =
        config.installType === "global"
          ? expandPath(platformConfig.commandPath!)
          : platformConfig.localCommandPath!;

      const { cmdSrc, cmdExt } = getCommandSource(
        srcDir,
        skill.name,
        platformConfig.folderName
      );

      if (cmdSrc) {
        try {
          await access(cmdSrc);
          await mkdir(commandDir, { recursive: true });
          const targetCmd = join(commandDir, `${skill.name}${cmdExt}`);
          let content = await readFile(cmdSrc, "utf-8");

          // Post-process for Gemini and Droid
          if (
            platformConfig.folderName === "gemini" ||
            platformConfig.folderName === "droid"
          ) {
            content = content.replace(/\{\{SKILL_PATH\}\}/g, targetSkillDir);
          }

          await writeFile(targetCmd, content);
          commandInstalled = true;
        } catch {
          // Command file doesn't exist
        }
      }
    }

    return {
      platform,
      skill: skill.name,
      success: true,
      commandInstalled,
    };
  } catch (error) {
    return {
      platform,
      skill: skill.name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get command source file path
 */
function getCommandSource(
  srcDir: string,
  skillName: string,
  platformFolder: string
): { cmdSrc: string | null; cmdExt: string } {
  const commandsBase = join(srcDir, "skills", skillName, "commands");

  switch (platformFolder) {
    case "opencode":
      return {
        cmdSrc: join(commandsBase, "opencode", `${skillName}.md`),
        cmdExt: ".md",
      };
    case "gemini":
      return {
        cmdSrc: join(commandsBase, "gemini", `${skillName}.toml`),
        cmdExt: ".toml",
      };
    case "droid":
      return {
        cmdSrc: join(commandsBase, "droid", `${skillName}.md`),
        cmdExt: ".md",
      };
    default:
      return { cmdSrc: null, cmdExt: "" };
  }
}

/**
 * Update .gitignore with agent directories
 */
export async function updateGitignore(
  platforms: AgentPlatform[],
  config: typeof PLATFORM_CONFIGS
): Promise<string[]> {
  const gitignorePath = join(process.cwd(), ".gitignore");
  const added: string[] = [];

  try {
    await access(gitignorePath);
  } catch {
    return added;
  }

  let content = await readFile(gitignorePath, "utf-8");
  const originalContent = content;

  for (const platform of platforms) {
    const platformConfig = config[platform];
    const entry = `${platformConfig.localPath}/`;

    if (!content.includes(entry)) {
      content += `\n# Added by agent-skills installer\n${entry}\n`;
      added.push(entry);
    }
  }

  if (content !== originalContent) {
    await writeFile(gitignorePath, content);
  }

  return added;
}

/**
 * Execute full installation
 */
export async function executeInstallation(
  config: InstallConfig,
  skills: SkillInfo[],
  srcDir: string
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  for (const platform of config.platforms) {
    for (const skillName of config.skills) {
      const skill = skills.find((s) => s.name === skillName);
      if (skill) {
        const result = await installSkill(platform, skill, config, srcDir);
        results.push(result);
      }
    }
  }

  // Update .gitignore if requested
  if (config.updateGitignore && config.installType === "local") {
    await updateGitignore(config.platforms, PLATFORM_CONFIGS);
  }

  return results;
}
