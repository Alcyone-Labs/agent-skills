import type {
  SkillAccessPolicy,
  SkillCatalogEntry,
  SkillInfo,
  SkillSearchResult,
  SourceSkillIndexEntry,
} from "./types.js";

interface SearchCatalogOptions {
  limit?: number;
  policy?: SkillAccessPolicy;
}

type CatalogSource = SkillInfo | SourceSkillIndexEntry;
type SearchFieldName = "name" | "commands" | "description" | "searchText";

interface SearchField {
  name: SearchFieldName;
  label: string;
  tokens: string[];
  length: number;
  frequencies: Map<string, number>;
}

interface CatalogDocument {
  skill: SkillCatalogEntry;
  normalizedName: string;
  normalizedDescription: string;
  normalizedCommands: string[];
  normalizedSearchText: string;
  fields: Record<SearchFieldName, SearchField>;
  tokenSet: Set<string>;
}

interface SearchCorpus {
  documents: CatalogDocument[];
  documentFrequencies: Map<string, number>;
  averageFieldLengths: Record<SearchFieldName, number>;
}

const DEFAULT_SEARCH_LIMIT = 5;
const MIN_SEARCH_LIMIT = 1;
const MAX_SEARCH_LIMIT = 5;
const BM25_K1 = 1.2;
const BM25_B = 0.75;
const BM25_FIELD_WEIGHTS: Record<SearchFieldName, number> = {
  name: 8,
  commands: 5,
  description: 3,
  searchText: 1.5,
};

function normalizeSkillName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePolicySet(values?: string[]): Set<string> {
  return new Set((values ?? []).map(normalizeSkillName).filter((value) => value.length > 0));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function uniqueTokens(value: string): string[] {
  return unique(tokenize(value));
}

function countTokens(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return frequencies;
}

function isSkillInfo(skill: CatalogSource): skill is SkillInfo {
  return "manifest" in skill;
}

function createSearchField(
  name: SearchFieldName,
  label: string,
  value: string,
): SearchField {
  const tokens = tokenize(value);
  return {
    name,
    label,
    tokens,
    length: tokens.length,
    frequencies: countTokens(tokens),
  };
}

function getSearchText(skill: CatalogSource): string {
  if (isSkillInfo(skill)) {
    return skill.description ?? "";
  }

  return skill.searchText;
}

export function clampCatalogSearchLimit(limit?: number): number {
  if (limit === undefined || Number.isNaN(limit)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(MAX_SEARCH_LIMIT, Math.max(MIN_SEARCH_LIMIT, Math.trunc(limit)));
}

export function isSkillAllowed(skillName: string, policy?: SkillAccessPolicy): boolean {
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

export function assertSkillAllowed(
  skillName: string,
  action: "find" | "install" | "use",
  policy?: SkillAccessPolicy,
): void {
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

export function filterSkillsByPolicy<T extends { name: string }>(
  skills: readonly T[],
  policy?: SkillAccessPolicy,
): T[] {
  return skills.filter((skill) => isSkillAllowed(skill.name, policy));
}

export function toSkillCatalogEntry(skill: CatalogSource): SkillCatalogEntry {
  if (isSkillInfo(skill)) {
    return {
      name: skill.name,
      description: skill.description,
      exportedCommands: [...skill.manifest.exportedCommands],
      path: skill.path,
      source: skill.source,
    };
  }

  return {
    name: skill.name,
    description: skill.description,
    exportedCommands: [...skill.exportedCommands],
    path: skill.path,
    source: skill.source,
  };
}

function createCatalogDocument(skill: CatalogSource): CatalogDocument {
  const entry = toSkillCatalogEntry(skill);
  const description = entry.description ?? "";
  const searchText = getSearchText(skill);
  const commandsText = entry.exportedCommands.join(" ");
  const fields = {
    name: createSearchField("name", "name", entry.name),
    commands: createSearchField("commands", "commands", commandsText),
    description: createSearchField("description", "description", description),
    searchText: createSearchField("searchText", "guide", searchText),
  } satisfies Record<SearchFieldName, SearchField>;

  return {
    skill: entry,
    normalizedName: entry.name.toLowerCase(),
    normalizedDescription: description.toLowerCase(),
    normalizedCommands: entry.exportedCommands.map((command) => command.toLowerCase()),
    normalizedSearchText: searchText.toLowerCase(),
    fields,
    tokenSet: new Set(unique([
      ...fields.name.tokens,
      ...fields.commands.tokens,
      ...fields.description.tokens,
      ...fields.searchText.tokens,
    ])),
  };
}

function createSearchCorpus(skills: readonly CatalogSource[]): SearchCorpus {
  const documents = skills.map(createCatalogDocument);
  const documentFrequencies = new Map<string, number>();
  const averageFieldLengths = {
    name: 0,
    commands: 0,
    description: 0,
    searchText: 0,
  } satisfies Record<SearchFieldName, number>;

  for (const document of documents) {
    for (const token of document.tokenSet) {
      documentFrequencies.set(token, (documentFrequencies.get(token) ?? 0) + 1);
    }

    averageFieldLengths.name += document.fields.name.length;
    averageFieldLengths.commands += document.fields.commands.length;
    averageFieldLengths.description += document.fields.description.length;
    averageFieldLengths.searchText += document.fields.searchText.length;
  }

  const documentCount = documents.length || 1;
  averageFieldLengths.name /= documentCount;
  averageFieldLengths.commands /= documentCount;
  averageFieldLengths.description /= documentCount;
  averageFieldLengths.searchText /= documentCount;

  return {
    documents,
    documentFrequencies,
    averageFieldLengths,
  };
}

function bm25Score(
  termFrequency: number,
  fieldLength: number,
  averageFieldLength: number,
  documentFrequency: number,
  documentCount: number,
): number {
  if (termFrequency === 0 || documentFrequency === 0) {
    return 0;
  }

  const safeAverageFieldLength = averageFieldLength > 0 ? averageFieldLength : 1;
  const normalizedFieldLength = fieldLength > 0 ? fieldLength : 1;
  const idf = Math.log(1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5));
  const denominator =
    termFrequency + BM25_K1 * (1 - BM25_B + BM25_B * (normalizedFieldLength / safeAverageFieldLength));

  return idf * ((termFrequency * (BM25_K1 + 1)) / denominator);
}

export function listCatalogSkills(
  skills: readonly CatalogSource[],
  policy?: SkillAccessPolicy,
): SkillCatalogEntry[] {
  return filterSkillsByPolicy(skills, policy)
    .map(toSkillCatalogEntry)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildSearchReasons(document: CatalogDocument, queryTokens: string[], normalizedQuery: string): string[] {
  const reasons: string[] = [];
  const matchedFieldTerms: Array<{ field: SearchField; terms: string[] }> = [];

  if (document.normalizedName === normalizedQuery) {
    reasons.push("exact skill name match");
  }

  for (const field of Object.values(document.fields)) {
    const matchedTerms = queryTokens.filter((token) => field.frequencies.has(token));
    if (matchedTerms.length > 0) {
      matchedFieldTerms.push({
        field,
        terms: unique(matchedTerms).sort(),
      });
    }
  }

  matchedFieldTerms.sort(
    (left, right) =>
      BM25_FIELD_WEIGHTS[right.field.name] - BM25_FIELD_WEIGHTS[left.field.name] ||
      right.terms.length - left.terms.length,
  );

  for (const match of matchedFieldTerms) {
    if (match.field.name === "commands") {
      const matchedCommands = unique(
        document.normalizedCommands.filter(
          (command) => command === normalizedQuery || queryTokens.some((token) => command.includes(token)),
        ),
      ).sort();

      if (matchedCommands.length > 0) {
        reasons.push(`matched commands: ${matchedCommands.join(", ")}`);
        continue;
      }
    }

    reasons.push(`matched ${match.field.label} terms: ${match.terms.join(", ")}`);
  }

  return unique(reasons);
}

function rankSkillMatch(
  document: CatalogDocument,
  queryTokens: string[],
  normalizedQuery: string,
  corpus: SearchCorpus,
): SkillSearchResult | null {
  let score = 0;

  for (const token of queryTokens) {
    const documentFrequency = corpus.documentFrequencies.get(token) ?? 0;

    for (const field of Object.values(document.fields)) {
      score +=
        BM25_FIELD_WEIGHTS[field.name] *
        bm25Score(
          field.frequencies.get(token) ?? 0,
          field.length,
          corpus.averageFieldLengths[field.name],
          documentFrequency,
          corpus.documents.length,
        );
    }
  }

  if (document.normalizedName === normalizedQuery) {
    score += 12;
  } else if (document.normalizedName.includes(normalizedQuery)) {
    score += 4;
  }

  if (document.normalizedCommands.some((command) => command === normalizedQuery)) {
    score += 6;
  }

  if (document.normalizedDescription.includes(normalizedQuery)) {
    score += 2;
  }

  if (document.normalizedSearchText.includes(normalizedQuery)) {
    score += 1;
  }

  const reasons = buildSearchReasons(document, queryTokens, normalizedQuery);
  if (score <= 0 || reasons.length === 0) {
    return null;
  }

  return {
    skill: document.skill,
    score,
    reasons,
  };
}

export function searchCatalogSkills(
  skills: readonly CatalogSource[],
  query: string,
  options: SearchCatalogOptions = {},
): SkillSearchResult[] {
  const limit = clampCatalogSearchLimit(options.limit);
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const queryTokens = uniqueTokens(normalizedQuery);
  if (queryTokens.length === 0) {
    return [];
  }

  const corpus = createSearchCorpus(skills);

  return corpus.documents
    .map((document) => rankSkillMatch(document, queryTokens, normalizedQuery, corpus))
    .filter((result): result is SkillSearchResult => result !== null)
    .filter((result) => isSkillAllowed(result.skill.name, options.policy))
    .sort((left, right) => right.score - left.score || left.skill.name.localeCompare(right.skill.name))
    .slice(0, limit);
}
