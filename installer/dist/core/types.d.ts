/**
 * Core domain types for agent-skills lifecycle management.
 */
export type InstallScope = "global" | "local";
export type SkillSource = "source" | "local" | "global";
export type LifecycleVerb = "install" | "run" | "validate" | "update" | "uninstall" | "prune" | "reset" | "clean" | "purge";
export type RuntimeStrategy = "none" | "npm-in-skill";
export type CompatibilityClient = "OpenCode" | "Gemini CLI" | "Claude" | "FactoryAI Droid" | "Agents" | "Antigravity";
export interface CommandAdapterConfig {
    globalDir: string;
    localDir: string;
    extension: ".md" | ".toml";
}
export interface ClientConfig {
    name: CompatibilityClient;
    folderName: string;
    supportsAgentsAlias: boolean;
    globalSkillDir: string;
    localSkillDir: string;
    commandAdapter?: CommandAdapterConfig;
}
export declare const CLIENT_CONFIGS: Record<CompatibilityClient, ClientConfig>;
export declare const AVAILABLE_CLIENTS: CompatibilityClient[];
/**
 * Default compatibility exports used when no explicit clients are requested.
 * Claude Code currently needs compatibility export because it does not consume
 * ~/.agents/skills directly.
 */
export declare const DEFAULT_COMPATIBILITY_CLIENTS: CompatibilityClient[];
export interface RuntimeConfig {
    strategy: RuntimeStrategy;
    installCommand?: string[];
    requiredPaths?: string[];
}
export interface ConfigCheck {
    id: string;
    description: string;
    kind: "env" | "path";
    value: string;
    severity?: "warning" | "error";
}
export interface ValidateConfig {
    requiredPaths?: string[];
    configChecks?: ConfigCheck[];
}
export interface PurgeConfig {
    externalPaths?: string[];
}
export interface CompatibilityConfig {
    clients?: CompatibilityClient[];
    symlink?: boolean;
}
export interface SkillManifest {
    schemaVersion: 1;
    exportedCommands: string[];
    runtime?: RuntimeConfig;
    compatibility?: CompatibilityConfig;
    validate?: ValidateConfig;
    purge?: PurgeConfig;
}
export interface SkillInfo {
    name: string;
    path: string;
    source: SkillSource;
    hasCommands: boolean;
    manifestPath: string | null;
    manifest: SkillManifest;
}
export interface InstallationLayout {
    scope: InstallScope;
    agentsRoot: string;
    skillsDir: string;
    binDir: string;
}
export interface MutationOptions {
    scope: InstallScope;
    dryRun: boolean;
    installCommandAdapters: boolean;
    compatibilityClients: CompatibilityClient[];
}
export interface ValidationIssue {
    skill: string;
    severity: "warning" | "error";
    message: string;
}
export interface OperationResult {
    skill: string;
    scope: InstallScope;
    changedPaths: string[];
    dryRun: boolean;
    compatibilityClients: CompatibilityClient[];
}
//# sourceMappingURL=types.d.ts.map