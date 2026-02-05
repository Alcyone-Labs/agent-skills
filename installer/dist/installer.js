#!/usr/bin/env node
/**
 * Agent Skills Installer
 *
 * This installer uses promptWhen: "always" which means:
 * - Prompts will ALWAYS show by default
 * - Use flags to pre-configure values and skip specific prompts
 * - Use --help to see all available options
 *
 * Usage:
 *   # Full interactive mode (all prompts)
 *   npx @alcyone-labs/agent-skills
 *
 *   # Pre-configured interactive (skip scope prompt, show others)
 *   npx @alcyone-labs/agent-skills --global
 *
 *   # Pre-configured non-interactive (all flags provided)
 *   npx @alcyone-labs/agent-skills --global --all --gemini --droid
 *
 *   # Mixed mode (pre-set some values, prompt for missing ones)
 *   npx @alcyone-labs/agent-skills --global --gemini
 */
import { ArgParser, } from "@alcyone-labs/arg-parser";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { discoverSkills, getSourceDirectory } from "./core/skill-discovery.js";
import { executeInstallation } from "./core/installer.js";
import { AVAILABLE_PLATFORMS, DEFAULT_PLATFORM, PLATFORM_CONFIGS, } from "./core/types.js";
const REPO_URL = "https://github.com/Alcyone-Labs/agent-skills.git";
/**
 * Fetch skills from GitHub to a temp directory
 */
async function fetchFromGitHub() {
    const tempDir = mkdtempSync(join(tmpdir(), "agent-skills-"));
    console.log("📥 Fetching skills from GitHub...");
    try {
        execSync(`git clone --depth 1 --quiet "${REPO_URL}" "${tempDir}"`, {
            stdio: "pipe",
        });
    }
    catch (error) {
        throw new Error("Failed to fetch skills from GitHub. Please check your internet connection.");
    }
    return {
        srcDir: tempDir,
        skillsDir: join(tempDir, "skills"),
        cleanup: () => {
            try {
                rmSync(tempDir, { recursive: true, force: true });
            }
            catch {
                // Ignore cleanup errors
            }
        },
    };
}
/**
 * Check if running from local repository (self-install mode)
 */
async function isLocalRepository() {
    try {
        await getSourceDirectory();
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get skills source - either local or from GitHub
 */
async function getSkillsSource() {
    if (await isLocalRepository()) {
        const localSource = await getSourceDirectory();
        const availableSkills = await discoverSkills(localSource.skillsDir);
        return {
            srcDir: localSource.srcDir,
            skillsDir: localSource.skillsDir,
            availableSkills,
        };
    }
    else {
        const githubSource = await fetchFromGitHub();
        const availableSkills = await discoverSkills(githubSource.skillsDir);
        return {
            srcDir: githubSource.srcDir,
            skillsDir: githubSource.skillsDir,
            cleanup: githubSource.cleanup,
            availableSkills,
        };
    }
}
async function main() {
    // Discover skills FIRST before creating parser
    // This allows us to populate the skills prompt options
    let srcDir;
    let skillsDir;
    let cleanup;
    let availableSkills;
    try {
        const source = await getSkillsSource();
        srcDir = source.srcDir;
        skillsDir = source.skillsDir;
        cleanup = source.cleanup;
        availableSkills = source.availableSkills;
        if (availableSkills.length === 0) {
            console.error("❌ No skills found");
            process.exit(1);
        }
    }
    catch (error) {
        console.error("❌ Failed to load skills:", error);
        process.exit(1);
    }
    const parser = new ArgParser({
        appName: "Agent Skills Installer",
        appCommandName: "agent-skills",
        promptWhen: "always",
        handler: async (ctx) => {
            const args = ctx.args;
            // Determine install type
            let installType = "global";
            if (args.local) {
                installType = "local";
            }
            else if (args.global) {
                installType = "global";
            }
            else if (ctx.promptAnswers?.installType) {
                installType = ctx.promptAnswers.installType;
            }
            // Determine platforms from flags or prompt
            const hasAgentFlags = args.opencode ||
                args.gemini ||
                args.claude ||
                args.droid ||
                args.agents ||
                args.antigravity;
            let platforms = [];
            if (hasAgentFlags) {
                if (args.opencode)
                    platforms.push("OpenCode");
                if (args.gemini)
                    platforms.push("Gemini CLI");
                if (args.claude)
                    platforms.push("Claude");
                if (args.droid)
                    platforms.push("FactoryAI Droid");
                if (args.agents)
                    platforms.push("Agents");
                if (args.antigravity)
                    platforms.push("Antigravity");
            }
            else if (ctx.promptAnswers?.platforms) {
                platforms = ctx.promptAnswers.platforms;
            }
            else {
                platforms = [DEFAULT_PLATFORM];
            }
            // Determine skills from flags or prompt
            let skills = [];
            if (args.all) {
                skills = availableSkills.map((s) => s.name);
            }
            else if (ctx.promptAnswers?.skills) {
                skills = ctx.promptAnswers.skills;
            }
            else {
                skills = availableSkills.map((s) => s.name);
            }
            // Determine commands preference
            let installCommands = false;
            if (args.noCommands) {
                installCommands = false;
            }
            else if (args.installCommands) {
                installCommands = true;
            }
            else if (ctx.promptAnswers?.installCommands !== undefined) {
                installCommands = ctx.promptAnswers.installCommands;
            }
            // Determine gitignore preference
            let updateGitignore = false;
            if (args.noGitignore) {
                updateGitignore = false;
            }
            else if (args.gitignore) {
                updateGitignore = true;
            }
            else if (ctx.promptAnswers?.updateGitignore !== undefined) {
                updateGitignore = ctx.promptAnswers.updateGitignore;
            }
            const config = {
                installType,
                platforms,
                skills,
                installCommands,
                updateGitignore,
                selfInstall: await isLocalRepository(),
            };
            // Show summary
            console.log("\n📋 Installation Summary:");
            console.log(`  Scope: ${config.installType}`);
            console.log(`  Platforms: ${config.platforms.join(", ")}`);
            console.log(`  Skills: ${config.skills.join(", ")}`);
            console.log(`  Commands: ${config.installCommands ? "Yes" : "No"}`);
            console.log(`  Update .gitignore: ${config.updateGitignore ? "Yes" : "No"}`);
            console.log("");
            // Execute installation
            console.log("🚀 Installing skills...\n");
            const results = await executeInstallation(config, availableSkills, srcDir);
            const successCount = results.filter((r) => r.success).length;
            const failCount = results.length - successCount;
            if (failCount === 0) {
                console.log(`\n✅ Installed ${successCount} skill(s) successfully`);
            }
            else {
                console.log(`\n⚠️  Installed ${successCount} skill(s), ${failCount} failed`);
            }
            // Show detailed results
            console.log("\n📊 Installation Details:");
            for (const r of results) {
                const status = r.success ? "✅" : "❌";
                const cmd = r.commandInstalled ? " (cmd)" : "";
                const error = r.error ? ` - ${r.error}` : "";
                console.log(`  ${status} ${r.skill} → ${r.platform}${cmd}${error}`);
            }
            console.log("\n🎉 Installation complete!");
        },
    });
    // Scope flags
    parser.addFlag({
        name: "global",
        options: ["--global", "-g"],
        type: "boolean",
        flagOnly: true,
        description: "Install globally (user space ~/)",
    });
    parser.addFlag({
        name: "local",
        options: ["--local", "-l"],
        type: "boolean",
        flagOnly: true,
        description: "Install locally (project ./)",
    });
    // Agent flags
    parser.addFlag({
        name: "opencode",
        options: ["--opencode"],
        type: "boolean",
        flagOnly: true,
        description: "Install for OpenCode",
    });
    parser.addFlag({
        name: "gemini",
        options: ["--gemini"],
        type: "boolean",
        flagOnly: true,
        description: "Install for Gemini CLI",
    });
    parser.addFlag({
        name: "claude",
        options: ["--claude"],
        type: "boolean",
        flagOnly: true,
        description: "Install for Claude",
    });
    parser.addFlag({
        name: "droid",
        options: ["--droid"],
        type: "boolean",
        flagOnly: true,
        description: "Install for FactoryAI Droid",
    });
    parser.addFlag({
        name: "agents",
        options: ["--agents"],
        type: "boolean",
        flagOnly: true,
        description: "Install for Agents",
    });
    parser.addFlag({
        name: "antigravity",
        options: ["--antigravity"],
        type: "boolean",
        flagOnly: true,
        description: "Install for Antigravity",
    });
    // Skill selection flags
    parser.addFlag({
        name: "all",
        options: ["--all", "-a"],
        type: "boolean",
        flagOnly: true,
        description: "Install all available skills",
    });
    // Command installation flags
    parser.addFlag({
        name: "installCommands",
        options: ["--commands"],
        type: "boolean",
        flagOnly: true,
        description: "Install commands for supported agents",
    });
    parser.addFlag({
        name: "noCommands",
        options: ["--no-commands"],
        type: "boolean",
        flagOnly: true,
        description: "Skip installing commands",
    });
    // Gitignore flags
    parser.addFlag({
        name: "gitignore",
        options: ["--gitignore"],
        type: "boolean",
        flagOnly: true,
        description: "Add agent folders to .gitignore",
    });
    parser.addFlag({
        name: "noGitignore",
        options: ["--no-gitignore"],
        type: "boolean",
        flagOnly: true,
        description: "Skip adding to .gitignore",
    });
    // Interactive flag
    parser.addFlag({
        name: "interactive",
        options: ["--interactive", "-i"],
        type: "boolean",
        flagOnly: true,
        description: "Run in interactive mode with prompts",
    });
    // Promptable flags (only shown in interactive mode when values missing)
    // 1. Installation scope prompt
    parser.addFlag({
        name: "installType",
        options: ["--install-type"],
        type: "string",
        promptSequence: 1,
        prompt: async (ctx) => ({
            type: "select",
            message: "Select installation scope:",
            options: [
                { label: "Global (user space ~)", value: "global" },
                { label: "Local (project ./)", value: "local" },
            ],
            skip: ctx.args.global || ctx.args.local,
        }),
    });
    // 2. Platforms prompt
    parser.addFlag({
        name: "platforms",
        options: ["--platforms", "-p"],
        type: "array",
        defaultValue: [DEFAULT_PLATFORM],
        promptSequence: 2,
        prompt: async (ctx) => {
            const hasAgentFlags = ctx.args.opencode ||
                ctx.args.gemini ||
                ctx.args.claude ||
                ctx.args.droid ||
                ctx.args.agents ||
                ctx.args.antigravity;
            return {
                type: "multiselect",
                message: "Select agents to install to:",
                options: AVAILABLE_PLATFORMS.map((p) => ({
                    label: p,
                    value: p,
                    hint: PLATFORM_CONFIGS[p].supportsCommands
                        ? "supports commands"
                        : undefined,
                })),
                initial: [DEFAULT_PLATFORM],
                allowSelectAll: true,
                skip: hasAgentFlags,
            };
        },
    });
    // 3. Skills prompt - now with actual skill options
    parser.addFlag({
        name: "skills",
        options: ["--skills", "-s"],
        type: "array",
        promptSequence: 3,
        prompt: async (ctx) => ({
            type: "multiselect",
            message: "Select skills to install:",
            options: availableSkills.map((skill) => ({
                label: skill.name,
                value: skill.name,
                hint: skill.hasCommands ? "has commands" : undefined,
            })),
            allowSelectAll: true,
            skip: ctx.args.all,
        }),
    });
    // 4. Commands prompt
    parser.addFlag({
        name: "installCommandsPrompt",
        options: ["--install-commands-prompt"],
        type: "boolean",
        defaultValue: false,
        promptSequence: 4,
        prompt: async (ctx) => ({
            type: "confirm",
            message: "Install commands for supported agents?",
            initial: false,
            skip: ctx.args.installCommands !== undefined ||
                ctx.args.noCommands !== undefined,
        }),
    });
    // 5. Gitignore prompt
    parser.addFlag({
        name: "updateGitignorePrompt",
        options: ["--update-gitignore-prompt"],
        type: "boolean",
        defaultValue: false,
        promptSequence: 5,
        prompt: async (ctx) => {
            const installType = ctx.promptAnswers?.installType ||
                (ctx.args.global ? "global" : ctx.args.local ? "local" : "global");
            return {
                type: "confirm",
                message: "Add agent folders to .gitignore?",
                initial: false,
                skip: ctx.args.gitignore !== undefined ||
                    ctx.args.noGitignore !== undefined ||
                    installType !== "local",
            };
        },
    });
    try {
        await parser.parse();
    }
    finally {
        // Cleanup temp directory if we fetched from GitHub
        if (cleanup) {
            cleanup();
        }
    }
}
main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=installer.js.map