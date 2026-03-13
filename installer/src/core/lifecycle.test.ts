import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { loadSkillManifest } from "./manifest.js";
import {
  discoverAllSkillsByPrecedence,
  discoverSkillsInDirectory,
  findRunnableSkillByName,
} from "./skill-discovery.js";
import {
  cleanInstall,
  installSkill,
  pruneInstall,
  purgeSkill,
  resetSkill,
  uninstallSkill,
  useSourceSkillCommand,
  validateSkill,
} from "./installer.js";
import type { MutationOptions } from "./types.js";
import { createSkill, pathExists } from "./test-helpers.test.js";


test("manifest parsing supports explicit and inferred commands", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-manifest-"));

  try {
    const explicitSkillRoot = join(workspace, "explicit");
    await mkdir(join(explicitSkillRoot, "bin"), { recursive: true });
    await writeFile(join(explicitSkillRoot, "bin", "explicit-cmd"), "", "utf-8");
    await writeFile(
      join(explicitSkillRoot, "agent-skills.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          exportedCommands: ["explicit-cmd"],
          runtime: {
            strategy: "none",
          },
        },
        null,
        2,
      ),
      "utf-8",
    );

    const explicit = await loadSkillManifest(explicitSkillRoot);
    assert.deepEqual(explicit.manifest.exportedCommands, ["explicit-cmd"]);

    const inferredSkillRoot = join(workspace, "inferred");
    await mkdir(join(inferredSkillRoot, "bin"), { recursive: true });
    await writeFile(join(inferredSkillRoot, "bin", "alpha"), "", "utf-8");
    await writeFile(join(inferredSkillRoot, "bin", "beta"), "", "utf-8");

    const inferred = await loadSkillManifest(inferredSkillRoot);
    assert.deepEqual(inferred.manifest.exportedCommands, ["alpha", "beta"]);
    assert.equal(inferred.manifest.runtime?.strategy, "none");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("discovery precedence and runnable fallback prefer viable install", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-discovery-"));
  const homeDir = join(workspace, "home");
  const originalHome = process.env.HOME;
  process.env.HOME = homeDir;

  try {
    const sourceSkillsDir = join(workspace, "skills");
    const localSkillsDir = join(workspace, ".agents", "skills");
    const globalSkillsDir = join(homeDir, ".agents", "skills");

    await mkdir(sourceSkillsDir, { recursive: true });
    await mkdir(localSkillsDir, { recursive: true });
    await mkdir(globalSkillsDir, { recursive: true });

    const sourceManifest = JSON.stringify(
      {
        schemaVersion: 1,
        exportedCommands: ["demo-cmd"],
        runtime: {
          strategy: "npm-in-skill",
          requiredPaths: ["runtime/browser/lightpanda"],
        },
      },
      null,
      2,
    );
    await createSkill(sourceSkillsDir, "demo", { manifestContent: sourceManifest });

    const localManifest = JSON.stringify(
      {
        schemaVersion: 1,
        exportedCommands: ["demo-cmd"],
        runtime: {
          strategy: "none",
        },
      },
      null,
      2,
    );
    const localSkill = await createSkill(localSkillsDir, "demo", { manifestContent: localManifest });
    const globalSkill = await createSkill(globalSkillsDir, "demo", { manifestContent: localManifest });
    assert.ok(localSkill && globalSkill);

    const ordered = await discoverAllSkillsByPrecedence(workspace);
    assert.equal(ordered[0]?.source, "source");

    const runnable = await findRunnableSkillByName("demo", "demo-cmd", workspace);
    assert.ok(runnable);
    assert.equal(runnable?.source, "local");
  } finally {
    process.env.HOME = originalHome;
    await rm(workspace, { recursive: true, force: true });
  }
});

test("lifecycle operations manage bins, compatibility links, prune, clean, purge", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-lifecycle-"));
  const homeDir = join(workspace, "home");
  const originalHome = process.env.HOME;
  process.env.HOME = homeDir;

  try {
    const sourceSkillsDir = join(workspace, "skills");
    await mkdir(sourceSkillsDir, { recursive: true });

    const externalFile = join(workspace, "external-config.txt");
    await writeFile(externalFile, "secret", "utf-8");

    const manifest = JSON.stringify(
      {
        schemaVersion: 1,
        exportedCommands: ["demo-cmd"],
        runtime: {
          strategy: "none",
        },
        purge: {
          externalPaths: [externalFile],
        },
      },
      null,
      2,
    );

    const sourceSkill = await createSkill(sourceSkillsDir, "demo", { manifestContent: manifest });

    const localOptions: MutationOptions = {
      scope: "local",
      dryRun: false,
      installCommandAdapters: false,
      compatibilityClients: [],
    };

    await installSkill(sourceSkill, localOptions, workspace);

    const installedSkillPath = join(workspace, ".agents", "skills", "demo");
    const localBinPath = join(workspace, ".agents", "bin", "demo-cmd");
    const compatPath = join(workspace, ".claude", "skills", "demo");

    const localIssues = await validateSkill("demo", "local", workspace);
    assert.equal(localIssues.length, 0);

    const localBinTarget = resolve(dirname(localBinPath), await readlink(localBinPath));
    assert.equal(localBinTarget, join(installedSkillPath, "bin", "demo-cmd"));

    await rm(localBinPath, { force: true });
    const brokenIssues = await validateSkill("demo", "local", workspace);
    assert.ok(brokenIssues.some((issue) => issue.message.includes("Missing exported command link")));

    await resetSkill("demo", localOptions, workspace);
    const repairedIssues = await validateSkill("demo", "local", workspace);
    assert.equal(repairedIssues.length, 0);

    const danglingBin = join(workspace, ".agents", "bin", "dangling");
    const danglingCompat = join(workspace, ".claude", "skills", "dangling");
    await symlink("/missing/path", danglingBin);
    await symlink("/missing/path", danglingCompat);

    const pruned = await pruneInstall("local", false, workspace);
    assert.ok(pruned.includes(danglingBin));
    assert.ok(pruned.includes(danglingCompat));

    const tmpResidue = join(workspace, ".agents", ".tmp");
    await mkdir(tmpResidue, { recursive: true });
    const cleaned = await cleanInstall("local", false, workspace);
    assert.ok(cleaned.includes(tmpResidue));

    await purgeSkill("demo", { scope: "local", dryRun: false, cwd: workspace });
    assert.equal(await pathExists(externalFile), false);

    const postPurgeIssues = await validateSkill("demo", "local", workspace);
    assert.ok(postPurgeIssues.some((issue) => issue.message.includes("not installed")));

    assert.equal(await pathExists(compatPath), false);

    const globalOptions: MutationOptions = {
      scope: "global",
      dryRun: false,
      installCommandAdapters: false,
      compatibilityClients: [],
    };

    await installSkill(sourceSkill, globalOptions, workspace);

    const globalBinPath = join(homeDir, ".agents", "bin", "demo-cmd");
    const globalTarget = resolve(dirname(globalBinPath), await readlink(globalBinPath));
    assert.equal(globalTarget, join(homeDir, ".agents", "skills", "demo", "bin", "demo-cmd"));

    await uninstallSkill("demo", { scope: "global", dryRun: false }, workspace);
  } finally {
    process.env.HOME = originalHome;
    await rm(workspace, { recursive: true, force: true });
  }
});

test("ephemeral use executes source skill without persistent install state", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-use-"));

  try {
    const sourceSkillsDir = join(workspace, "skills");
    await mkdir(sourceSkillsDir, { recursive: true });

    const manifest = JSON.stringify(
      {
        schemaVersion: 1,
        exportedCommands: ["demo-cmd"],
        runtime: {
          strategy: "none",
        },
      },
      null,
      2,
    );

    const sourceSkill = await createSkill(sourceSkillsDir, "demo", {
      manifestContent: manifest,
      commandNames: ["demo-cmd"],
      commandContents: {
        "demo-cmd": [
          "#!/usr/bin/env bash",
          "printf 'argv:%s\\n' \"$*\"",
        ].join("\n"),
      },
    });

    const result = await useSourceSkillCommand(sourceSkill, "demo-cmd", ["one", "two"], {
      captureOutput: true,
      cwd: workspace,
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.stderr, "");
    assert.ok(result.stdout.includes("argv:one two"));
    assert.equal(await pathExists(join(workspace, ".agents", "skills", "demo")), false);
    assert.equal(await pathExists(join(workspace, ".agents", "bin", "demo-cmd")), false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
