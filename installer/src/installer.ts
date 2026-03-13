#!/usr/bin/env node

import {
  ArgParser,
  SimpleChalk,
  type IHandlerContext,
} from "@alcyone-labs/arg-parser";
import { mcpPlugin, type IMcpMethods } from "@alcyone-labs/arg-parser-mcp";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import {
  assertSkillAllowed,
  listCatalogSkills,
  searchCatalogSkills,
} from "./core/catalog.js";
import {
  buildMcpConfigSnippet,
  extractSkillAccessPolicy,
} from "./core/mcp-config.js";
import { SOURCE_SKILL_INDEX } from "./core/source-skill-index.generated.js";
import {
  cleanInstall,
  installSkill,
  purgeSkill,
  pruneInstall,
  resetSkill,
  runSkillCommand,
  uninstallSkill,
  updateSkill,
  useSourceSkillCommand,
  validateAllInstalledSkills,
  validateSkill,
} from "./core/installer.js";
import {
  discoverSkillsInDirectory,
  discoverSourceSkills,
  findRunnableSkillByName,
} from "./core/skill-discovery.js";
import {
  AVAILABLE_CLIENTS,
  type CompatibilityClient,
  type MutationOptions,
  type SkillAccessPolicy,
  type SkillCatalogEntry,
  type SkillInfo,
  type SkillSearchResult,
} from "./core/types.js";

const REPO_URL = "https://github.com/Alcyone-Labs/agent-skills.git";
const DEFAULT_FIND_LIMIT = 5;

type SharedFlags = {
  local?: boolean;
  global?: boolean;
  dryRun?: boolean;
  commands?: boolean;
  noCommands?: boolean;
  client?: string[];
};

type SkillPolicyFlags = {
  allowSkill?: string[];
  denySkill?: string[];
};

type McpEnabledParser = ArgParser & IMcpMethods;

function normalizeScope(args: SharedFlags): MutationOptions["scope"] {
  if (args.local) {
    return "local";
  }

  return "global";
}

function normalizeStringArray(values: unknown): string[] {
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

function normalizeCompatibilityClients(
  values: string[] | undefined,
): CompatibilityClient[] {
  if (!values || values.length === 0) {
    return [];
  }

  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => {
      const directMatch = AVAILABLE_CLIENTS.find(
        (client) => client.toLowerCase() === value.toLowerCase(),
      );

      if (directMatch) {
        return directMatch;
      }

      if (
        value.toLowerCase() === "droid" ||
        value.toLowerCase() === "factory"
      ) {
        return "FactoryAI Droid";
      }

      throw new Error(`Unsupported compatibility client: ${value}`);
    });

  return Array.from(new Set(normalized));
}

function createMutationOptions(args: SharedFlags): MutationOptions {
  return {
    scope: normalizeScope(args),
    dryRun: Boolean(args.dryRun),
    installCommandAdapters: args.noCommands ? false : Boolean(args.commands),
    compatibilityClients: normalizeCompatibilityClients(args.client),
  };
}

function normalizeSkillPolicy(args: SkillPolicyFlags): SkillAccessPolicy {
  return {
    allowSkills: normalizeStringArray(args.allowSkill),
    denySkills: normalizeStringArray(args.denySkill),
  };
}

function unwrapToolArgs<T>(value: T | { args: T }): T {
  if (typeof value === "object" && value !== null && "args" in value) {
    return (value as { args: T }).args;
  }

  return value as T;
}

function terminalTextWidth(): number {
  const columns = process.stdout.columns ?? 100;
  return Math.max(60, Math.min(columns, 120));
}

function wrapText(text: string, width: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
    if (nextLine.length <= width || currentLine.length === 0) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function formatWrappedBlock(
  label: string,
  text: string,
  indent: string,
  styledLabel = label,
): string[] {
  const lines = wrapText(`${label}${text}`, terminalTextWidth() - indent.length);
  if (lines.length === 0) {
    return [];
  }

  return lines.map((line, index) => {
    if (index === 0 && label.length > 0 && line.startsWith(label)) {
      return `${indent}${styledLabel}${line.slice(label.length)}`;
    }

    return `${indent}${line}`;
  });
}

function formatCatalogEntry(entry: SkillCatalogEntry, prefix = ""): string[] {
  return [
    `${prefix}${SimpleChalk.cyan.bold(entry.name)}`,
    ...formatWrappedBlock("", entry.description ?? "(no description)", "  "),
  ];
}

function formatSearchResult(result: SkillSearchResult, index: number): string[] {
  const rankPrefix = `${SimpleChalk.yellow.bold(`${index + 1}.`)}` + " ";
  return [
    ...formatCatalogEntry(result.skill, rankPrefix),
    ...formatWrappedBlock(
      "Why: ",
      result.reasons.join("; "),
      "   ",
      SimpleChalk.blue.bold("Why: "),
    ),
  ];
}

function formatOperationResult(
  action: string,
  result: {
    skill: string;
    scope: string;
    dryRun: boolean;
    changedPaths: string[];
    compatibilityClients?: string[];
  },
): string[] {
  const mode = result.dryRun ? "[dry-run] " : "";
  const lines = [`${mode}${action}: ${result.skill} (${result.scope})`];

  if (result.compatibilityClients && result.compatibilityClients.length > 0) {
    lines.push(`compatibility exports: ${result.compatibilityClients.join(", ")}`);
  }

  if (result.changedPaths.length === 0) {
    lines.push("changes: none");
    return lines;
  }

  lines.push("changed paths:");
  for (const changedPath of result.changedPaths) {
    lines.push(`  - ${changedPath}`);
  }

  return lines;
}

function emitLoggerLines(
  logger: Pick<Console, "log">,
  lines: string[],
): void {
  for (const line of lines) {
    logger.log(line);
  }
}

function findSourceSkillByName(
  skills: SkillInfo[],
  skillName: string,
): SkillInfo {
  const skill = skills.find((candidate) => candidate.name === skillName);
  if (!skill) {
    throw new Error(`Skill not found in source set: ${skillName}`);
  }

  return skill;
}

async function fetchSourceSkillsFromGitHub(): Promise<{
  skills: SkillInfo[];
  cleanup: () => void;
}> {
  const tempDir = mkdtempSync(join(tmpdir(), "agent-skills-"));

  try {
    execSync(`git clone --depth 1 --quiet "${REPO_URL}" "${tempDir}"`, {
      stdio: "pipe",
    });
  } catch {
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
      } catch {
        // Ignore cleanup errors.
      }
    },
  };
}

async function resolveSourceSkills(): Promise<{
  skills: SkillInfo[];
  cleanup?: () => void;
}> {
  const localSource = await discoverSourceSkills();
  if (localSource.length > 0) {
    return { skills: localSource };
  }

  return fetchSourceSkillsFromGitHub();
}

async function withResolvedSourceSkills<T>(
  callback: (skills: SkillInfo[]) => Promise<T>,
): Promise<T> {
  const source = await resolveSourceSkills();

  try {
    return await callback(source.skills);
  } finally {
    source.cleanup?.();
  }
}

function addScopeFlags(parser: ArgParser): void {
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

function addDryRunFlag(parser: ArgParser): void {
  parser.addFlag({
    name: "dryRun",
    options: ["--dry-run"],
    type: "boolean",
    flagOnly: true,
    description: "Preview actions without changing files",
  });
}

function addSkillPolicyFlags(parser: ArgParser): void {
  parser.addFlag({
    name: "allowSkill",
    options: ["--allow-skill"],
    type: "array",
    allowMultiple: true,
    description:
      "Allow-list a skill for MCP operations (repeat flag for multiple)",
  });
  parser.addFlag({
    name: "denySkill",
    options: ["--deny-skill"],
    type: "array",
    allowMultiple: true,
    description:
      "Deny-list a skill for MCP operations (repeat flag for multiple)",
  });
}

function createCommonMutationFlags(parser: ArgParser): void {
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

function addSkillFlag(
  parser: ArgParser,
  description: string,
  mandatory?: boolean | ((parsedArgs: Record<string, unknown>) => boolean),
): void {
  parser.addFlag({
    name: "skill",
    options: ["--skill", "-s"],
    type: "string",
    description,
    mandatory,
  });
}

function addCommandInvocationFlags(parser: ArgParser): void {
  addSkillFlag(parser, "Skill name", true);
  parser.addFlag({
    name: "command",
    options: ["--command"],
    type: "string",
    description: "Exported command name",
    mandatory: true,
  });
  parser.addFlag({
    name: "arg",
    options: ["--arg"],
    type: "array",
    allowMultiple: true,
    description: "Command argument (repeat flag for multiple)",
  });
}

function createInstallParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills install",
    description: "Install source skills into the canonical .agents layout",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { all?: boolean; skill?: string };
      const mutationOptions = createMutationOptions(args);

      await withResolvedSourceSkills(async (skills) => {
        const selectedSkills = args.all
          ? skills
          : [findSourceSkillByName(skills, args.skill as string)];

        for (const skill of selectedSkills) {
          const result = await installSkill(skill, mutationOptions);
          emitLoggerLines(ctx.logger, formatOperationResult("install", result));
        }
      });
    },
  });

  createCommonMutationFlags(parser);
  addSkillFlag(
    parser,
    "Skill name to install",
    (parsedArgs) => !Boolean(parsedArgs.all),
  );
  parser.addFlag({
    name: "all",
    options: ["--all"],
    type: "boolean",
    flagOnly: true,
    description: "Install all source skills",
  });

  return parser;
}

function createListParser(): ArgParser {
  return new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills list",
    description: "List source skills with descriptions",
    handler: async (ctx: IHandlerContext) => {
      const entries = listCatalogSkills(SOURCE_SKILL_INDEX);
      if (entries.length === 0) {
        emitLoggerLines(ctx.logger, [SimpleChalk.dim("No source skills found.")]);
        return;
      }

      const lines = entries.flatMap((entry, index) =>
        index === 0 ? formatCatalogEntry(entry) : ["", ...formatCatalogEntry(entry)],
      );
      emitLoggerLines(ctx.logger, lines);
    },
  });
}

function createFindParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills find",
    description: "Find the most relevant source skills for a free-text request",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as { query: string; limit?: number };
      const limit = args.limit ?? DEFAULT_FIND_LIMIT;

      const results = searchCatalogSkills(SOURCE_SKILL_INDEX, args.query, { limit });
      if (results.length === 0) {
        emitLoggerLines(ctx.logger, [SimpleChalk.dim("No matching source skills found.")]);
        return;
      }

      const lines = results.flatMap((result, index) =>
        index === 0 ? formatSearchResult(result, index) : ["", ...formatSearchResult(result, index)],
      );
      emitLoggerLines(ctx.logger, lines);
    },
  });

  parser.addFlag({
    name: "query",
    options: ["--query", "-q"],
    type: "string",
    description: "Free-text request to match against source skills",
    mandatory: true,
  });
  parser.addFlag({
    name: "limit",
    options: ["--limit", "-n"],
    type: "number",
    description: "Maximum number of results to return (clamped to 1..5)",
  });

  return parser;
}

function createUseParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills use",
    description: "Run a source skill command without installing it permanently",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as {
        skill: string;
        command: string;
        arg?: string[];
      };
      const skillName = args.skill;
      const commandName = args.command;
      const commandArgs = normalizeStringArray(args.arg);

      await withResolvedSourceSkills(async (skills) => {
        const skill = findSourceSkillByName(skills, skillName);
        const result = await useSourceSkillCommand(
          skill,
          commandName,
          commandArgs,
        );
        if (result.exitCode !== 0) {
          throw new Error(
            `Skill command '${skillName}/${commandName}' exited with code ${result.exitCode}`,
          );
        }
      });
    },
  });

  addCommandInvocationFlags(parser);
  return parser;
}

function createRunParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills run",
    description: "Execute an installed or runnable skill command",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as {
        skill: string;
        command: string;
        arg?: string[];
      };
      const skillName = args.skill;
      const commandName = args.command;
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

function createUpdateParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills update",
    description: "Update installed skills from source",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { all?: boolean; skill?: string };
      const mutationOptions = createMutationOptions(args);

      await withResolvedSourceSkills(async (skills) => {
        const selectedSkills = args.all
          ? skills
          : [findSourceSkillByName(skills, args.skill as string)];

        for (const skill of selectedSkills) {
          const result = await updateSkill(skill, mutationOptions);
          emitLoggerLines(ctx.logger, formatOperationResult("update", result));
        }
      });
    },
  });

  createCommonMutationFlags(parser);
  addSkillFlag(
    parser,
    "Skill name to update",
    (parsedArgs) => !Boolean(parsedArgs.all),
  );
  parser.addFlag({
    name: "all",
    options: ["--all"],
    type: "boolean",
    flagOnly: true,
    description: "Update all source skills",
  });

  return parser;
}

function createResetParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills reset",
    description:
      "Rebuild runtime, bins, and compatibility links for an installed skill",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { skill: string };
      const mutationOptions = createMutationOptions(args);
      const result = await resetSkill(args.skill, mutationOptions);
      emitLoggerLines(ctx.logger, formatOperationResult("reset", result));
    },
  });

  createCommonMutationFlags(parser);
  addSkillFlag(parser, "Skill name to reset", true);
  return parser;
}

function createUninstallParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills uninstall",
    description: "Remove installed skill state from a scope",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { skill: string };
      const result = await uninstallSkill(args.skill, {
        scope: normalizeScope(args),
        dryRun: Boolean(args.dryRun),
      });
      emitLoggerLines(ctx.logger, formatOperationResult("uninstall", result));
    },
  });

  addScopeFlags(parser);
  addDryRunFlag(parser);
  addSkillFlag(parser, "Skill name to uninstall", true);
  return parser;
}

function createPurgeParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills purge",
    description: "Uninstall a skill and remove its declared external state",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { skill: string };
      const result = await purgeSkill(args.skill, {
        scope: normalizeScope(args),
        dryRun: Boolean(args.dryRun),
      });
      emitLoggerLines(ctx.logger, formatOperationResult("purge", result));
    },
  });

  addScopeFlags(parser);
  addDryRunFlag(parser);
  addSkillFlag(parser, "Skill name to purge", true);
  return parser;
}

function createValidateParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills validate",
    description: "Validate installed skills and exported command links",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as {
        local?: boolean;
        global?: boolean;
        skill?: string;
      };
      const scopes: Array<"local" | "global"> =
        args.local || args.global
          ? [normalizeScope(args)]
          : ["local", "global"];
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
        emitLoggerLines(ctx.logger, ["validate: no issues found"]);
        return;
      }

      emitLoggerLines(
        ctx.logger,
        allIssues.map((issue) => `${issue.severity.toUpperCase()} ${issue.skill}: ${issue.message}`),
      );

      if (allIssues.some((issue) => issue.severity === "error")) {
        process.exitCode = 1;
      }
    },
  });

  addScopeFlags(parser);
  addSkillFlag(parser, "Validate one installed skill");
  return parser;
}

function createPruneParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills prune",
    description: "Remove dangling command links and compatibility exports",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as {
        local?: boolean;
        global?: boolean;
        dryRun?: boolean;
      };
      const scopes: Array<"local" | "global"> =
        args.local || args.global
          ? [normalizeScope(args)]
          : ["local", "global"];
      const dryRun = Boolean(args.dryRun);

      for (const scope of scopes) {
        const removed = await pruneInstall(scope, dryRun);
        emitLoggerLines(ctx.logger, [
          `${dryRun ? "[dry-run] " : ""}prune (${scope}): ${removed.length} removed`,
          ...removed.map((removedPath) => `  - ${removedPath}`),
        ]);
      }
    },
  });

  addScopeFlags(parser);
  addDryRunFlag(parser);
  return parser;
}

function createCleanParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills clean",
    description: "Remove stale tool-owned residue and dangling links",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as {
        local?: boolean;
        global?: boolean;
        dryRun?: boolean;
      };
      const scopes: Array<"local" | "global"> =
        args.local || args.global
          ? [normalizeScope(args)]
          : ["local", "global"];
      const dryRun = Boolean(args.dryRun);

      for (const scope of scopes) {
        const removed = await cleanInstall(scope, dryRun);
        emitLoggerLines(ctx.logger, [
          `${dryRun ? "[dry-run] " : ""}clean (${scope}): ${removed.length} removed`,
          ...removed.map((removedPath) => `  - ${removedPath}`),
        ]);
      }
    },
  });

  addScopeFlags(parser);
  addDryRunFlag(parser);
  return parser;
}

function createPrintMcpConfigParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills print-mcp-config",
    description: "Print a JSON-only MCP config snippet",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SkillPolicyFlags;
      process.stdout.write(
        `${JSON.stringify(buildMcpConfigSnippet(normalizeSkillPolicy(args)), null, 2)}\n`,
      );
    },
  });

  addSkillPolicyFlags(parser);
  return parser;
}

function registerMcpTools(
  parser: McpEnabledParser,
  policy: SkillAccessPolicy,
): void {
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
    handler: async (
      value:
        | { query: string; limit?: number }
        | { args: { query: string; limit?: number } },
    ) => {
      const args = unwrapToolArgs(value);
      const results = searchCatalogSkills(SOURCE_SKILL_INDEX, args.query, {
        limit: args.limit,
        policy,
      });

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
    handler: async (
      value:
        | { skill: string; command: string; arg?: string[] }
        | { args: { skill: string; command: string; arg?: string[] } },
    ) => {
      const args = unwrapToolArgs(value);
      assertSkillAllowed(args.skill, "use", policy);

      return withResolvedSourceSkills(async (skills) => {
        const skill = findSourceSkillByName(skills, args.skill);
        return useSourceSkillCommand(
          skill,
          args.command,
          normalizeStringArray(args.arg),
          {
            captureOutput: true,
          },
        );
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
    handler: async (
      value:
        | (SharedFlags & { skill: string })
        | { args: SharedFlags & { skill: string } },
    ) => {
      const args = unwrapToolArgs(value);
      assertSkillAllowed(args.skill, "install", policy);

      return withResolvedSourceSkills(async (skills) => {
        const skill = findSourceSkillByName(skills, args.skill);
        return installSkill(skill, createMutationOptions(args));
      });
    },
  });
}

interface SubCommandDefinition {
  name: string;
  description: string;
  createParser: () => ArgParser;
}

const SUBCOMMAND_DEFINITIONS: SubCommandDefinition[] = [
  {
    name: "install",
    description: "Install or reconcile a source skill",
    createParser: createInstallParser,
  },
  {
    name: "list",
    description: "List source skills with descriptions",
    createParser: createListParser,
  },
  {
    name: "find",
    description: "Find relevant source skills for free-text requests",
    createParser: createFindParser,
  },
  {
    name: "use",
    description: "Run a source skill without installing it",
    createParser: createUseParser,
  },
  {
    name: "run",
    description: "Execute an installed or runnable skill command",
    createParser: createRunParser,
  },
  {
    name: "validate",
    description: "Validate installed skills",
    createParser: createValidateParser,
  },
  {
    name: "update",
    description: "Update source skills",
    createParser: createUpdateParser,
  },
  {
    name: "uninstall",
    description: "Remove installed skill state",
    createParser: createUninstallParser,
  },
  {
    name: "prune",
    description: "Remove dangling links and exports",
    createParser: createPruneParser,
  },
  {
    name: "reset",
    description: "Rebuild links and runtime for an installed skill",
    createParser: createResetParser,
  },
  {
    name: "clean",
    description: "Remove stale tool-owned residue",
    createParser: createCleanParser,
  },
  {
    name: "purge",
    description: "Remove installed state and declared external files",
    createParser: createPurgeParser,
  },
  {
    name: "print-mcp-config",
    description: "Print a JSON-only MCP config snippet",
    createParser: createPrintMcpConfigParser,
  },
];

function addSubCommand(
  parser: ArgParser,
  name: string,
  description: string,
  commandParser: ArgParser,
): void {
  parser.addSubCommand({
    name,
    description,
    parser: commandParser,
  });
}

export function createRootParser(
  rawArgv: string[] = process.argv.slice(2),
): ArgParser {
  const policy = extractSkillAccessPolicy(rawArgv);
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills",
    description:
      "Install, list, find, and run Agent Skills from source or installed state, with MCP-ready workflows.",
    triggerAutoHelpIfNoHandler: true,
  }).use(
    mcpPlugin({
      serverInfo: {
        name: "agent-skills",
        version: "2.1.0",
        description: "Install, find, and use Agent Skills over MCP",
      },
      toolOptions: {
        includeSubCommands: false,
      },
      defaultTransport: { type: "stdio" },
    }),
  ) as McpEnabledParser;

  addSkillPolicyFlags(parser);
  registerMcpTools(parser, policy);

  for (const definition of SUBCOMMAND_DEFINITIONS) {
    addSubCommand(
      parser,
      definition.name,
      definition.description,
      definition.createParser(),
    );
  }

  return parser;
}

function isFlag(value: string): boolean {
  return value.startsWith("-");
}

function injectSkillFlag(argv: string[]): string[] {
  if (argv.length === 0 || isFlag(argv[0])) {
    return argv;
  }

  return ["--skill", argv[0], ...argv.slice(1)];
}

function injectFindQuery(argv: string[]): string[] {
  if (argv.length === 0 || isFlag(argv[0])) {
    return argv;
  }

  const firstFlagIndex = argv.findIndex(isFlag);
  if (firstFlagIndex === -1) {
    return ["--query", argv.join(" ")];
  }

  return [
    "--query",
    argv.slice(0, firstFlagIndex).join(" "),
    ...argv.slice(firstFlagIndex),
  ];
}

function injectCommandInvocation(argv: string[]): string[] {
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

export function normalizeCliArgv(argv: string[]): string[] {
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

const HELP_FLAGS = new Set(["--help", "-h"]);

async function tryParseSubcommandHelp(rawArgv: string[]): Promise<boolean> {
  const [commandName, ...rest] = rawArgv;
  if (!commandName || isFlag(commandName) || !rest.some((value) => HELP_FLAGS.has(value))) {
    return false;
  }

  const definition = SUBCOMMAND_DEFINITIONS.find((candidate) => candidate.name === commandName);
  if (!definition) {
    return false;
  }

  // ArgParser handles --help before subcommand resolution, so route directly to the
  // sub-parser to preserve command-specific auto-help without reviving custom required-flag logic.
  await definition.createParser().parse(["--help"]);
  return true;
}

async function main(): Promise<void> {
  const rawArgv = process.argv.slice(2);
  if (await tryParseSubcommandHelp(rawArgv)) {
    return;
  }

  const parser = createRootParser(rawArgv);
  await parser.parse(normalizeCliArgv(rawArgv));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
