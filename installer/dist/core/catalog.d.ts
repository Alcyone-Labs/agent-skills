import type { SkillAccessPolicy, SkillCatalogEntry, SkillInfo, SkillSearchResult, SourceSkillIndexEntry } from "./types.js";
interface SearchCatalogOptions {
    limit?: number;
    policy?: SkillAccessPolicy;
}
type CatalogSource = SkillInfo | SourceSkillIndexEntry;
export declare function clampCatalogSearchLimit(limit?: number): number;
export declare function isSkillAllowed(skillName: string, policy?: SkillAccessPolicy): boolean;
export declare function assertSkillAllowed(skillName: string, action: "find" | "install" | "use", policy?: SkillAccessPolicy): void;
export declare function filterSkillsByPolicy<T extends {
    name: string;
}>(skills: readonly T[], policy?: SkillAccessPolicy): T[];
export declare function toSkillCatalogEntry(skill: CatalogSource): SkillCatalogEntry;
export declare function listCatalogSkills(skills: readonly CatalogSource[], policy?: SkillAccessPolicy): SkillCatalogEntry[];
export declare function searchCatalogSkills(skills: readonly CatalogSource[], query: string, options?: SearchCatalogOptions): SkillSearchResult[];
export {};
//# sourceMappingURL=catalog.d.ts.map