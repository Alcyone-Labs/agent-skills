/**
 * Skill discovery and management utilities
 */
import type { SkillInfo } from "./types.js";
/**
 * Discover available skills in the skills directory
 */
export declare function discoverSkills(skillsDir: string): Promise<SkillInfo[]>;
/**
 * Get the source directory for skills
 * Detects if running in self-install mode or from a cloned repo
 */
export declare function getSourceDirectory(): Promise<{
    srcDir: string;
    skillsDir: string;
    isSelfInstall: boolean;
}>;
/**
 * Validate selected skills against available skills
 */
export declare function validateSkills(selectedSkills: string[], availableSkills: SkillInfo[]): string[];
//# sourceMappingURL=skill-discovery.d.ts.map