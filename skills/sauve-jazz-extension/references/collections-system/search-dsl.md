# Collections Search DSL

## Overview

The Search DSL provides a powerful query language for filtering content by collections, text, and metadata. It supports boolean logic, subtree matching, and namespace-aware collection references.

## Query Syntax

### Basic Collection Filter

```
# Filter by collection name
ai-research                    → labels:/ai-research
"AI Research"                  → labels:/ai-research

# Namespace-qualified
labels:/ai                     → labels:/ai
rss:/example.com/feed          → rss:/example.com/feed
bookmarks:/work                → bookmarks:/work
```

### Boolean Operators

```
# OR (|) - Item has ANY of these collections
ai|ml                          → labels:/ai OR labels:/ml
rss:/feed1|rss:/feed2          → rss:/feed1 OR rss:/feed2

# AND (&) - Item has ALL of these collections
ai&research                    → labels:/ai AND labels:/research
work&important                  → labels:/work AND labels:/important

# NOT (!) - Item does NOT have this collection
!archived                      → NOT archived
!spam                          → NOT labels:/spam

# Combined
ai|ml&!archived                → (ai OR ml) AND (NOT archived)
```

### Subtree Matching

```
# Match any child of a collection (/** suffix)
labels:/ai/**                  → ai OR ai/research OR ai/implementation
rss:/example.com/**            → Any feed under example.com

# Combined with boolean
labels:/ai/**&!labels:/ai/done → Any AI label except done
```

### Special Collections

```
# Has any collection
has:collection                 → Item has at least one collection
has:label                      → Deprecated alias

# Specific flag collections
starred                        → Item is starred
archived                       → Item is archived
unread                         → Item is unread (no userReadAt)
read                           → Item is read (has userReadAt)
```

## Collection Expression Parsing

### `parseCollectionExpression(expression)`

```typescript
import { parseCollectionExpression } from "#/popup/utils/search-dsl-core";

// Parse "ai|ml&!archived"
const result = parseCollectionExpression("ai|ml&!archived");
// → {
//   anyOf: ['labels:/ai', 'labels:/ml'],
//   allOf: [],
//   noneOf: ['archived']
// }

// Parse "work&important"
parseCollectionExpression("work&important");
// → {
//   anyOf: [],
//   allOf: ['labels:/work', 'labels:/important'],
//   noneOf: []
// }

// Parse with subtree
parseCollectionExpression("labels:/ai/**");
// → {
//   anyOf: ['labels:/ai/**'],
//   allOf: [],
//   noneOf: []
// }
```

### CollectionCriteria Interface

```typescript
interface CollectionCriteria {
  anyOf?: string[]; // OR: item has at least one
  allOf?: string[]; // AND: item has all
  noneOf?: string[]; // NOT: item has none
  hasAny?: boolean; // Item has any collection
}
```

---

## Matching Logic

### `matchesCollectionCriteria(item, criteria)`

```typescript
import { matchesCollectionCriteria } from "#/popup/utils/search-dsl-core";

const item = {
  collectionNames: ["rss:/example.com/feed", "labels:/ai", "starred"],
};

// Check OR
matchesCollectionCriteria(item, {
  anyOf: ["labels:/ai", "labels:/ml"],
}); // → true (has ai)

// Check AND
matchesCollectionCriteria(item, {
  allOf: ["labels:/ai", "starred"],
}); // → true (has both)

// Check NOT
matchesCollectionCriteria(item, {
  noneOf: ["archived"],
}); // → true (not archived)

// Check combined
matchesCollectionCriteria(item, {
  anyOf: ["labels:/ai", "labels:/ml"],
  noneOf: ["archived"],
}); // → true (has ai AND not archived)
```

### Subtree Pattern Matching

```typescript
// Pattern: labels:/ai/**
// Matches:
// - labels:/ai
// - labels:/ai/research
// - labels:/ai/implementation
// - labels:/ai/research/deep-learning

const pattern = "labels:/ai/**";

matchesCollectionPattern("labels:/ai", pattern); // → true
matchesCollectionPattern("labels:/ai/research", pattern); // → true
matchesCollectionPattern("labels:/ai2", pattern); // → false (different segment)
matchesCollectionPattern("labels:/work", pattern); // → false
```

---

## Complete Search Implementation

### Search Bar Component

```typescript
import {
  parseCollectionExpression,
  matchesCollectionCriteria,
  tokenizeQuery,
} from '#/popup/utils/search-dsl-core';

function SearchBar({ items, onFilter }) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;

    // 1. Tokenize query
    const tokens = tokenizeQuery(query);

    // 2. Separate collection expressions from text
    const collectionExpression: string[] = [];
    const textTerms: string[] = [];

    for (const token of tokens) {
      if (
        token.includes(':') ||
        token.includes('|') ||
        token.includes('&') ||
        token.startsWith('!')
      ) {
        collectionExpression.push(token);
      } else {
        textTerms.push(token.toLowerCase());
      }
    }

    // 3. Parse collection criteria
    const criteria = collectionExpression.length > 0
      ? parseCollectionExpression(collectionExpression.join(' '))
      : null;

    // 4. Filter items
    return items.filter(item => {
      // Check collection criteria
      if (criteria) {
        if (!matchesCollectionCriteria(item, criteria)) {
          return false;
        }
      }

      // Check text search
      if (textTerms.length > 0) {
        const text = `${item.title} ${item.summary || ''}`.toLowerCase();
        if (!textTerms.some(term => text.includes(term))) {
          return false;
        }
      }

      return true;
    });
  }, [items, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search (e.g., ai|ml & !archived)"
      />
      <div>{filteredItems.length} results</div>
    </div>
  );
}
```

---

## Source-Specific Search

### RSS Feed Search

```typescript
// Search within specific RSS feed
const criteria = {
  anyOf: ["rss:/example.com/feed"],
};

// Search within RSS group
const groupFeeds = getFeedsInGroup(root, "rss-group:/research");
const criteria = {
  anyOf: groupFeeds,
};

// Search across all RSS (excluding bookmarks)
const rssItems = items.filter(
  (item) =>
    item.sourceType === "rss" && matchesCollectionCriteria(item, criteria),
);
```

### Bookmark Search

```typescript
// Search within bookmark folder
const criteria = {
  anyOf: ["bookmarks:/work"],
};

// Search all bookmarks (any folder)
const bookmarkItems = items.filter(
  (item) =>
    item.sourceType === "bookmark" && matchesCollectionCriteria(item, criteria),
);
```

### Combined Source and Label Search

```typescript
// RSS items with AI label
const criteria = {
  anyOf: ["rss:/example.com/feed"],
  allOf: ["labels:/ai"],
};

// Unread starred items from any source
const criteria = {
  allOf: ["starred"],
  noneOf: ["read"], // Or check userReadAt field
};
```

---

## Advanced Patterns

### Dynamic Collection Suggestions

```typescript
function getCollectionSuggestions(
  query: string,
  availableCollections: string[],
): string[] {
  const normalized = query.toLowerCase();

  return availableCollections
    .filter((collection) => {
      const displayName = getCollectionDisplayName(collection).toLowerCase();
      return displayName.includes(normalized);
    })
    .slice(0, 10);
}

// Usage
const suggestions = getCollectionSuggestions("ai", [
  "labels:/ai",
  "labels:/ai/research",
  "labels:/ai/implementation",
  "labels:/work",
]);
// → ['labels:/ai', 'labels:/ai/research', 'labels:/ai/implementation']
```

### Saved Searches

```typescript
interface SavedSearch {
  name: string;
  query: string;
  criteria: CollectionCriteria;
}

const savedSearches: SavedSearch[] = [
  {
    name: "AI News (Unread)",
    query: "rss-group:/ai & !read",
    criteria: {
      anyOf: ["rss-group:/ai"],
      noneOf: ["read"],
    },
  },
  {
    name: "Starred Research",
    query: "starred & labels:/research",
    criteria: {
      allOf: ["starred", "labels:/research"],
    },
  },
];
```

### Search History

```typescript
function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("searchHistory") || "[]");
  });

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      const updated = [query, ...prev.filter((q) => q !== query)].slice(0, 20);
      localStorage.setItem("searchHistory", JSON.stringify(updated));
      return updated;
    });
  };

  return { history, addToHistory };
}
```

---

## Query Examples

### Common Queries

```
# Show all RSS items
source:rss

# Show bookmarks only
source:bookmark

# AI-related content (regardless of source)
labels:/ai/**

# Unread items from AI group
rss-group:/ai & !read

# Starred but not archived
starred & !archived

# Research or work, but not done
(research|work) & !labels:/done

# Items from specific feed
rss:/example.com/feed

# Items without any labels
!has:collection
```

### Complex Queries

```
# Unread AI research from RSS, not starred
rss-group:/ai & labels:/research & !read & !starred

# Work bookmarks from last week
bookmarks:/work & date:>2024-01-01

# Important items (starred or high priority label)
starred|labels:/priority/high
```
