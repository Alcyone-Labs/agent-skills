import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertSkillAllowed,
  clampCatalogSearchLimit,
  listCatalogSkills,
  searchCatalogSkills,
} from "./catalog.js";
import { discoverSkillsInDirectory } from "./skill-discovery.js";
import { createSkill } from "./test-helpers.test.js";

test("discovery reads description from SKILL frontmatter", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-catalog-desc-"));

  try {
    const skillsRoot = join(workspace, "skills");
    await mkdir(skillsRoot, { recursive: true });
    const created = await createSkill(skillsRoot, "demo", {
      description: "Structured browser extraction and markdown fetching.",
    });

    assert.equal(created.description, "Structured browser extraction and markdown fetching.");

    const discovered = await discoverSkillsInDirectory(skillsRoot, "source");
    assert.equal(discovered[0]?.description, created.description);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("catalog listing includes descriptions and search is deterministic", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-catalog-search-"));

  try {
    const skillsRoot = join(workspace, "skills");
    await mkdir(skillsRoot, { recursive: true });
    await createSkill(skillsRoot, "alpha-search", {
      description: "Search web pages and code snippets for research.",
      commandNames: ["alpha-search", "alpha-code"],
    });
    await createSkill(skillsRoot, "beta-browser", {
      description: "Browser markdown fetch and semantic tree extraction.",
      commandNames: ["beta-fetch", "beta-semantic"],
    });
    await createSkill(skillsRoot, "gamma-index", {
      description: "Search documentation indexes and code catalogs.",
      commandNames: ["gamma-search"],
    });

    const skills = await discoverSkillsInDirectory(skillsRoot, "source");
    const listed = listCatalogSkills(skills);
    assert.deepEqual(
      listed.map((skill) => [skill.name, skill.description]),
      [
        ["alpha-search", "Search web pages and code snippets for research."],
        ["beta-browser", "Browser markdown fetch and semantic tree extraction."],
        ["gamma-index", "Search documentation indexes and code catalogs."],
      ],
    );

    const results = searchCatalogSkills(skills, "search code", { limit: 5 });
    assert.deepEqual(results.map((result) => result.skill.name), ["alpha-search", "gamma-index"]);
    assert.ok(results[0]?.score > results[1]?.score);
    assert.match(results[0]?.reasons.join(" ") ?? "", /matched commands|matched description terms|matched name terms/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("catalog search limit clamps to one through five", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-catalog-limit-"));

  try {
    const skillsRoot = join(workspace, "skills");
    await mkdir(skillsRoot, { recursive: true });

    for (const name of ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"]) {
      await createSkill(skillsRoot, name, {
        description: "Shared demo catalog entry.",
        commandNames: [`${name}-demo`],
      });
    }

    const skills = await discoverSkillsInDirectory(skillsRoot, "source");
    assert.equal(clampCatalogSearchLimit(undefined), 5);
    assert.equal(clampCatalogSearchLimit(0), 1);
    assert.equal(clampCatalogSearchLimit(99), 5);
    assert.equal(searchCatalogSkills(skills, "demo", { limit: 99 }).length, 5);
    assert.equal(searchCatalogSkills(skills, "demo", { limit: 0 }).length, 1);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("catalog allow and deny policy filters results with deny precedence", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "agent-skills-catalog-policy-"));

  try {
    const skillsRoot = join(workspace, "skills");
    await mkdir(skillsRoot, { recursive: true });
    await createSkill(skillsRoot, "allowed", {
      description: "Allowed search skill.",
      commandNames: ["allowed-search"],
    });
    await createSkill(skillsRoot, "blocked", {
      description: "Blocked search skill.",
      commandNames: ["blocked-search"],
    });

    const skills = await discoverSkillsInDirectory(skillsRoot, "source");
    const policy = {
      allowSkills: ["allowed", "blocked"],
      denySkills: ["blocked"],
    };

    assert.deepEqual(listCatalogSkills(skills, policy).map((skill) => skill.name), ["allowed"]);
    assert.deepEqual(
      searchCatalogSkills(skills, "search", { policy }).map((result) => result.skill.name),
      ["allowed"],
    );
    assert.doesNotThrow(() => assertSkillAllowed("allowed", "install", policy));
    assert.throws(
      () => assertSkillAllowed("blocked", "use", policy),
      /denied for MCP use/,
    );
    assert.throws(
      () => assertSkillAllowed("missing", "install", { allowSkills: ["allowed"] }),
      /not allowed for MCP install/,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
