import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRootParser } from "./installer.js";
import { createSkill, pathExists } from "./core/test-helpers.test.js";

const distDir = dirname(fileURLToPath(import.meta.url));
const cliPath = join(distDir, "installer.js");

function runCli(args: string[], cwd: string, homeDir: string) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    env: {
      ...process.env,
      HOME: homeDir,
    },
    encoding: "utf-8",
  });
}

test("installer CLI parses positional install args with arg-parser v3", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-cli-"));
  const homeDir = join(workspace, "home");

  try {
    await createSkill(join(workspace, "skills"), "demo");

    const result = runCli(["install", "demo", "--local", "--dry-run"], workspace, homeDir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\[dry-run\] install: demo \(local\)/);
    assert.match(result.stdout, /changed paths:/);
    assert.equal(await pathExists(join(workspace, ".agents", "skills", "demo")), false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("installer CLI auto-help lists the new commands", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-help-"));
  const homeDir = join(workspace, "home");

  try {
    const result = runCli(["--help"], workspace, homeDir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage:\s+agent-skills/);
    assert.match(result.stdout, /list\s+List source skills with descriptions/);
    assert.match(result.stdout, /find\s+Find relevant source skills/);
    assert.match(result.stdout, /use\s+Run a source skill without installing it/);
    assert.match(result.stdout, /print-mcp-config\s+Print a JSON-only MCP config snippet/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("installer CLI list shows source skill descriptions", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-list-"));
  const homeDir = join(workspace, "home");

  try {
    await createSkill(join(workspace, "skills"), "demo", {
      description: "Demo source skill description.",
    });

    const result = runCli(["list"], workspace, homeDir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /demo\n\s+Demo source skill description\./);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("installer CLI find ranks relevant skills from free text", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-find-"));
  const homeDir = join(workspace, "home");

  try {
    const skillsRoot = join(workspace, "skills");
    await createSkill(skillsRoot, "browser-demo", {
      description: "Browser markdown extraction and semantic tree capture.",
      commandNames: ["browser-fetch"],
    });
    await createSkill(skillsRoot, "search-demo", {
      description: "General web search and company lookup.",
      commandNames: ["search-web"],
    });

    const result = runCli(["find", "browser", "markdown", "--limit", "2"], workspace, homeDir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1\. browser-demo\n\s+Browser markdown extraction and semantic tree capture\./);
    assert.match(result.stdout, /Why: /);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("installer CLI missing required flags is handled by parser validation", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-mandatory-"));
  const homeDir = join(workspace, "home");

  try {
    const result = runCli(["use"], workspace, homeDir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing mandatory flags: skill, command/);
    assert.doesNotMatch(result.stderr, /--skill is required/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});


test("installer CLI use runs a source skill without creating install state", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-use-cli-"));
  const homeDir = join(workspace, "home");

  try {
    await createSkill(join(workspace, "skills"), "demo", {
      commandNames: ["demo-cmd"],
      commandContents: {
        "demo-cmd": [
          "#!/usr/bin/env bash",
          "printf 'demo:%s\\n' \"$*\"",
        ].join("\n"),
      },
      manifestContent: JSON.stringify(
        {
          schemaVersion: 1,
          exportedCommands: ["demo-cmd"],
          runtime: {
            strategy: "none",
          },
        },
        null,
        2,
      ),
    });

    const result = runCli(["use", "demo", "demo-cmd", "alpha", "beta"], workspace, homeDir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /demo:alpha beta/);
    assert.equal(await pathExists(join(workspace, ".agents", "skills", "demo")), false);
    assert.equal(await pathExists(join(workspace, ".agents", "bin", "demo-cmd")), false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("installer CLI print-mcp-config emits pure JSON with policy flags", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-config-"));
  const homeDir = join(workspace, "home");

  try {
    const result = runCli(
      [
        "print-mcp-config",
        "--allow-skill",
        "lightpanda",
        "--deny-skill",
        "exa-search",
      ],
      workspace,
      homeDir,
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");

    const parsed = JSON.parse(result.stdout);
    assert.deepEqual(parsed, {
      mcpServers: {
        "agent-skills": {
          command: "npx",
          args: [
            "--yes",
            "@alcyone-labs/agent-skills",
            "--s-mcp-serve",
            "--allow-skill",
            "lightpanda",
            "--deny-skill",
            "exa-search",
          ],
        },
      },
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("installer MCP tools expose only find use install and enforce policy", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-mcp-tools-"));
  const homeDir = join(workspace, "home");
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();

  process.env.HOME = homeDir;
  process.chdir(workspace);

  try {
    const skillsRoot = join(workspace, "skills");
    await createSkill(skillsRoot, "allowed", {
      description: "Allowed browser skill.",
      commandNames: ["allowed-cmd"],
      commandContents: {
        "allowed-cmd": [
          "#!/usr/bin/env bash",
          "printf 'allowed:%s\\n' \"$*\"",
        ].join("\n"),
      },
      manifestContent: JSON.stringify(
        {
          schemaVersion: 1,
          exportedCommands: ["allowed-cmd"],
          runtime: {
            strategy: "none",
          },
        },
        null,
        2,
      ),
    });
    await createSkill(skillsRoot, "blocked", {
      description: "Blocked browser skill.",
      commandNames: ["blocked-cmd"],
      manifestContent: JSON.stringify(
        {
          schemaVersion: 1,
          exportedCommands: ["blocked-cmd"],
          runtime: {
            strategy: "none",
          },
        },
        null,
        2,
      ),
    });

    const parser = createRootParser(["--allow-skill", "allowed", "--deny-skill", "blocked"]);
    const tools: Array<{ name: string; execute: (args: any) => Promise<any> }> = parser.toMcpTools({
      includeSubCommands: false,
    });

    assert.deepEqual(
      tools.map((tool) => tool.name),
      ["find", "use", "install"],
    );

    const findTool = tools.find((tool) => tool.name === "find");
    const useTool = tools.find((tool) => tool.name === "use");
    assert.ok(findTool && useTool);

    const findResult = await findTool.execute({ query: "browser skill" });
    assert.deepEqual(findResult.items.map((item: { name: string }) => item.name), ["allowed"]);

    const useResult = await useTool.execute({
      skill: "allowed",
      command: "allowed-cmd",
      arg: ["ok"],
    });
    assert.equal(useResult.exitCode, 0);
    assert.match(useResult.stdout, /allowed:ok/);
    assert.equal(useResult.stderr, "");

    await assert.rejects(
      () => useTool.execute({ skill: "blocked", command: "blocked-cmd" }),
      /denied for MCP use/,
    );
  } finally {
    process.chdir(originalCwd);
    process.env.HOME = originalHome;
    await rm(workspace, { recursive: true, force: true });
  }
});
