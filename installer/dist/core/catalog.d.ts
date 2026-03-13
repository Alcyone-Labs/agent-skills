import type { SkillAccessPolicy, SkillCatalogEntry, SkillInfo, SkillSearchResult } from "./types.js";
interface SearchCatalogOptions {
    limit?: number;
    policy?: SkillAccessPolicy;
}
export declare function clampCatalogSearchLimit(limit?: number): number;
export declare function isSkillAllowed(skillName: string, policy?: SkillAccessPolicy): boolean;
export declare function assertSkillAllowed(skillName: string, action: "find" | "install" | "use", policy?: SkillAccessPolicy): void;
export declare function filterSkillsByPolicy(skills: SkillInfo[], policy?: SkillAccessPolicy): SkillInfo[];
export declare function toSkillCatalogEntry(skill: SkillInfo): SkillCatalogEntry;
export declare function listCatalogSkills(skills: SkillInfo[], policy?: SkillAccessPolicy): SkillCatalogEntry[];
export declare function searchCatalogSkills(skills: SkillInfo[], query: string, options?: SearchCatalogOptions): SkillSearchResult[];
export {};
//# sourceMappingURL=catalog.d.ts.map