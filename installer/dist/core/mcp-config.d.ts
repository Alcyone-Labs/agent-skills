import type { SkillAccessPolicy } from "./types.js";
export interface McpConfigSnippet {
    mcpServers: {
        "agent-skills": {
            command: string;
            args: string[];
        };
    };
}
export declare function buildMcpServerArgs(policy?: SkillAccessPolicy): string[];
export declare function buildMcpConfigSnippet(policy?: SkillAccessPolicy): McpConfigSnippet;
export declare function extractSkillAccessPolicy(argv: string[]): SkillAccessPolicy;
//# sourceMappingURL=mcp-config.d.ts.map