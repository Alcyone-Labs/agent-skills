/**
 * Core domain types for agent-skills lifecycle management.
 */

export type InstallScope = "global" | "local";

export type SkillSource = "source" | "local" | "global";

export type LifecycleVerb =
  | "install"
  | "run"
  | "validate"
  | "update"
  | "uninstall"
  | "prune"
  | "reset"
  | "clean"
  | "purge";

export type RuntimeStrategy = "none" | "npm-in-skill";

export type CompatibilityClient =
  | "OpenCode"
  | "Gemini CLI"
  | "Claude"
  | "FactoryAI Droid"
  | "Agents"
  | "Antigravity";

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

export const CLIENT_CONFIGS: Record<CompatibilityClient, ClientConfig> = {
  OpenCode: {
    name: "OpenCode",
    folderName: "opencode",
    supportsAgentsAlias: false,
    globalSkillDir: "~/.config/opencode/skills",
    localSkillDir: ".opencode/skills",
    commandAdapter: {
      globalDir: "~/.config/opencode/commands",
      localDir: ".opencode/commands",
      extension: ".md",
    },
  },
  "Gemini CLI": {
    name: "Gemini CLI",
    folderName: "gemini",
    supportsAgentsAlias: true,
    globalSkillDir: "~/.gemini/skills",
    localSkillDir: ".gemini/skills",
    commandAdapter: {
      globalDir: "~/.gemini/commands",
      localDir: ".gemini/commands",
      extension: ".toml",
    },
  },
  Claude: {
    name: "Claude",
    folderName: "claude",
    supportsAgentsAlias: false,
    globalSkillDir: "~/.claude/skills",
    localSkillDir: ".claude/skills",
  },
  "FactoryAI Droid": {
    name: "FactoryAI Droid",
    folderName: "droid",
    supportsAgentsAlias: false,
    globalSkillDir: "~/.factory/skills",
    localSkillDir: ".factory/skills",
    commandAdapter: {
      globalDir: "~/.factory/commands",
      localDir: ".factory/commands",
      extension: ".md",
    },
  },
  Agents: {
    name: "Agents",
    folderName: "agents",
    supportsAgentsAlias: true,
    globalSkillDir: "~/.agents/skills",
    localSkillDir: ".agents/skills",
  },
  Antigravity: {
    name: "Antigravity",
    folderName: "antigravity",
    supportsAgentsAlias: false,
    globalSkillDir: "~/.antigravity/skills",
    localSkillDir: ".antigravity/skills",
  },
};

export const AVAILABLE_CLIENTS: CompatibilityClient[] = [
  "OpenCode",
  "Gemini CLI",
  "Claude",
  "FactoryAI Droid",
  "Agents",
  "Antigravity",
];

/**
 * Default compatibility exports used when no explicit clients are requested.
 * Claude Code currently needs compatibility export because it does not consume
 * ~/.agents/skills directly.
 */
export const DEFAULT_COMPATIBILITY_CLIENTS: CompatibilityClient[] = ["Claude"];

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
