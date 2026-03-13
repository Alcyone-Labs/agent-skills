#!/usr/bin/env node

import { ArgParser, type IHandlerContext } from "@alcyone-labs/arg-parser";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import {
  cleanInstall,
  installSkill,
  pruneInstall,
  purgeSkill,
  resetSkill,
  runSkillCommand,
  uninstallSkill,
  updateSkill,
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
  type SkillInfo,
} from "./core/types.js";

const REPO_URL = "https://github.com/Alcyone-Labs/agent-skills.git";

type SharedFlags = {
  local?: boolean;
  global?: boolean;
  dryRun?: boolean;
  commands?: boolean;
  noCommands?: boolean;
  client?: string[];
};

function normalizeScope(args: SharedFlags): MutationOptions["scope"] {
  if (args.local) {
    return "local";
  }

  return "global";
}

function normalizeCompatibilityClients(values: string[] | undefined): CompatibilityClient[] {
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

      if (value.toLowerCase() === "droid" || value.toLowerCase() === "factory") {
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

function printOperationResult(
  action: string,
  result: {
    skill: string;
    scope: string;
    dryRun: boolean;
    changedPaths: string[];
    compatibilityClients?: string[];
  },
): void {
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

function preparePositionalSkillArgs(argv: string[]): string[] {
  if (argv.length === 0) {
    return argv;
  }

  if (argv[0].startsWith("-")) {
    return argv;
  }

  return ["--skill", argv[0], ...argv.slice(1)];
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

function createCommonMutationFlags(parser: ArgParser): void {
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

  parser.addFlag({
    name: "dryRun",
    options: ["--dry-run"],
    type: "boolean",
    flagOnly: true,
    description: "Preview actions without changing files",
  });

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
    description: "Compatibility export targets (repeat flag for multiple)",
  });
}

function createInstallParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills install",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { all?: boolean; skill?: string };
      const source = await resolveSourceSkills();

      try {
        const selectedSkills = args.all
          ? source.skills
          : source.skills.filter((skill) => skill.name === args.skill);

        if (selectedSkills.length === 0) {
          throw new Error(`Skill not found in source set: ${args.skill ?? "(unspecified)"}`);
        }

        const mutationOptions = createMutationOptions(args);
        for (const skill of selectedSkills) {
          const result = await installSkill(skill, mutationOptions);
          printOperationResult("install", result);
        }
      } finally {
        source.cleanup?.();
      }
    },
  });

  createCommonMutationFlags(parser);

  parser.addFlag({
    name: "skill",
    options: ["--skill", "-s"],
    type: "string",
    description: "Skill name to install",
  });

  parser.addFlag({
    name: "all",
    options: ["--all"],
    type: "boolean",
    flagOnly: true,
    description: "Install all source skills",
  });

  return parser;
}

function createUpdateParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills update",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { all?: boolean; skill?: string };
      const source = await resolveSourceSkills();

      try {
        const selectedSkills = args.all
          ? source.skills
          : source.skills.filter((skill) => skill.name === args.skill);

        if (selectedSkills.length === 0) {
          throw new Error(`Skill not found in source set: ${args.skill ?? "(unspecified)"}`);
        }

        const mutationOptions = createMutationOptions(args);
        for (const skill of selectedSkills) {
          const result = await updateSkill(skill, mutationOptions);
          printOperationResult("update", result);
        }
      } finally {
        source.cleanup?.();
      }
    },
  });

  createCommonMutationFlags(parser);

  parser.addFlag({
    name: "skill",
    options: ["--skill", "-s"],
    type: "string",
    description: "Skill name to update",
  });

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
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { skill?: string };
      if (!args.skill) {
        throw new Error("--skill is required");
      }

      const mutationOptions = createMutationOptions(args);
      const result = await resetSkill(args.skill, mutationOptions);
      printOperationResult("reset", result);
    },
  });

  createCommonMutationFlags(parser);
  parser.addFlag({
    name: "skill",
    options: ["--skill", "-s"],
    type: "string",
    description: "Skill name to reset",
  });

  return parser;
}

function createUninstallParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills uninstall",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { skill?: string };
      if (!args.skill) {
        throw new Error("--skill is required");
      }

      const result = await uninstallSkill(args.skill, {
        scope: normalizeScope(args),
        dryRun: Boolean(args.dryRun),
      });
      printOperationResult("uninstall", result);
    },
  });

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

  parser.addFlag({
    name: "dryRun",
    options: ["--dry-run"],
    type: "boolean",
    flagOnly: true,
    description: "Preview actions without changing files",
  });

  parser.addFlag({
    name: "skill",
    options: ["--skill", "-s"],
    type: "string",
    description: "Skill name to uninstall",
  });

  return parser;
}

function createPurgeParser(): ArgParser {
  const parser = new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills purge",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as SharedFlags & { skill?: string };
      if (!args.skill) {
        throw new Error("--skill is required");
      }

      const result = await purgeSkill(args.skill, {
        scope: normalizeScope(args),
        dryRun: Boolean(args.dryRun),
      });
      printOperationResult("purge", result);
    },
  });

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

  parser.addFlag({
    name: "dryRun",
    options: ["--dry-run"],
    type: "boolean",
    flagOnly: true,
    description: "Preview actions without changing files",
  });

  parser.addFlag({
    name: "skill",
    options: ["--skill", "-s"],
    type: "string",
    description: "Skill name to purge",
  });

  return parser;
}

function createValidateParser(): ArgParser {
  return new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills validate",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as { local?: boolean; global?: boolean; skill?: string };
      const scopes: Array<"local" | "global"> =
        args.local || args.global ? [normalizeScope(args)] : ["local", "global"];
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

      const hasErrors = allIssues.some((issue) => issue.severity === "error");
      if (hasErrors) {
        process.exitCode = 1;
      }
    },
  })
    .addFlag({
      name: "global",
      options: ["--global", "-g"],
      type: "boolean",
      flagOnly: true,
      description: "Validate global install scope",
    })
    .addFlag({
      name: "local",
      options: ["--local", "-l"],
      type: "boolean",
      flagOnly: true,
      description: "Validate local install scope",
    })
    .addFlag({
      name: "skill",
      options: ["--skill", "-s"],
      type: "string",
      description: "Validate one installed skill",
    });
}

function createPruneParser(): ArgParser {
  return new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills prune",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as { local?: boolean; global?: boolean; dryRun?: boolean };
      const scopes: Array<"local" | "global"> =
        args.local || args.global ? [normalizeScope(args)] : ["local", "global"];
      const dryRun = Boolean(args.dryRun);

      for (const scope of scopes) {
        const removed = await pruneInstall(scope, dryRun);
        console.log(`${dryRun ? "[dry-run] " : ""}prune (${scope}): ${removed.length} removed`);
        for (const removedPath of removed) {
          console.log(`  - ${removedPath}`);
        }
      }
    },
  })
    .addFlag({
      name: "global",
      options: ["--global", "-g"],
      type: "boolean",
      flagOnly: true,
      description: "Prune global scope",
    })
    .addFlag({
      name: "local",
      options: ["--local", "-l"],
      type: "boolean",
      flagOnly: true,
      description: "Prune local scope",
    })
    .addFlag({
      name: "dryRun",
      options: ["--dry-run"],
      type: "boolean",
      flagOnly: true,
      description: "Preview changes",
    });
}

function createCleanParser(): ArgParser {
  return new ArgParser({
    appName: "Agent Skills",
    appCommandName: "agent-skills clean",
    handler: async (ctx: IHandlerContext) => {
      const args = ctx.args as { local?: boolean; global?: boolean; dryRun?: boolean };
      const scopes: Array<"local" | "global"> =
        args.local || args.global ? [normalizeScope(args)] : ["local", "global"];
      const dryRun = Boolean(args.dryRun);

      for (const scope of scopes) {
        const removed = await cleanInstall(scope, dryRun);
        console.log(`${dryRun ? "[dry-run] " : ""}clean (${scope}): ${removed.length} removed`);
        for (const removedPath of removed) {
          console.log(`  - ${removedPath}`);
        }
      }
    },
  })
    .addFlag({
      name: "global",
      options: ["--global", "-g"],
      type: "boolean",
      flagOnly: true,
      description: "Clean global scope",
    })
    .addFlag({
      name: "local",
      options: ["--local", "-l"],
      type: "boolean",
      flagOnly: true,
      description: "Clean local scope",
    })
    .addFlag({
      name: "dryRun",
      options: ["--dry-run"],
      type: "boolean",
      flagOnly: true,
      description: "Preview changes",
    });
}

async function runCommand(argv: string[]): Promise<void> {
  const [verb, ...rest] = argv;

  const isHelp = verb === "help" || verb === "--help" || verb === "-h";
  if (!verb || isHelp) {
    console.log("Usage: agent-skills <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("  install <skill>       Install or reconcile a skill");
    console.log("  run <skill> <bin>     Execute a skill command");
    console.log("  validate [skill]      Validate installed skills");
    console.log("  update [skill]        Update a skill from source");
    console.log("  uninstall <skill>     Remove installed skill state");
    console.log("  prune                 Remove dangling links/exports");
    console.log("  reset <skill>         Rebuild links and runtime");
    console.log("  clean                 Remove stale tool-owned residue");
    console.log("  purge <skill>         Uninstall and remove declared external state");
    process.exitCode = isHelp ? 0 : 1;
    return;
  }

  switch (verb) {
    case "install": {
      const parser = createInstallParser();
      await parser.parse([...preparePositionalSkillArgs(rest)]);
      return;
    }
    case "update": {
      const parser = createUpdateParser();
      await parser.parse([...preparePositionalSkillArgs(rest)]);
      return;
    }
    case "reset": {
      const parser = createResetParser();
      await parser.parse([...preparePositionalSkillArgs(rest)]);
      return;
    }
    case "uninstall": {
      const parser = createUninstallParser();
      await parser.parse([...preparePositionalSkillArgs(rest)]);
      return;
    }
    case "purge": {
      const parser = createPurgeParser();
      await parser.parse([...preparePositionalSkillArgs(rest)]);
      return;
    }
    case "validate": {
      const parser = createValidateParser();
      const args = preparePositionalSkillArgs(rest);
      await parser.parse([...args]);
      return;
    }
    case "prune": {
      const parser = createPruneParser();
      await parser.parse([...rest]);
      return;
    }
    case "clean": {
      const parser = createCleanParser();
      await parser.parse([...rest]);
      return;
    }
    case "run": {
      if (rest.length < 2) {
        throw new Error("Usage: agent-skills run <skill> <skill-bin> [args...]");
      }

      const [skillName, commandName, ...commandArgs] = rest;
      const skill = await findRunnableSkillByName(skillName, commandName);

      if (!skill) {
        throw new Error(`Skill command not found: ${skillName}/${commandName}`);
      }

      await runSkillCommand(skill, commandName, commandArgs);
      return;
    }
    default:
      throw new Error(`Unknown command: ${verb}`);
  }
}

async function main(): Promise<void> {
  await runCommand(process.argv.slice(2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
