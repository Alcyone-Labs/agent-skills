import { type CompatibilityClient, type InstallScope, type InstallationLayout } from "./types.js";
export declare function expandHome(path: string): string;
export declare function resolveInstallationLayout(scope: InstallScope, cwd?: string): InstallationLayout;
export declare function resolveClientSkillDirectory(client: CompatibilityClient, scope: InstallScope, cwd?: string): string;
export declare function resolveCommandAdapterDirectory(client: CompatibilityClient, scope: InstallScope, cwd?: string): string | null;
//# sourceMappingURL=paths.d.ts.map