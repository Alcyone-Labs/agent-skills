import { type MutationOptions, type OperationResult, type SkillInfo, type ValidationIssue } from "./types.js";
interface UninstallOptions {
    scope: MutationOptions["scope"];
    dryRun: boolean;
}
interface PurgeOptions extends UninstallOptions {
    cwd?: string;
}
export declare function installSkill(skill: SkillInfo, options: MutationOptions, cwd?: string): Promise<OperationResult>;
export declare function updateSkill(skill: SkillInfo, options: MutationOptions, cwd?: string): Promise<OperationResult>;
export declare function resetSkill(skillName: string, options: MutationOptions, cwd?: string): Promise<OperationResult>;
export declare function uninstallSkill(skillName: string, options: UninstallOptions, cwd?: string): Promise<OperationResult>;
export declare function purgeSkill(skillName: string, options: PurgeOptions): Promise<OperationResult>;
export declare function validateSkill(skillName: string, scope: MutationOptions["scope"], cwd?: string): Promise<ValidationIssue[]>;
export declare function validateAllInstalledSkills(scope: MutationOptions["scope"], cwd?: string): Promise<ValidationIssue[]>;
export declare function pruneInstall(scope: MutationOptions["scope"], dryRun: boolean, cwd?: string): Promise<string[]>;
export declare function cleanInstall(scope: MutationOptions["scope"], dryRun: boolean, cwd?: string): Promise<string[]>;
export declare function runSkillCommand(skill: SkillInfo, commandName: string, args: string[]): Promise<number>;
export {};
//# sourceMappingURL=installer.d.ts.map