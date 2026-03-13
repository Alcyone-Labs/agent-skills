import test from "node:test";
import assert from "node:assert/strict";
import { buildMcpConfigSnippet, buildMcpServerArgs, extractSkillAccessPolicy, } from "./mcp-config.js";
test("buildMcpConfigSnippet emits default JSON-ready config", () => {
    const snippet = buildMcpConfigSnippet();
    assert.deepEqual(snippet, {
        mcpServers: {
            "agent-skills": {
                command: "npx",
                args: ["--yes", "@alcyone-labs/agent-skills", "--s-mcp-serve"],
            },
        },
    });
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(snippet)));
});
test("buildMcpServerArgs repeats allow and deny skill flags in order", () => {
    const args = buildMcpServerArgs({
        allowSkills: ["lightpanda", "lightpanda", "skill-forge"],
        denySkills: ["exa-search", "exa-search", "arg-parser"],
    });
    assert.deepEqual(args, [
        "--yes",
        "@alcyone-labs/agent-skills",
        "--s-mcp-serve",
        "--allow-skill",
        "lightpanda",
        "--allow-skill",
        "skill-forge",
        "--deny-skill",
        "exa-search",
        "--deny-skill",
        "arg-parser",
    ]);
});
test("extractSkillAccessPolicy parses repeated allow and deny skill flags", () => {
    const policy = extractSkillAccessPolicy([
        "--allow-skill",
        "lightpanda",
        "--deny-skill",
        "exa-search",
        "--allow-skill",
        "skill-forge",
    ]);
    assert.deepEqual(policy, {
        allowSkills: ["lightpanda", "skill-forge"],
        denySkills: ["exa-search"],
    });
});
test("extractSkillAccessPolicy rejects missing skill names", () => {
    assert.throws(() => extractSkillAccessPolicy(["--allow-skill"]), /requires a skill name/);
    assert.throws(() => extractSkillAccessPolicy(["--deny-skill", "--s-mcp-serve"]), /requires a skill name/);
});
//# sourceMappingURL=mcp-config.test.js.map