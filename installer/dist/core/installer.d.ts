/**
 * Installation logic for skills
 */
import { PLATFORM_CONFIGS, type AgentPlatform, type InstallConfig, type InstallResult, type SkillInfo } from "./types.js";
/**
 * Install a single skill to a platform
 */
export declare function installSkill(platform: AgentPlatform, skill: SkillInfo, config: InstallConfig, srcDir: string): Promise<InstallResult>;
/**
 * Update .gitignore with agent directories
 */
export declare function updateGitignore(platforms: AgentPlatform[], config: typeof PLATFORM_CONFIGS): Promise<string[]>;
/**
 * Execute full installation
 */
export declare function executeInstallation(config: InstallConfig, skills: SkillInfo[], srcDir: string): Promise<InstallResult[]>;
//# sourceMappingURL=installer.d.ts.map