import { access, readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import type {
  CompatibilityClient,
  SkillManifest,
  RuntimeStrategy,
  ConfigCheck,
} from "./types.js";

const MANIFEST_FILE = "agent-skills.json";

interface RawManifest {
  schemaVersion?: unknown;
  exportedCommands?: unknown;
  runtime?: {
    strategy?: unknown;
    installCommand?: unknown;
    requiredPaths?: unknown;
  };
  compatibility?: {
    clients?: unknown;
    symlink?: unknown;
  };
  validate?: {
    requiredPaths?: unknown;
    configChecks?: unknown;
  };
  purge?: {
    externalPaths?: unknown;
  };
}

function asStringArray(value: unknown, field: string): string[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error(`${field} must be an array of strings`);
  }

  return value;
}

function parseRuntime(raw: RawManifest["runtime"]): SkillManifest["runtime"] {
  if (!raw) {
    return undefined;
  }

  const strategy = raw.strategy;
  if (strategy !== "none" && strategy !== "npm-in-skill") {
    throw new Error("runtime.strategy must be 'none' or 'npm-in-skill'");
  }

  const installCommand = raw.installCommand;
  if (
    installCommand !== undefined &&
    (!Array.isArray(installCommand) ||
      installCommand.length === 0 ||
      !installCommand.every((entry) => typeof entry === "string"))
  ) {
    throw new Error("runtime.installCommand must be a non-empty string array when present");
  }

  return {
    strategy: strategy as RuntimeStrategy,
    installCommand: installCommand as string[] | undefined,
    requiredPaths: asStringArray(raw.requiredPaths, "runtime.requiredPaths"),
  };
}

function parseConfigChecks(value: unknown): ConfigCheck[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error("validate.configChecks must be an array");
  }

  return value.map((check, index) => {
    if (typeof check !== "object" || check === null) {
      throw new Error(`validate.configChecks[${index}] must be an object`);
    }

    const candidate = check as Record<string, unknown>;

    if (typeof candidate.id !== "string" || candidate.id.length === 0) {
      throw new Error(`validate.configChecks[${index}].id must be a non-empty string`);
    }

    if (
      typeof candidate.description !== "string" ||
      candidate.description.length === 0
    ) {
      throw new Error(
        `validate.configChecks[${index}].description must be a non-empty string`,
      );
    }

    if (candidate.kind !== "env" && candidate.kind !== "path") {
      throw new Error(`validate.configChecks[${index}].kind must be 'env' or 'path'`);
    }

    if (typeof candidate.value !== "string" || candidate.value.length === 0) {
      throw new Error(`validate.configChecks[${index}].value must be a non-empty string`);
    }

    if (
      candidate.severity !== undefined &&
      candidate.severity !== "warning" &&
      candidate.severity !== "error"
    ) {
      throw new Error(
        `validate.configChecks[${index}].severity must be 'warning' or 'error' when present`,
      );
    }

    return {
      id: candidate.id,
      description: candidate.description,
      kind: candidate.kind,
      value: candidate.value,
      severity: candidate.severity as "warning" | "error" | undefined,
    };
  });
}

function parseCompatibilityClients(value: unknown): CompatibilityClient[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error("compatibility.clients must be an array of client names");
  }

  return value as CompatibilityClient[];
}

function normalizeManifest(raw: RawManifest, commandsFromBin: string[]): SkillManifest {
  if (raw.schemaVersion !== 1) {
    throw new Error("schemaVersion must be 1");
  }

  const exportedCommands =
    raw.exportedCommands === undefined
      ? commandsFromBin
      : asStringArray(raw.exportedCommands, "exportedCommands");

  return {
    schemaVersion: 1,
    exportedCommands,
    runtime: parseRuntime(raw.runtime),
    compatibility: raw.compatibility
      ? {
          clients: parseCompatibilityClients(raw.compatibility.clients),
          symlink:
            raw.compatibility.symlink === undefined
              ? true
              : Boolean(raw.compatibility.symlink),
        }
      : undefined,
    validate: raw.validate
      ? {
          requiredPaths: asStringArray(raw.validate.requiredPaths, "validate.requiredPaths"),
          configChecks: parseConfigChecks(raw.validate.configChecks),
        }
      : undefined,
    purge: raw.purge
      ? {
          externalPaths: asStringArray(raw.purge.externalPaths, "purge.externalPaths"),
        }
      : undefined,
  };
}

export async function discoverBinCommands(skillDir: string): Promise<string[]> {
  const binDir = join(skillDir, "bin");

  try {
    await access(binDir);
  } catch {
    return [];
  }

  const entries = await readdir(binDir);
  const commands: string[] = [];

  for (const entry of entries) {
    const candidatePath = join(binDir, entry);
    const entryStats = await stat(candidatePath);
    if (entryStats.isFile()) {
      commands.push(entry);
    }
  }

  return commands.sort((a, b) => a.localeCompare(b));
}

export async function loadSkillManifest(skillDir: string): Promise<{
  manifestPath: string | null;
  manifest: SkillManifest;
}> {
  const manifestPath = join(skillDir, MANIFEST_FILE);
  const commandsFromBin = await discoverBinCommands(skillDir);

  try {
    const rawManifestContent = await readFile(manifestPath, "utf-8");
    const parsed = JSON.parse(rawManifestContent) as RawManifest;
    return {
      manifestPath,
      manifest: normalizeManifest(parsed, commandsFromBin),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        manifestPath: null,
        manifest: {
          schemaVersion: 1,
          exportedCommands: commandsFromBin,
          runtime: {
            strategy: "none",
          },
        },
      };
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${manifestPath}: ${error.message}`);
    }

    throw error;
  }
}
