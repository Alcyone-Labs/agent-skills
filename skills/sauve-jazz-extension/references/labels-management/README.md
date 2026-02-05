# Labels Management

## Overview

Labels in Sauve are user-managed collections organized hierarchically under the `labels:/` namespace. Unlike system-managed namespaces (rss:/, bookmarks:/), labels can be nested arbitrarily deep and are fully controlled by users.

## Label Structure

```
labels:/                    # Root (system-managed, holds top-level children)
├── ai                      # labels:/ai
│   └── research            # labels:/ai/research (child of ai)
├── work                    # labels:/work
│   └── projects            # labels:/work/projects
│       └── active          # labels:/work/projects/active
└── personal                # labels:/personal
```

## Key Characteristics

| Aspect        | Behavior                                          |
| ------------- | ------------------------------------------------- |
| Namespace     | `labels:/` (user-managed)                         |
| Hierarchy     | Arbitrary depth via `/` separator                 |
| Children      | Stored in `children: string[]` array              |
| Bidirectional | Parent knows children, children reference content |
| Aggregation   | Parent label views include descendant items       |
| Sync          | Full Jazz sync via service worker                 |

## When to Use

- **Labels**: User-defined categories for organizing content
- **Sub-collections**: Hierarchical organization (e.g., `ai/research` under `ai`)
- **Cross-cutting**: Content can have multiple labels (unlike single-parent folders)

## Workflow Decision Tree

```
User creates "AI Research"
├─ Detect user intent → Normalize to labels:/ai-research
├─ Check if exists in collections record
├─ Create path if needed:
│   ├─ Ensure labels:/ root exists (system-managed)
│   ├─ Create labels:/ai (if not exists)
│   └─ Create labels:/ai/research (the leaf)
├─ Link hierarchy:
│   ├─ Add labels:/ai to labels:/ children
│   └─ Add labels:/ai/research to labels:/ai children
└─ Index for O(1) lookup

Content assignment:
├─ User assigns labels:/ai/research to content
├─ Update content.collectionNames
└─ Update collection.contentHashes (bidirectional)
```

## UI ↔ Service Worker Flow

```
Popup UI
  ├─ Normalize input via normalizeLabelCollectionName()
  ├─ Update collections via reading list mutation
  │   type: 'jazz:readingList:updateCollections'
  └─ Optimistic UI update (optional)

Service Worker
  ├─ handleReadingListMutation()
  ├─ updateReadingListItemCollections()
  └─ addCollectionToContent()
      └─ ensureLabelPath() creates missing parents + children links
```

## Parent Label Views

- `labels:/ai` should show items from `labels:/ai/**`.
- `contentHashes` on each label stores direct membership only; UI
  aggregates descendants when displaying parent labels.

## Rules

- Always normalize user input via `normalizeLabelCollectionName()`
- Never create labels outside `labels:/` namespace
- Always maintain `children` arrays for hierarchy
- Parent collections are created automatically when creating nested labels
- Deleting a parent should consider orphaned children

## References

- `api.md` - Label management functions
- `configuration.md` - Schema and data model
- `patterns.md` - Common implementation patterns
- `gotchas.md` - Known issues and solutions
