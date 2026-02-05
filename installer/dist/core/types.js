/**
 * Types for the Agent Skills Installer
 */
/** Platform configurations mapping */
export const PLATFORM_CONFIGS = {
    OpenCode: {
        name: "OpenCode",
        folderName: "opencode",
        globalPath: "~/.config/opencode/skills",
        localPath: ".opencode/skills",
        supportsCommands: true,
        commandPath: "~/.config/opencode/commands",
        localCommandPath: ".opencode/commands",
    },
    "Gemini CLI": {
        name: "Gemini CLI",
        folderName: "gemini",
        globalPath: "~/.gemini/skills",
        localPath: ".gemini/skills",
        supportsCommands: true,
        commandPath: "~/.gemini/commands",
        localCommandPath: ".gemini/commands",
    },
    Claude: {
        name: "Claude",
        folderName: "claude",
        globalPath: "~/.claude/skills",
        localPath: ".claude/skills",
        supportsCommands: false,
    },
    "FactoryAI Droid": {
        name: "FactoryAI Droid",
        folderName: "droid",
        globalPath: "~/.factory/skills",
        localPath: ".factory/skills",
        supportsCommands: true,
        commandPath: "~/.factory/commands",
        localCommandPath: ".factory/commands",
    },
    Agents: {
        name: "Agents",
        folderName: "agents",
        globalPath: "~/.config/agents/skills",
        localPath: ".agents/skills",
        supportsCommands: false,
    },
    Antigravity: {
        name: "Antigravity",
        folderName: "antigravity",
        globalPath: "~/.antigravity/skills",
        localPath: ".antigravity/skills",
        supportsCommands: false,
    },
};
/** Available agent platforms */
export const AVAILABLE_PLATFORMS = [
    "OpenCode",
    "Gemini CLI",
    "Claude",
    "FactoryAI Droid",
    "Agents",
    "Antigravity",
];
/** Default platform when none selected */
export const DEFAULT_PLATFORM = "Agents";
//# sourceMappingURL=types.js.map