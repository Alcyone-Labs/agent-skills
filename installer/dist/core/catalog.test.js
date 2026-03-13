import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSkillAllowed, clampCatalogSearchLimit, listCatalogSkills, searchCatalogSkills, } from "./catalog.js";
import { discoverSkillsInDirectory } from "./skill-discovery.js";
import { SOURCE_SKILL_INDEX } from "./source-skill-index.generated.js";
import { createSkill } from "./test-helpers.test.js";
function createIndexedSkill(skill) {
    return {
        name: skill.name,
        description: skill.description ?? null,
        exportedCommands: skill.exportedCommands ?? [],
        path: skill.path ?? `skills/${skill.name}`,
        source: "source",
        searchText: skill.searchText ?? skill.description ?? skill.name,
    };
}
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
    }
    finally {
        await rm(workspace, { recursive: true, force: true });
    }
});
test("packaged source index is committed and includes searchable metadata", () => {
    assert.ok(SOURCE_SKILL_INDEX.length > 0);
    const argParser = SOURCE_SKILL_INDEX.find((skill) => skill.name === "arg-parser");
    assert.ok(argParser);
    assert.equal(argParser.path, "skills/arg-parser");
    assert.match(argParser.searchText, /mandatory|MCP|interactive/i);
});
test("BM25 search returns relevant packaged skills for jazz service worker", () => {
    const results = searchCatalogSkills(SOURCE_SKILL_INDEX, "jazz service worker", { limit: 5 });
    const names = results.map((result) => result.skill.name);
    assert.ok(results.length > 0);
    assert.ok(names.includes("sauve-jazz-extension"));
    assert.ok(names.includes("jazz-runtime-wasm-compat"));
    assert.match(results[0]?.reasons.join(" ") ?? "", /matched .*terms|matched commands/);
});
test("catalog search limit clamps to one through five", () => {
    assert.equal(clampCatalogSearchLimit(undefined), 5);
    assert.equal(clampCatalogSearchLimit(0), 1);
    assert.equal(clampCatalogSearchLimit(99), 5);
    assert.equal(searchCatalogSkills(SOURCE_SKILL_INDEX, "jazz", { limit: 99 }).length, 5);
    assert.equal(searchCatalogSkills(SOURCE_SKILL_INDEX, "jazz", { limit: 0 }).length, 1);
});
test("catalog allow and deny policy filters results with deny precedence", () => {
    const skills = [
        createIndexedSkill({
            name: "allowed-worker",
            description: "Allowed service worker skill.",
            exportedCommands: ["allowed-worker"],
            searchText: "allowed service worker guide",
        }),
        createIndexedSkill({
            name: "blocked-worker",
            description: "Blocked service worker skill.",
            exportedCommands: ["blocked-worker"],
            searchText: "blocked service worker guide",
        }),
    ];
    const policy = {
        allowSkills: ["allowed-worker", "blocked-worker"],
        denySkills: ["blocked-worker"],
    };
    assert.deepEqual(listCatalogSkills(skills, policy).map((skill) => skill.name), ["allowed-worker"]);
    assert.deepEqual(searchCatalogSkills(skills, "service worker", { policy }).map((result) => result.skill.name), ["allowed-worker"]);
    assert.doesNotThrow(() => assertSkillAllowed("allowed-worker", "install", policy));
    assert.throws(() => assertSkillAllowed("blocked-worker", "use", policy), /denied for MCP use/);
    assert.throws(() => assertSkillAllowed("missing", "install", { allowSkills: ["allowed-worker"] }), /not allowed for MCP install/);
});
//# sourceMappingURL=catalog.test.js.map