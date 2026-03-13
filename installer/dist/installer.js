#!/usr/bin/env node
import { ArgParser } from "@alcyone-labs/arg-parser";
import { mcpPlugin } from "@alcyone-labs/arg-parser-mcp";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import { assertSkillAllowed, listCatalogSkills, searchCatalogSkills, } from "./core/catalog.js";
import { buildMcpConfigSnippet, extractSkillAccessPolicy } from "./core/mcp-config.js";
import { cleanInstall, installSkill, purgeSkill, pruneInstall, resetSkill, runSkillCommand, uninstallSkill, updateSkill, useSourceSkillCommand, validateAllInstalledSkills, validateSkill, } from "./core/installer.js";
import { discoverSkillsInDirectory, discoverSourceSkills, findRunnableSkillByName, } from "./core/skill-discovery.js";
import { AVAILABLE_CLIENTS, } from "./core/types.js";
const REPO_URL = "https://github.com/Alcyone-Labs/agent-skills.git";
const DEFAULT_FIND_LIMIT = 5;
function normalizeScope(args) {
    if (args.local) {
        return "local";
    }
    return "global";
}
function normalizeStringArray(values) {
    if (values === undefined || values === null) {
        return [];
    }
    if (Array.isArray(values)) {
        return values
            .map((value) => String(value).trim())
            .filter((value) => value.length > 0);
    }
    const normalized = String(values).trim();
    return normalized.length > 0 ? [normalized] : [];
}
function normalizeCompatibilityClients(values) {
    if (!values || values.length === 0) {
        return [];
    }
    const normalized = values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => {
        const directMatch = AVAILABLE_CLIENTS.find((client) => client.toLowerCase() === value.toLowerCase());
        if (directMatch) {
            return directMatch;
        }
        if (value.toLowerCase() === "droid" || value.toLowerCase() === "factory") {
            return "FactoryAI Droid";
        }
        throw new Error(`Unsupported compatibility client: ${value}`);
    });
    return Array.from(new Set(normalized));
}
function createMutationOptions(args) {
    return {
        scope: normalizeScope(args),
        dryRun: Boolean(args.dryRun),
        installCommandAdapters: args.noCommands ? false : Boolean(args.commands),
        compatibilityClients: normalizeCompatibilityClients(args.client),
    };
}
function normalizeSkillPolicy(args) {
    return {
        allowSkills: normalizeStringArray(args.allowSkill),
        denySkills: normalizeStringArray(args.denySkill),
    };
}
function unwrapToolArgs(value) {
    if (typeof value === "object" && value !== null && "args" in value) {
        return value.args;
    }
    return value;
}
function printOperationResult(action, result) {
    const mode = result.dryRun ? "[dry-run] " : "";
    console.log(`${mode}${action}: ${result.skill} (${result.scope})`);
    if (result.compatibilityClients && result.compatibilityClients.length > 0) {
        console.log(`compatibility exports: ${result.compatibilityClients.join(", ")}`);
    }
    if (result.changedPaths.length === 0) {
        console.log("changes: none");
        return;
    }
    console.log("changed paths:");
    for (const changedPath of result.changedPaths) {
        console.log(`  - ${changedPath}`);
    }
}
function requireStringArg(name, value) {
    if (!value) {
        throw new Error(`--${name} is required`);
    }
    return value;
}
function findSourceSkillByName(skills, skillName) {
    const skill = skills.find((candidate) => candidate.name === skillName);
    if (!skill) {
        throw new Error(`Skill not found in source set: ${skillName}`);
    }
    return skill;
}
async function fetchSourceSkillsFromGitHub() {
    const tempDir = mkdtempSync(join(tmpdir(), "agent-skills-"));
    try {
        execSync(`git clone --depth 1 --quiet "${REPO_URL}" "${tempDir}"`, {
            stdio: "pipe",
        });
    }
    catch {
        rmSync(tempDir, { recursive: true, force: true });
        throw new Error("Failed to fetch skills from GitHub");
    }
    const skillsDir = join(tempDir, "skills");
    const skills = await discoverSkillsInDirectory(skillsDir, "source");
    return {
        skills,
        cleanup: () => {
            try {
                rmSync(tempDir, { recursive: true, force: true });
            }
            catch {
                // Ignore cleanup errors.
            }
        },
    };
}
async function resolveSourceSkills() {
    const localSource = await discoverSourceSkills();
    if (localSource.length > 0) {
        return { skills: localSource };
    }
    return fetchSourceSkillsFromGitHub();
}
async function withResolvedSourceSkills(callback) {
    const source = await resolveSourceSkills();
    try {
        return await callback(source.skills);
    }
    finally {
        source.cleanup?.();
    }
}
function addScopeFlags(parser) {
    parser.addFlag({
        name: "global",
        options: ["--global", "-g"],
        type: "boolean",
        flagOnly: true,
        description: "Use global install scope (~/.agents)",
    });
    parser.addFlag({
        name: "local",
        options: ["--local", "-l"],
        type: "boolean",
        flagOnly: true,
        description: "Use local install scope (./.agents)",
    });
}
function addDryRunFlag(parser) {
    parser.addFlag({
        name: "dryRun",
        options: ["--dry-run"],
        type: "boolean",
        flagOnly: true,
        description: "Preview actions without changing files",
    });
}
function addSkillPolicyFlags(parser) {
    parser.addFlag({
        name: "allowSkill",
        options: ["--allow-skill"],
        type: "array",
        allowMultiple: true,
        description: "Allow-list a skill for MCP operations (repeat flag for multiple)",
    });
    parser.addFlag({
        name: "denySkill",
        options: ["--deny-skill"],
        type: "array",
        allowMultiple: true,
        description: "Deny-list a skill for MCP operations (repeat flag for multiple)",
    });
}
function createCommonMutationFlags(parser) {
    addScopeFlags(parser);
    addDryRunFlag(parser);
    parser.addFlag({
        name: "commands",
        options: ["--commands"],
        type: "boolean",
        flagOnly: true,
        description: "Install optional command adapters",
    });
    parser.addFlag({
        name: "noCommands",
        options: ["--no-commands"],
        type: "boolean",
        flagOnly: true,
        description: "Skip optional command adapters",
    });
    parser.addFlag({
        name: "client",
        options: ["--client", "-c"],
        type: "array",
        allowMultiple: true,
        description: "Compatibility export targets (repeat flag for multiple)",
    });
}
function addSkillFlag(parser, description) {
    parser.addFlag({
        name: "skill",
        options: ["--skill", "-s"],
        type: "string",
        description,
    });
}
function addCommandInvocationFlags(parser) {
    addSkillFlag(parser, "Skill name");
    parser.addFlag({
        name: "command",
        options: ["--command"],
        type: "string",
        description: "Exported command name",
    });
    parser.addFlag({
        name: "arg",
        options: ["--arg"],
        type: "array",
        allowMultiple: true,
        description: "Command argument (repeat flag for multiple)",
    });
}
function createInstallParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills install",
        description: "Install source skills into the canonical .agents layout",
        handler: async (ctx) => {
            const args = ctx.args;
            const mutationOptions = createMutationOptions(args);
            await withResolvedSourceSkills(async (skills) => {
                const selectedSkills = args.all
                    ? skills
                    : [findSourceSkillByName(skills, requireStringArg("skill", args.skill))];
                for (const skill of selectedSkills) {
                    const result = await installSkill(skill, mutationOptions);
                    printOperationResult("install", result);
                }
            });
        },
    });
    createCommonMutationFlags(parser);
    addSkillFlag(parser, "Skill name to install");
    parser.addFlag({
        name: "all",
        options: ["--all"],
        type: "boolean",
        flagOnly: true,
        description: "Install all source skills",
    });
    return parser;
}
function createListParser() {
    return new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills list",
        description: "List source skills with descriptions",
        handler: async () => {
            await withResolvedSourceSkills(async (skills) => {
                const entries = listCatalogSkills(skills);
                if (entries.length === 0) {
                    console.log("No source skills found.");
                    return;
                }
                for (const entry of entries) {
                    console.log(`${entry.name}: ${entry.description ?? "(no description)"}`);
                }
            });
        },
    });
}
function createFindParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills find",
        description: "Find the most relevant source skills for a free-text request",
        handler: async (ctx) => {
            const args = ctx.args;
            const query = requireStringArg("query", args.query);
            const limit = args.limit ?? DEFAULT_FIND_LIMIT;
            await withResolvedSourceSkills(async (skills) => {
                const results = searchCatalogSkills(skills, query, { limit });
                if (results.length === 0) {
                    console.log("No matching source skills found.");
                    return;
                }
                for (const [index, result] of results.entries()) {
                    console.log(`${index + 1}. ${result.skill.name}: ${result.skill.description ?? "(no description)"}`);
                    console.log(`   reasons: ${result.reasons.join("; ")}`);
                }
            });
        },
    });
    parser.addFlag({
        name: "query",
        options: ["--query", "-q"],
        type: "string",
        description: "Free-text request to match against source skills",
    });
    parser.addFlag({
        name: "limit",
        options: ["--limit", "-n"],
        type: "number",
        description: "Maximum number of results to return (clamped to 1..5)",
    });
    return parser;
}
function createUseParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills use",
        description: "Run a source skill command without installing it permanently",
        handler: async (ctx) => {
            const args = ctx.args;
            const skillName = requireStringArg("skill", args.skill);
            const commandName = requireStringArg("command", args.command);
            const commandArgs = normalizeStringArray(args.arg);
            await withResolvedSourceSkills(async (skills) => {
                const skill = findSourceSkillByName(skills, skillName);
                const result = await useSourceSkillCommand(skill, commandName, commandArgs);
                if (result.exitCode !== 0) {
                    throw new Error(`Skill command '${skillName}/${commandName}' exited with code ${result.exitCode}`);
                }
            });
        },
    });
    addCommandInvocationFlags(parser);
    return parser;
}
function createRunParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills run",
        description: "Execute an installed or runnable skill command",
        handler: async (ctx) => {
            const args = ctx.args;
            const skillName = requireStringArg("skill", args.skill);
            const commandName = requireStringArg("command", args.command);
            const commandArgs = normalizeStringArray(args.arg);
            const skill = await findRunnableSkillByName(skillName, commandName);
            if (!skill) {
                throw new Error(`Skill command not found: ${skillName}/${commandName}`);
            }
            await runSkillCommand(skill, commandName, commandArgs);
        },
    });
    addCommandInvocationFlags(parser);
    return parser;
}
function createUpdateParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills update",
        description: "Update installed skills from source",
        handler: async (ctx) => {
            const args = ctx.args;
            const mutationOptions = createMutationOptions(args);
            await withResolvedSourceSkills(async (skills) => {
                const selectedSkills = args.all
                    ? skills
                    : [findSourceSkillByName(skills, requireStringArg("skill", args.skill))];
                for (const skill of selectedSkills) {
                    const result = await updateSkill(skill, mutationOptions);
                    printOperationResult("update", result);
                }
            });
        },
    });
    createCommonMutationFlags(parser);
    addSkillFlag(parser, "Skill name to update");
    parser.addFlag({
        name: "all",
        options: ["--all"],
        type: "boolean",
        flagOnly: true,
        description: "Update all source skills",
    });
    return parser;
}
function createResetParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills reset",
        description: "Rebuild runtime, bins, and compatibility links for an installed skill",
        handler: async (ctx) => {
            const args = ctx.args;
            const mutationOptions = createMutationOptions(args);
            const result = await resetSkill(requireStringArg("skill", args.skill), mutationOptions);
            printOperationResult("reset", result);
        },
    });
    createCommonMutationFlags(parser);
    addSkillFlag(parser, "Skill name to reset");
    return parser;
}
function createUninstallParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills uninstall",
        description: "Remove installed skill state from a scope",
        handler: async (ctx) => {
            const args = ctx.args;
            const result = await uninstallSkill(requireStringArg("skill", args.skill), {
                scope: normalizeScope(args),
                dryRun: Boolean(args.dryRun),
            });
            printOperationResult("uninstall", result);
        },
    });
    addScopeFlags(parser);
    addDryRunFlag(parser);
    addSkillFlag(parser, "Skill name to uninstall");
    return parser;
}
function createPurgeParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills purge",
        description: "Uninstall a skill and remove its declared external state",
        handler: async (ctx) => {
            const args = ctx.args;
            const result = await purgeSkill(requireStringArg("skill", args.skill), {
                scope: normalizeScope(args),
                dryRun: Boolean(args.dryRun),
            });
            printOperationResult("purge", result);
        },
    });
    addScopeFlags(parser);
    addDryRunFlag(parser);
    addSkillFlag(parser, "Skill name to purge");
    return parser;
}
function createValidateParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills validate",
        description: "Validate installed skills and exported command links",
        handler: async (ctx) => {
            const args = ctx.args;
            const scopes = args.local || args.global ? [normalizeScope(args)] : ["local", "global"];
            const allIssues = [];
            for (const scope of scopes) {
                if (args.skill) {
                    const issues = await validateSkill(args.skill, scope);
                    allIssues.push(...issues);
                    continue;
                }
                const issues = await validateAllInstalledSkills(scope);
                allIssues.push(...issues);
            }
            if (allIssues.length === 0) {
                console.log("validate: no issues found");
                return;
            }
            for (const issue of allIssues) {
                console.log(`${issue.severity.toUpperCase()} ${issue.skill}: ${issue.message}`);
            }
            if (allIssues.some((issue) => issue.severity === "error")) {
                process.exitCode = 1;
            }
        },
    });
    addScopeFlags(parser);
    addSkillFlag(parser, "Validate one installed skill");
    return parser;
}
function createPruneParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills prune",
        description: "Remove dangling command links and compatibility exports",
        handler: async (ctx) => {
            const args = ctx.args;
            const scopes = args.local || args.global ? [normalizeScope(args)] : ["local", "global"];
            const dryRun = Boolean(args.dryRun);
            for (const scope of scopes) {
                const removed = await pruneInstall(scope, dryRun);
                console.log(`${dryRun ? "[dry-run] " : ""}prune (${scope}): ${removed.length} removed`);
                for (const removedPath of removed) {
                    console.log(`  - ${removedPath}`);
                }
            }
        },
    });
    addScopeFlags(parser);
    addDryRunFlag(parser);
    return parser;
}
function createCleanParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills clean",
        description: "Remove stale tool-owned residue and dangling links",
        handler: async (ctx) => {
            const args = ctx.args;
            const scopes = args.local || args.global ? [normalizeScope(args)] : ["local", "global"];
            const dryRun = Boolean(args.dryRun);
            for (const scope of scopes) {
                const removed = await cleanInstall(scope, dryRun);
                console.log(`${dryRun ? "[dry-run] " : ""}clean (${scope}): ${removed.length} removed`);
                for (const removedPath of removed) {
                    console.log(`  - ${removedPath}`);
                }
            }
        },
    });
    addScopeFlags(parser);
    addDryRunFlag(parser);
    return parser;
}
function createPrintMcpConfigParser() {
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills print-mcp-config",
        description: "Print a JSON-only MCP config snippet",
        handler: async (ctx) => {
            const args = ctx.args;
            process.stdout.write(`${JSON.stringify(buildMcpConfigSnippet(normalizeSkillPolicy(args)), null, 2)}\n`);
        },
    });
    addSkillPolicyFlags(parser);
    return parser;
}
function registerMcpTools(parser, policy) {
    parser.addTool({
        name: "find",
        description: "Find the most relevant source skills for a free-text request",
        flags: [
            {
                name: "query",
                options: ["--query"],
                type: "string",
                mandatory: true,
                description: "Free-text request to match against source skills",
            },
            {
                name: "limit",
                options: ["--limit"],
                type: "number",
                description: "Maximum number of results to return (clamped to 1..5)",
            },
        ],
        handler: async (value) => {
            const args = unwrapToolArgs(value);
            const results = await withResolvedSourceSkills(async (skills) => searchCatalogSkills(skills, args.query, { limit: args.limit, policy }));
            return {
                items: results.map((result) => ({
                    name: result.skill.name,
                    description: result.skill.description,
                    exportedCommands: result.skill.exportedCommands,
                    reasons: result.reasons,
                    score: result.score,
                })),
                count: results.length,
                hasMore: false,
            };
        },
    });
    parser.addTool({
        name: "use",
        description: "Run a source skill command without installing it permanently",
        flags: [
            {
                name: "skill",
                options: ["--skill"],
                type: "string",
                mandatory: true,
                description: "Source skill name",
            },
            {
                name: "command",
                options: ["--command"],
                type: "string",
                mandatory: true,
                description: "Exported command name",
            },
            {
                name: "arg",
                options: ["--arg"],
                type: "array",
                allowMultiple: true,
                description: "Command argument (repeat flag for multiple)",
            },
        ],
        handler: async (value) => {
            const args = unwrapToolArgs(value);
            assertSkillAllowed(args.skill, "use", policy);
            return withResolvedSourceSkills(async (skills) => {
                const skill = findSourceSkillByName(skills, args.skill);
                return useSourceSkillCommand(skill, args.command, normalizeStringArray(args.arg), {
                    captureOutput: true,
                });
            });
        },
    });
    parser.addTool({
        name: "install",
        description: "Install a source skill into the canonical .agents layout",
        flags: [
            {
                name: "skill",
                options: ["--skill"],
                type: "string",
                mandatory: true,
                description: "Source skill name",
            },
            {
                name: "local",
                options: ["--local"],
                type: "boolean",
                flagOnly: true,
                description: "Use local install scope (./.agents)",
            },
            {
                name: "global",
                options: ["--global"],
                type: "boolean",
                flagOnly: true,
                description: "Use global install scope (~/.agents)",
            },
            {
                name: "dryRun",
                options: ["--dry-run"],
                type: "boolean",
                flagOnly: true,
                description: "Preview actions without changing files",
            },
            {
                name: "commands",
                options: ["--commands"],
                type: "boolean",
                flagOnly: true,
                description: "Install optional command adapters",
            },
            {
                name: "noCommands",
                options: ["--no-commands"],
                type: "boolean",
                flagOnly: true,
                description: "Skip optional command adapters",
            },
            {
                name: "client",
                options: ["--client"],
                type: "array",
                allowMultiple: true,
                description: "Compatibility export targets (repeat flag for multiple)",
            },
        ],
        handler: async (value) => {
            const args = unwrapToolArgs(value);
            assertSkillAllowed(args.skill, "install", policy);
            return withResolvedSourceSkills(async (skills) => {
                const skill = findSourceSkillByName(skills, args.skill);
                return installSkill(skill, createMutationOptions(args));
            });
        },
    });
}
function addSubCommand(parser, name, description, commandParser) {
    parser.addSubCommand({
        name,
        description,
        parser: commandParser,
    });
}
export function createRootParser(rawArgv = process.argv.slice(2)) {
    const policy = extractSkillAccessPolicy(rawArgv);
    const parser = new ArgParser({
        appName: "Agent Skills",
        appCommandName: "agent-skills",
        description: "Install, list, find, and run Agent Skills from source or installed state, with MCP-ready workflows.",
        triggerAutoHelpIfNoHandler: true,
    }).use(mcpPlugin({
        serverInfo: {
            name: "agent-skills",
            version: "2.0.0",
            description: "Install, find, and use Agent Skills over MCP",
        },
        toolOptions: {
            includeSubCommands: false,
        },
        defaultTransport: { type: "stdio" },
    }));
    addSkillPolicyFlags(parser);
    registerMcpTools(parser, policy);
    addSubCommand(parser, "install", "Install or reconcile a source skill", createInstallParser());
    addSubCommand(parser, "list", "List source skills with descriptions", createListParser());
    addSubCommand(parser, "find", "Find relevant source skills for free-text requests", createFindParser());
    addSubCommand(parser, "use", "Run a source skill without installing it", createUseParser());
    addSubCommand(parser, "run", "Execute an installed or runnable skill command", createRunParser());
    addSubCommand(parser, "validate", "Validate installed skills", createValidateParser());
    addSubCommand(parser, "update", "Update source skills", createUpdateParser());
    addSubCommand(parser, "uninstall", "Remove installed skill state", createUninstallParser());
    addSubCommand(parser, "prune", "Remove dangling links and exports", createPruneParser());
    addSubCommand(parser, "reset", "Rebuild links and runtime for an installed skill", createResetParser());
    addSubCommand(parser, "clean", "Remove stale tool-owned residue", createCleanParser());
    addSubCommand(parser, "purge", "Remove installed state and declared external files", createPurgeParser());
    addSubCommand(parser, "print-mcp-config", "Print a JSON-only MCP config snippet", createPrintMcpConfigParser());
    return parser;
}
function isFlag(value) {
    return value.startsWith("-");
}
function injectSkillFlag(argv) {
    if (argv.length === 0 || isFlag(argv[0])) {
        return argv;
    }
    return ["--skill", argv[0], ...argv.slice(1)];
}
function injectFindQuery(argv) {
    if (argv.length === 0 || isFlag(argv[0])) {
        return argv;
    }
    const firstFlagIndex = argv.findIndex(isFlag);
    if (firstFlagIndex === -1) {
        return ["--query", argv.join(" ")];
    }
    return ["--query", argv.slice(0, firstFlagIndex).join(" "), ...argv.slice(firstFlagIndex)];
}
function injectCommandInvocation(argv) {
    if (argv.length < 2 || isFlag(argv[0])) {
        return argv;
    }
    return [
        "--skill",
        argv[0],
        "--command",
        argv[1],
        ...argv.slice(2).flatMap((value) => ["--arg", value]),
    ];
}
export function normalizeCliArgv(argv) {
    if (argv.length === 0) {
        return argv;
    }
    const [verb, ...rest] = argv;
    switch (verb) {
        case "install":
        case "update":
        case "reset":
        case "uninstall":
        case "purge":
        case "validate":
            return [verb, ...injectSkillFlag(rest)];
        case "find":
            return [verb, ...injectFindQuery(rest)];
        case "run":
        case "use":
            return [verb, ...injectCommandInvocation(rest)];
        default:
            return argv;
    }
}
async function main() {
    const rawArgv = process.argv.slice(2);
    const parser = createRootParser(rawArgv);
    await parser.parse(normalizeCliArgv(rawArgv));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
//# sourceMappingURL=installer.js.map