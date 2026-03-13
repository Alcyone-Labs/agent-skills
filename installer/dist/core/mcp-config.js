const DEFAULT_MCP_SERVER_NAME = "agent-skills";
const DEFAULT_MCP_COMMAND = "npx";
const DEFAULT_MCP_PACKAGE = "@alcyone-labs/agent-skills";
function normalizeSkills(values) {
    return Array.from(new Set((values ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)));
}
export function buildMcpServerArgs(policy = {}) {
    const args = ["--yes", DEFAULT_MCP_PACKAGE, "--s-mcp-serve"];
    for (const skill of normalizeSkills(policy.allowSkills)) {
        args.push("--allow-skill", skill);
    }
    for (const skill of normalizeSkills(policy.denySkills)) {
        args.push("--deny-skill", skill);
    }
    return args;
}
export function buildMcpConfigSnippet(policy = {}) {
    return {
        mcpServers: {
            [DEFAULT_MCP_SERVER_NAME]: {
                command: DEFAULT_MCP_COMMAND,
                args: buildMcpServerArgs(policy),
            },
        },
    };
}
export function extractSkillAccessPolicy(argv) {
    const allowSkills = [];
    const denySkills = [];
    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];
        if (current !== "--allow-skill" && current !== "--deny-skill") {
            continue;
        }
        const next = argv[index + 1];
        if (!next || next.startsWith("-")) {
            throw new Error(`${current} requires a skill name`);
        }
        if (current === "--allow-skill") {
            allowSkills.push(next);
        }
        else {
            denySkills.push(next);
        }
        index += 1;
    }
    return {
        allowSkills: normalizeSkills(allowSkills),
        denySkills: normalizeSkills(denySkills),
    };
}
//# sourceMappingURL=mcp-config.js.map