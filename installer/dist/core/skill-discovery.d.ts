import type { InstallScope, SkillInfo, SkillSource } from "./types.js";
export declare function discoverSkillsInDirectory(skillsDir: string, source: SkillSource): Promise<SkillInfo[]>;
/**
 * Resolve source skills directory for self-install / local repository mode.
 * Search current working directory first, then repository-relative fallbacks.
 */
export declare function getSourceDirectory(cwd?: string): Promise<{
    srcDir: string;
    skillsDir: string;
    isSelfInstall: boolean;
}>;
export declare function discoverSourceSkills(cwd?: string): Promise<SkillInfo[]>;
export declare function discoverInstalledSkills(scope: InstallScope, cwd?: string): Promise<SkillInfo[]>;
export declare function discoverAllSkillsByPrecedence(cwd?: string): Promise<SkillInfo[]>;
export declare function discoverAllInstalledSkills(cwd?: string): Promise<SkillInfo[]>;
export declare function findSkillByName(skillName: string, cwd?: string): Promise<SkillInfo | null>;
export declare function findInstalledSkillByName(skillName: string, scope: InstallScope, cwd?: string): Promise<SkillInfo | null>;
export declare function findRunnableSkillByName(skillName: string, commandName: string, cwd?: string): Promise<SkillInfo | null>;
export declare function validateSkills(selectedSkills: string[], availableSkills: SkillInfo[]): string[];
//# sourceMappingURL=skill-discovery.d.ts.map