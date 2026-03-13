const DEFAULT_SEARCH_LIMIT = 5;
const MIN_SEARCH_LIMIT = 1;
const MAX_SEARCH_LIMIT = 5;
function normalizeSkillName(value) {
    return value.trim().toLowerCase();
}
function normalizePolicySet(values) {
    return new Set((values ?? []).map(normalizeSkillName).filter((value) => value.length > 0));
}
function unique(values) {
    return Array.from(new Set(values));
}
function tokenize(value) {
    return unique(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}
export function clampCatalogSearchLimit(limit) {
    if (limit === undefined || Number.isNaN(limit)) {
        return DEFAULT_SEARCH_LIMIT;
    }
    return Math.min(MAX_SEARCH_LIMIT, Math.max(MIN_SEARCH_LIMIT, Math.trunc(limit)));
}
export function isSkillAllowed(skillName, policy) {
    const normalizedSkillName = normalizeSkillName(skillName);
    const denySkills = normalizePolicySet(policy?.denySkills);
    if (denySkills.has(normalizedSkillName)) {
        return false;
    }
    const allowSkills = normalizePolicySet(policy?.allowSkills);
    if (allowSkills.size === 0) {
        return true;
    }
    return allowSkills.has(normalizedSkillName);
}
export function assertSkillAllowed(skillName, action, policy) {
    if (isSkillAllowed(skillName, policy)) {
        return;
    }
    const normalizedSkillName = normalizeSkillName(skillName);
    const denySkills = normalizePolicySet(policy?.denySkills);
    if (denySkills.has(normalizedSkillName)) {
        throw new Error(`Skill '${skillName}' is denied for MCP ${action}`);
    }
    throw new Error(`Skill '${skillName}' is not allowed for MCP ${action}`);
}
export function filterSkillsByPolicy(skills, policy) {
    return skills.filter((skill) => isSkillAllowed(skill.name, policy));
}
export function toSkillCatalogEntry(skill) {
    return {
        name: skill.name,
        description: skill.description,
        exportedCommands: [...skill.manifest.exportedCommands],
        path: skill.path,
        source: skill.source,
    };
}
export function listCatalogSkills(skills, policy) {
    return filterSkillsByPolicy(skills, policy)
        .map(toSkillCatalogEntry)
        .sort((left, right) => left.name.localeCompare(right.name));
}
function rankSkillMatch(skill, query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
        return null;
    }
    const queryTokens = tokenize(normalizedQuery);
    if (queryTokens.length === 0) {
        return null;
    }
    const normalizedName = skill.name.toLowerCase();
    const normalizedDescription = (skill.description ?? "").toLowerCase();
    const normalizedCommands = skill.manifest.exportedCommands.map((command) => command.toLowerCase());
    let score = 0;
    const reasons = [];
    const matchedNameTerms = [];
    const matchedDescriptionTerms = [];
    const matchedCommands = [];
    if (normalizedName === normalizedQuery) {
        score += 500;
        reasons.push("exact skill name match");
    }
    else if (normalizedName.includes(normalizedQuery)) {
        score += 220;
        reasons.push("skill name matches query");
    }
    const exactCommandMatches = normalizedCommands.filter((command) => command === normalizedQuery);
    if (exactCommandMatches.length > 0) {
        score += 320;
        matchedCommands.push(...exactCommandMatches);
    }
    else {
        const phraseCommandMatches = normalizedCommands.filter((command) => command.includes(normalizedQuery));
        if (phraseCommandMatches.length > 0) {
            score += 180;
            matchedCommands.push(...phraseCommandMatches);
        }
    }
    if (normalizedDescription.includes(normalizedQuery)) {
        score += 120;
        reasons.push("description matches query");
    }
    for (const token of queryTokens) {
        let tokenMatched = false;
        if (normalizedName.includes(token)) {
            matchedNameTerms.push(token);
            score += 40;
            tokenMatched = true;
        }
        if (normalizedDescription.includes(token)) {
            matchedDescriptionTerms.push(token);
            score += 15;
            tokenMatched = true;
        }
        const commandMatches = normalizedCommands.filter((command) => command.includes(token));
        if (commandMatches.length > 0) {
            matchedCommands.push(...commandMatches);
            score += 30;
            tokenMatched = true;
        }
        if (!tokenMatched) {
            return null;
        }
    }
    if (queryTokens.length > 1) {
        score += 25;
    }
    const uniqueNameTerms = unique(matchedNameTerms).sort();
    const uniqueDescriptionTerms = unique(matchedDescriptionTerms).sort();
    const uniqueCommands = unique(matchedCommands).sort();
    if (uniqueNameTerms.length > 0) {
        reasons.push(`matched name terms: ${uniqueNameTerms.join(", ")}`);
    }
    if (uniqueCommands.length > 0) {
        reasons.push(`matched commands: ${uniqueCommands.join(", ")}`);
    }
    if (uniqueDescriptionTerms.length > 0) {
        reasons.push(`matched description terms: ${uniqueDescriptionTerms.join(", ")}`);
    }
    if (score === 0) {
        return null;
    }
    return {
        skill: toSkillCatalogEntry(skill),
        score,
        reasons: unique(reasons),
    };
}
export function searchCatalogSkills(skills, query, options = {}) {
    const limit = clampCatalogSearchLimit(options.limit);
    return filterSkillsByPolicy(skills, options.policy)
        .map((skill) => rankSkillMatch(skill, query))
        .filter((result) => result !== null)
        .sort((left, right) => right.score - left.score || left.skill.name.localeCompare(right.skill.name))
        .slice(0, limit);
}
//# sourceMappingURL=catalog.js.map