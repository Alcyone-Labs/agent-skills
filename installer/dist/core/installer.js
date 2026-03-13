import { access, cp, lstat, mkdir, mkdtemp, readFile, readdir, readlink, rm, stat, symlink, writeFile, } from "fs/promises";
import { spawn } from "child_process";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { AVAILABLE_CLIENTS, CLIENT_CONFIGS, DEFAULT_COMPATIBILITY_CLIENTS, } from "./types.js";
import { resolveClientSkillDirectory, resolveCommandAdapterDirectory, resolveInstallationLayout, } from "./paths.js";
import { loadSkillManifest } from "./manifest.js";
const EPHEMERAL_MUTATION_OPTIONS = {
    scope: "local",
    dryRun: false,
    installCommandAdapters: false,
    compatibilityClients: [],
};
function unique(values) {
    return Array.from(new Set(values));
}
async function pathExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
async function safeRemove(path, dryRun) {
    if (dryRun) {
        return;
    }
    await rm(path, { recursive: true, force: true });
}
async function ensureDir(path, dryRun) {
    if (dryRun) {
        return;
    }
    await mkdir(path, { recursive: true });
}
async function executeProcess(command, args, options = {}) {
    const stdoutChunks = [];
    const stderrChunks = [];
    const captureOutput = Boolean(options.captureOutput);
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, {
            cwd: options.cwd ?? process.cwd(),
            stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
            env: options.env ?? process.env,
        });
        if (captureOutput) {
            child.stdout?.on("data", (chunk) => {
                stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            child.stderr?.on("data", (chunk) => {
                stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
        }
        child.once("error", rejectPromise);
        child.once("close", (code) => {
            resolvePromise({
                exitCode: code ?? 1,
                stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
                stderr: Buffer.concat(stderrChunks).toString("utf-8"),
            });
        });
    });
}
async function runCommand(command, cwd, dryRun) {
    if (command.length === 0 || dryRun) {
        return;
    }
    const result = await executeProcess(command[0], command.slice(1), {
        cwd,
        env: process.env,
    });
    if (result.exitCode !== 0) {
        throw new Error(`Command failed (${command.join(" ")}) with exit code ${result.exitCode}`);
    }
}
async function removeIfExists(path, dryRun) {
    if (!(await pathExists(path))) {
        return;
    }
    await safeRemove(path, dryRun);
}
async function applyCommandAdapters(sourceSkillDir, installedSkillDir, skillName, options, changedPaths, cwd = process.cwd()) {
    if (!options.installCommandAdapters) {
        return;
    }
    for (const client of AVAILABLE_CLIENTS) {
        const config = CLIENT_CONFIGS[client];
        if (!config.commandAdapter) {
            continue;
        }
        const sourceAdapterPath = join(sourceSkillDir, "commands", config.folderName, `${skillName}${config.commandAdapter.extension}`);
        if (!(await pathExists(sourceAdapterPath))) {
            continue;
        }
        const commandDir = resolveCommandAdapterDirectory(client, options.scope, cwd);
        if (!commandDir) {
            continue;
        }
        const targetPath = join(commandDir, `${skillName}${config.commandAdapter.extension}`);
        changedPaths.push(targetPath);
        if (options.dryRun) {
            continue;
        }
        await mkdir(commandDir, { recursive: true });
        const raw = await readFile(sourceAdapterPath, "utf-8");
        const rendered = raw.replace(/\{\{SKILL_PATH\}\}/g, installedSkillDir);
        await writeFile(targetPath, rendered);
    }
}
function resolveCompatibilityClients(manifest, options) {
    const manifestClients = manifest.compatibility?.clients ?? [];
    const explicitClients = options.compatibilityClients.length > 0
        ? options.compatibilityClients
        : DEFAULT_COMPATIBILITY_CLIENTS;
    const candidates = unique([...manifestClients, ...explicitClients]);
    return candidates.filter((client) => {
        if (client === "Agents") {
            return false;
        }
        return !CLIENT_CONFIGS[client].supportsAgentsAlias;
    });
}
async function createCompatibilityExports(skillName, installedSkillDir, manifest, options, changedPaths, cwd = process.cwd()) {
    const clients = resolveCompatibilityClients(manifest, options);
    for (const client of clients) {
        const compatRoot = resolveClientSkillDirectory(client, options.scope, cwd);
        const compatTarget = join(compatRoot, skillName);
        const shouldSymlink = manifest.compatibility?.symlink ?? true;
        changedPaths.push(compatTarget);
        if (options.dryRun) {
            continue;
        }
        await mkdir(compatRoot, { recursive: true });
        await removeIfExists(compatTarget, false);
        if (shouldSymlink) {
            await symlink(installedSkillDir, compatTarget);
        }
        else {
            await cp(installedSkillDir, compatTarget, { recursive: true });
        }
    }
    return clients;
}
async function removeCompatibilityExports(skillName, scope, dryRun, changedPaths, cwd = process.cwd()) {
    for (const client of AVAILABLE_CLIENTS) {
        if (client === "Agents") {
            continue;
        }
        const compatRoot = resolveClientSkillDirectory(client, scope, cwd);
        const compatTarget = join(compatRoot, skillName);
        if (!(await pathExists(compatTarget))) {
            continue;
        }
        changedPaths.push(compatTarget);
        await safeRemove(compatTarget, dryRun);
    }
}
async function removeCommandAdapters(skillName, scope, dryRun, changedPaths, cwd = process.cwd()) {
    for (const client of AVAILABLE_CLIENTS) {
        const config = CLIENT_CONFIGS[client];
        if (!config.commandAdapter) {
            continue;
        }
        const commandDir = resolveCommandAdapterDirectory(client, scope, cwd);
        if (!commandDir) {
            continue;
        }
        const commandPath = join(commandDir, `${skillName}${config.commandAdapter.extension}`);
        if (!(await pathExists(commandPath))) {
            continue;
        }
        changedPaths.push(commandPath);
        await safeRemove(commandPath, dryRun);
    }
}
async function clearSkillBinLinks(binDir, skillName, changedPaths, dryRun) {
    if (!(await pathExists(binDir))) {
        return;
    }
    const entries = await readdir(binDir);
    for (const entry of entries) {
        const linkPath = join(binDir, entry);
        const linkStats = await lstat(linkPath);
        if (!linkStats.isSymbolicLink()) {
            continue;
        }
        const rawTarget = await readlink(linkPath);
        const resolvedTarget = resolve(dirname(linkPath), rawTarget);
        if (!resolvedTarget.includes(`/skills/${skillName}/bin/`)) {
            continue;
        }
        changedPaths.push(linkPath);
        await safeRemove(linkPath, dryRun);
    }
}
async function syncExportedCommands(commandSourceRoot, skillName, manifest, options, changedPaths, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(options.scope, cwd);
    await ensureDir(layout.binDir, options.dryRun);
    await clearSkillBinLinks(layout.binDir, skillName, changedPaths, options.dryRun);
    for (const commandName of manifest.exportedCommands) {
        const sourceBin = join(commandSourceRoot, "bin", commandName);
        if (!(await pathExists(sourceBin))) {
            throw new Error(`Missing exported command '${commandName}' in ${join(commandSourceRoot, "bin")}`);
        }
        const targetLink = join(layout.binDir, commandName);
        changedPaths.push(targetLink);
        if (options.dryRun) {
            continue;
        }
        await removeIfExists(targetLink, false);
        await symlink(sourceBin, targetLink);
    }
}
async function provisionRuntime(installedSkillDir, manifest, options, changedPaths) {
    const runtime = manifest.runtime;
    if (!runtime || runtime.strategy === "none") {
        return;
    }
    const command = runtime.installCommand ?? ["npm", "install", "--omit=dev"];
    changedPaths.push(installedSkillDir);
    await runCommand(command, installedSkillDir, options.dryRun);
}
function assertSuccessfulSkillCommand(result) {
    if (result.exitCode === 0) {
        return;
    }
    throw new Error(`Skill command '${result.skill}/${result.command}' exited with code ${result.exitCode}`);
}
async function stageSkillForExecution(skill) {
    const tempDir = await mkdtemp(join(tmpdir(), "agent-skills-use-"));
    const stagedSkillDir = join(tempDir, skill.name);
    await cp(skill.path, stagedSkillDir, { recursive: true });
    const { manifestPath, manifest } = await loadSkillManifest(stagedSkillDir);
    await provisionRuntime(stagedSkillDir, manifest, EPHEMERAL_MUTATION_OPTIONS, []);
    return {
        tempDir,
        stagedSkill: {
            ...skill,
            path: stagedSkillDir,
            manifestPath,
            manifest,
        },
    };
}
async function installSkillInternal(skill, options, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(options.scope, cwd);
    const installedSkillDir = join(layout.skillsDir, skill.name);
    const changedPaths = [];
    changedPaths.push(layout.skillsDir, layout.binDir, installedSkillDir);
    await ensureDir(layout.skillsDir, options.dryRun);
    await ensureDir(layout.binDir, options.dryRun);
    await removeIfExists(installedSkillDir, options.dryRun);
    if (!options.dryRun) {
        await cp(skill.path, installedSkillDir, { recursive: true });
    }
    const { manifest } = options.dryRun
        ? { manifest: skill.manifest }
        : await loadSkillManifest(installedSkillDir);
    const commandSourceRoot = options.dryRun ? skill.path : installedSkillDir;
    await syncExportedCommands(commandSourceRoot, skill.name, manifest, options, changedPaths, cwd);
    await provisionRuntime(installedSkillDir, manifest, options, changedPaths);
    await applyCommandAdapters(skill.path, installedSkillDir, skill.name, options, changedPaths, cwd);
    const compatibilityClients = await createCompatibilityExports(skill.name, installedSkillDir, manifest, options, changedPaths, cwd);
    return {
        skill: skill.name,
        scope: options.scope,
        changedPaths: unique(changedPaths),
        dryRun: options.dryRun,
        compatibilityClients,
    };
}
export async function installSkill(skill, options, cwd = process.cwd()) {
    return installSkillInternal(skill, options, cwd);
}
export async function updateSkill(skill, options, cwd = process.cwd()) {
    return installSkillInternal(skill, options, cwd);
}
export async function resetSkill(skillName, options, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(options.scope, cwd);
    const installedSkillDir = join(layout.skillsDir, skillName);
    if (!(await pathExists(installedSkillDir))) {
        throw new Error(`Skill '${skillName}' is not installed in ${layout.skillsDir}`);
    }
    const { manifest } = await loadSkillManifest(installedSkillDir);
    const changedPaths = [];
    const commandSourceRoot = installedSkillDir;
    await syncExportedCommands(commandSourceRoot, skillName, manifest, options, changedPaths, cwd);
    await provisionRuntime(installedSkillDir, manifest, options, changedPaths);
    const compatibilityClients = await createCompatibilityExports(skillName, installedSkillDir, manifest, options, changedPaths, cwd);
    return {
        skill: skillName,
        scope: options.scope,
        changedPaths: unique(changedPaths),
        dryRun: options.dryRun,
        compatibilityClients,
    };
}
export async function uninstallSkill(skillName, options, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(options.scope, cwd);
    const installedSkillDir = join(layout.skillsDir, skillName);
    const changedPaths = [];
    await clearSkillBinLinks(layout.binDir, skillName, changedPaths, options.dryRun);
    await removeCompatibilityExports(skillName, options.scope, options.dryRun, changedPaths, cwd);
    await removeCommandAdapters(skillName, options.scope, options.dryRun, changedPaths, cwd);
    if (await pathExists(installedSkillDir)) {
        changedPaths.push(installedSkillDir);
        await safeRemove(installedSkillDir, options.dryRun);
    }
    return {
        skill: skillName,
        scope: options.scope,
        changedPaths: unique(changedPaths),
        dryRun: options.dryRun,
        compatibilityClients: [],
    };
}
export async function purgeSkill(skillName, options) {
    const layout = resolveInstallationLayout(options.scope, options.cwd);
    const installedSkillDir = join(layout.skillsDir, skillName);
    const externalPaths = (await pathExists(installedSkillDir))
        ? (await loadSkillManifest(installedSkillDir)).manifest.purge?.externalPaths ?? []
        : [];
    const result = await uninstallSkill(skillName, options, options.cwd);
    for (const externalPath of externalPaths) {
        result.changedPaths.push(externalPath);
        await safeRemove(externalPath, options.dryRun);
    }
    result.changedPaths = unique(result.changedPaths);
    return result;
}
async function validateConfigCheck(skillName, check) {
    const severity = check.severity ?? "warning";
    if (check.kind === "env") {
        if (process.env[check.value]) {
            return null;
        }
        return {
            skill: skillName,
            severity,
            message: `${check.description} (missing env ${check.value})`,
        };
    }
    if (await pathExists(check.value)) {
        return null;
    }
    return {
        skill: skillName,
        severity,
        message: `${check.description} (missing path ${check.value})`,
    };
}
export async function validateSkill(skillName, scope, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(scope, cwd);
    const installedSkillDir = join(layout.skillsDir, skillName);
    const issues = [];
    if (!(await pathExists(installedSkillDir))) {
        return [
            {
                skill: skillName,
                severity: "error",
                message: `Skill is not installed in ${layout.skillsDir}`,
            },
        ];
    }
    const { manifest } = await loadSkillManifest(installedSkillDir);
    for (const command of manifest.exportedCommands) {
        const linkPath = join(layout.binDir, command);
        if (!(await pathExists(linkPath))) {
            issues.push({
                skill: skillName,
                severity: "error",
                message: `Missing exported command link: ${linkPath}`,
            });
            continue;
        }
        const stats = await lstat(linkPath);
        if (!stats.isSymbolicLink()) {
            issues.push({
                skill: skillName,
                severity: "error",
                message: `Exported command is not a symlink: ${linkPath}`,
            });
            continue;
        }
        const target = resolve(dirname(linkPath), await readlink(linkPath));
        if (!(await pathExists(target))) {
            issues.push({
                skill: skillName,
                severity: "error",
                message: `Exported command symlink is broken: ${linkPath} -> ${target}`,
            });
        }
    }
    const requiredPaths = unique([
        ...(manifest.runtime?.requiredPaths ?? []),
        ...(manifest.validate?.requiredPaths ?? []),
    ]);
    for (const relativePath of requiredPaths) {
        const absolutePath = resolve(installedSkillDir, relativePath);
        if (await pathExists(absolutePath)) {
            continue;
        }
        issues.push({
            skill: skillName,
            severity: "error",
            message: `Missing required path: ${absolutePath}`,
        });
    }
    for (const check of manifest.validate?.configChecks ?? []) {
        const issue = await validateConfigCheck(skillName, check);
        if (issue) {
            issues.push(issue);
        }
    }
    return issues;
}
export async function validateAllInstalledSkills(scope, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(scope, cwd);
    if (!(await pathExists(layout.skillsDir))) {
        return [];
    }
    const entries = await readdir(layout.skillsDir);
    const issues = [];
    for (const entry of entries) {
        const entryPath = join(layout.skillsDir, entry);
        const entryStats = await stat(entryPath);
        if (!entryStats.isDirectory()) {
            continue;
        }
        const skillIssues = await validateSkill(entry, scope, cwd);
        issues.push(...skillIssues);
    }
    return issues;
}
export async function pruneInstall(scope, dryRun, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(scope, cwd);
    const removedPaths = [];
    if (await pathExists(layout.binDir)) {
        for (const entry of await readdir(layout.binDir)) {
            const linkPath = join(layout.binDir, entry);
            const linkStats = await lstat(linkPath);
            if (!linkStats.isSymbolicLink()) {
                continue;
            }
            const linkTarget = resolve(dirname(linkPath), await readlink(linkPath));
            if (await pathExists(linkTarget)) {
                continue;
            }
            removedPaths.push(linkPath);
            await safeRemove(linkPath, dryRun);
        }
    }
    for (const client of AVAILABLE_CLIENTS) {
        if (client === "Agents") {
            continue;
        }
        const compatRoot = resolveClientSkillDirectory(client, scope, cwd);
        if (!(await pathExists(compatRoot))) {
            continue;
        }
        for (const entry of await readdir(compatRoot)) {
            const compatPath = join(compatRoot, entry);
            const compatStats = await lstat(compatPath);
            if (!compatStats.isSymbolicLink()) {
                continue;
            }
            const target = resolve(dirname(compatPath), await readlink(compatPath));
            if (await pathExists(target)) {
                continue;
            }
            removedPaths.push(compatPath);
            await safeRemove(compatPath, dryRun);
        }
    }
    return removedPaths;
}
export async function cleanInstall(scope, dryRun, cwd = process.cwd()) {
    const layout = resolveInstallationLayout(scope, cwd);
    const cleaned = [];
    const staleTempDir = join(layout.agentsRoot, ".tmp");
    if (await pathExists(staleTempDir)) {
        cleaned.push(staleTempDir);
        await safeRemove(staleTempDir, dryRun);
    }
    const pruned = await pruneInstall(scope, dryRun, cwd);
    cleaned.push(...pruned);
    return unique(cleaned);
}
export async function executeSkillCommand(skill, commandName, args, options = {}) {
    const commandPath = join(skill.path, "bin", commandName);
    if (!(await pathExists(commandPath))) {
        throw new Error(`Skill '${skill.name}' does not export '${commandName}'`);
    }
    const result = await executeProcess(commandPath, args, {
        ...options,
        cwd: options.cwd ?? process.cwd(),
        env: options.env ?? process.env,
    });
    return {
        skill: skill.name,
        command: commandName,
        args: [...args],
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}
export async function useSourceSkillCommand(skill, commandName, args, options = {}) {
    const { tempDir, stagedSkill } = await stageSkillForExecution(skill);
    try {
        return await executeSkillCommand(stagedSkill, commandName, args, options);
    }
    finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}
export async function runSkillCommand(skill, commandName, args) {
    const result = await executeSkillCommand(skill, commandName, args);
    assertSuccessfulSkillCommand(result);
    return result.exitCode;
}
//# sourceMappingURL=installer.js.map