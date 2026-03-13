import type { SkillManifest } from "./types.js";
export declare function discoverBinCommands(skillDir: string): Promise<string[]>;
export declare function loadSkillManifest(skillDir: string): Promise<{
    manifestPath: string | null;
    manifest: SkillManifest;
}>;
//# sourceMappingURL=manifest.d.ts.map