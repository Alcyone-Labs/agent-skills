/**
 * Core domain types for agent-skills lifecycle management.
 */
export const CLIENT_CONFIGS = {
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
export const AVAILABLE_CLIENTS = [
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
export const DEFAULT_COMPATIBILITY_CLIENTS = ["Claude"];
//# sourceMappingURL=types.js.map