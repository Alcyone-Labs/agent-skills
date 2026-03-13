import type { SkillInfo } from "./types.js";
interface CreateSkillOptions {
    manifestContent?: string;
    commandNames?: string[];
    commandContents?: Record<string, string>;
    description?: string;
    skillMarkdown?: string;
}
export declare function createSkill(skillsRoot: string, skillName: string, options?: CreateSkillOptions): Promise<SkillInfo>;
export declare function pathExists(path: string): Promise<boolean>;
export {};
//# sourceMappingURL=test-helpers.test.d.ts.map