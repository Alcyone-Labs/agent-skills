/**
 * Types for the Agent Skills Installer
 */
/** Supported agent platforms */
export type AgentPlatform = "OpenCode" | "Gemini CLI" | "Claude" | "FactoryAI Droid" | "Agents" | "Antigravity";
/** Platform configuration with normalized folder names */
export interface PlatformConfig {
    name: AgentPlatform;
    folderName: string;
    globalPath: string;
    localPath: string;
    supportsCommands: boolean;
    commandPath?: string;
    localCommandPath?: string;
}
/** Skill information */
export interface SkillInfo {
    name: string;
    path: string;
    hasCommands: boolean;
}
/** Installation configuration */
export interface InstallConfig {
    installType: "global" | "local";
    platforms: AgentPlatform[];
    skills: string[];
    installCommands: boolean;
    updateGitignore: boolean;
    selfInstall: boolean;
}
/** Installation result */
export interface InstallResult {
    platform: AgentPlatform;
    skill: string;
    success: boolean;
    commandInstalled?: boolean;
    error?: string;
}
/** Platform configurations mapping */
export declare const PLATFORM_CONFIGS: Record<AgentPlatform, PlatformConfig>;
/** Available agent platforms */
export declare const AVAILABLE_PLATFORMS: AgentPlatform[];
/** Default platform when none selected */
export declare const DEFAULT_PLATFORM: AgentPlatform;
//# sourceMappingURL=types.d.ts.map