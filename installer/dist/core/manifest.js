import { access, readdir, readFile, stat } from "fs/promises";
import { join } from "path";
const MANIFEST_FILE = "agent-skills.json";
function asStringArray(value, field) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
        throw new Error(`${field} must be an array of strings`);
    }
    return value;
}
function parseRuntime(raw) {
    if (!raw) {
        return undefined;
    }
    const strategy = raw.strategy;
    if (strategy !== "none" && strategy !== "npm-in-skill") {
        throw new Error("runtime.strategy must be 'none' or 'npm-in-skill'");
    }
    const installCommand = raw.installCommand;
    if (installCommand !== undefined &&
        (!Array.isArray(installCommand) ||
            installCommand.length === 0 ||
            !installCommand.every((entry) => typeof entry === "string"))) {
        throw new Error("runtime.installCommand must be a non-empty string array when present");
    }
    return {
        strategy: strategy,
        installCommand: installCommand,
        requiredPaths: asStringArray(raw.requiredPaths, "runtime.requiredPaths"),
    };
}
function parseConfigChecks(value) {
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
        const candidate = check;
        if (typeof candidate.id !== "string" || candidate.id.length === 0) {
            throw new Error(`validate.configChecks[${index}].id must be a non-empty string`);
        }
        if (typeof candidate.description !== "string" ||
            candidate.description.length === 0) {
            throw new Error(`validate.configChecks[${index}].description must be a non-empty string`);
        }
        if (candidate.kind !== "env" && candidate.kind !== "path") {
            throw new Error(`validate.configChecks[${index}].kind must be 'env' or 'path'`);
        }
        if (typeof candidate.value !== "string" || candidate.value.length === 0) {
            throw new Error(`validate.configChecks[${index}].value must be a non-empty string`);
        }
        if (candidate.severity !== undefined &&
            candidate.severity !== "warning" &&
            candidate.severity !== "error") {
            throw new Error(`validate.configChecks[${index}].severity must be 'warning' or 'error' when present`);
        }
        return {
            id: candidate.id,
            description: candidate.description,
            kind: candidate.kind,
            value: candidate.value,
            severity: candidate.severity,
        };
    });
}
function parseCompatibilityClients(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
        throw new Error("compatibility.clients must be an array of client names");
    }
    return value;
}
function normalizeManifest(raw, commandsFromBin) {
    if (raw.schemaVersion !== 1) {
        throw new Error("schemaVersion must be 1");
    }
    const exportedCommands = raw.exportedCommands === undefined
        ? commandsFromBin
        : asStringArray(raw.exportedCommands, "exportedCommands");
    return {
        schemaVersion: 1,
        exportedCommands,
        runtime: parseRuntime(raw.runtime),
        compatibility: raw.compatibility
            ? {
                clients: parseCompatibilityClients(raw.compatibility.clients),
                symlink: raw.compatibility.symlink === undefined
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
export async function discoverBinCommands(skillDir) {
    const binDir = join(skillDir, "bin");
    try {
        await access(binDir);
    }
    catch {
        return [];
    }
    const entries = await readdir(binDir);
    const commands = [];
    for (const entry of entries) {
        const candidatePath = join(binDir, entry);
        const entryStats = await stat(candidatePath);
        if (entryStats.isFile()) {
            commands.push(entry);
        }
    }
    return commands.sort((a, b) => a.localeCompare(b));
}
export async function loadSkillManifest(skillDir) {
    const manifestPath = join(skillDir, MANIFEST_FILE);
    const commandsFromBin = await discoverBinCommands(skillDir);
    try {
        const rawManifestContent = await readFile(manifestPath, "utf-8");
        const parsed = JSON.parse(rawManifestContent);
        return {
            manifestPath,
            manifest: normalizeManifest(parsed, commandsFromBin),
        };
    }
    catch (error) {
        if (error.code === "ENOENT") {
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
//# sourceMappingURL=manifest.js.map