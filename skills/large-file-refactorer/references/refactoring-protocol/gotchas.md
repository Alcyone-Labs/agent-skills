# Refactoring Gotchas

Common pitfalls and how to avoid them during large file refactoring.

## Critical Pitfalls

### 1. Refactoring Without Tests

**The Mistake:** Starting to split code before writing tests.

**Why It Fails:**
- No safety net for regressions
- Can't verify behavior unchanged
- May introduce bugs that go unnoticed
- User loses trust in refactoring process

**The Fix:**
- Write tests FIRST (Phase 2 is mandatory)
- Document baseline test results
- Never skip to Phase 3

### 2. Changing Behavior During Refactoring

**The Mistake:** Fixing bugs or adding features while refactoring.

**Why It Fails:**
- Makes it impossible to verify correctness
- Blurs line between refactoring and rewriting
- Can break dependent code unexpectedly
- Violates refactoring definition

**The Fix:**
- Refactoring = restructuring without behavior change
- Document known bugs, don't fix them
- Create separate tasks for bug fixes
- Compare outputs before/after to ensure identical

### 3. Breaking Import Chains

**The Mistake:** Not updating all files that import from the refactored file.

**Why It Fails:**
- TypeScript/JavaScript compilation errors
- Runtime failures
- Broken dependencies

**The Fix:**
```bash
# Find all importers BEFORE refactoring
grep -r "from.*['\"].*UserManager['\"]" --include="*.ts" --include="*.js" .

# After refactoring, check if re-exports handle imports
# If not, update each importer
```

### 4. Losing Git History

**The Mistake:** Creating new files instead of using git mv.

**Why It Fails:**
- Git history lost for extracted code
- Blame shows all lines as new
- Harder to track when bugs introduced

**The Fix:**
```bash
# Use git mv when extracting
git mv UserManager.ts UserService.ts
# Then edit UserService.ts to remove extra code
# Create UserManager.ts fresh with imports
```

### 5. Wrong File Naming

**The Mistake:** Using inconsistent naming conventions.

**Why It Fails:**
- Confuses other developers
- Doesn't match project conventions
- Makes imports harder to follow

**The Fix:**
- Use kebab-case for files: `user-repository.ts`
- Use PascalCase for classes: `UserRepository`
- Match existing project conventions

### 6. Circular Dependencies

**The Mistake:** Splitting code in a way that creates import cycles.

**Why It Fails:**
- Compilation errors
- Runtime failures
- Hard to untangle later

**The Fix:**
```typescript
// BAD: Circular dependency
// user.ts
import { Order } from "./order.js";
export class User { orders: Order[]; }

// order.ts
import { User } from "./user.js";
export class Order { user: User; }

// GOOD: Extract interface/types
// types.ts
export interface IUser { id: string; }
export interface IOrder { id: string; userId: string; }

// user.ts
import { IOrder } from "./types.js";
export class User { orders: IOrder[]; }

// order.ts
import { IUser } from "./types.js";
export class Order { user: IUser; }
```

## Error Handling During Refactoring

### If Tests Fail After Refactoring

**Don't panic** - this is why we wrote tests first.

**Debug Steps:**
1. Compare original vs refactored code line by line
2. Check imports - are all dependencies properly imported?
3. Check exports - are all necessary functions/classes exported?
4. Check side effects - did you change execution order?
5. Fix only the refactoring mistake
6. Re-run tests

**Example Debug:**
```typescript
// Original
async function process() {
  const user = await getUser();
  await updateLog(user.id); // Side effect before main work
  return await doWork(user);
}

// BAD Refactor - changed order!
async function process() {
  const user = await getUser();
  const result = await doWork(user); // Main work first
  await updateLog(user.id); // Side effect after
  return result;
}

// GOOD Refactor - preserve order
async function process() {
  const user = await getUser();
  await updateLog(user.id);
  return await doWork(user);
}
```

### If User Reports Breaking Changes

**Response Pattern:**
1. Acknowledge: "I see that X broke. Let me investigate."
2. Investigate: Check what behavior changed
3. Restore: If uncertain, revert and try different approach
4. Document: Add test to prevent regression

**Never:**
- Dismiss user's concern
- Claim "it should work"
- Make changes without understanding the issue

## Common Mistakes by Pattern

### Repository Pattern Mistakes

**Mistake 1:** Mixing business logic in repository
```typescript
// BAD
class UserRepository {
  async createUser(data: UserData) {
    // validation here is WRONG
    if (!data.email.includes("@")) throw new Error();
    // db logic
  }
}

// GOOD
class UserRepository {
  async insert(data: UserData) {
    // ONLY db logic
  }
}
```

**Mistake 2:** Not handling null/undefined
```typescript
// BAD
async findById(id: string): Promise<User> {
  const result = await db.query("...", [id]);
  return result.rows[0]; // May be undefined!
}

// GOOD
async findById(id: string): Promise<User | null> {
  const result = await db.query("...", [id]);
  return result.rows[0] || null;
}
```

### Validator Pattern Mistakes

**Mistake:** Throwing in validator
```typescript
// BAD
class UserValidator {
  validate(data: UserData) {
    if (!data.email) throw new Error("No email");
    // validators should return results, not throw
  }
}

// GOOD
class UserValidator {
  validate(data: UserData): ValidationResult {
    const errors: string[] = [];
    if (!data.email) errors.push("No email");
    return { valid: errors.length === 0, errors };
  }
}
```

### Service Pattern Mistakes

**Mistake:** Services depending on other services that depend back
```typescript
// BAD - Circular
class OrderService {
  constructor(private userService: UserService) {}
}
class UserService {
  constructor(private orderService: OrderService) {}
}

// GOOD - Depends on abstractions
class OrderService {
  constructor(
    private userRepo: IUserRepository,
    private notificationService: INotificationService
  ) {}
}
```

## Import/Export Gotchas

### Missing .js Extension

```typescript
// BAD - won't work in ESM
import { UserRepository } from "./user-repository";

// GOOD
import { UserRepository } from "./user-repository.js";
```

### Star Exports

```typescript
// Can be confusing
export * from "./user-repository.js";
export * from "./user-validator.js";

// Better to be explicit
export { UserRepository } from "./user-repository.js";
export { UserValidator } from "./user-validator.js";
```

### Default Exports

```typescript
// Avoid default exports when refactoring
// Makes imports inconsistent

// BAD
export default class UserRepository {}
// Import: import UserRepository from "./user-repository.js";
//        import UserRepo from "./user-repository.js"; // Inconsistent!

// GOOD
export class UserRepository {}
// Import: import { UserRepository } from "./user-repository.js";
```

## Test Gotchas

### Mocking Dependencies

```typescript
// BAD - mocking implementation details
jest.mock("./database", () => ({
  query: jest.fn() // too low level
}));

// GOOD - mock at repository boundary
jest.mock("./user-repository.js", () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn()
  }))
}));
```

### Async Test Issues

```typescript
// BAD - missing await
it("should create user", () => {
  const result = userService.create(data);
  expect(result).toBeDefined(); // result is Promise!
});

// GOOD
it("should create user", async () => {
  const result = await userService.create(data);
  expect(result).toBeDefined();
});
```

## Best Practices Checklist

Before considering refactoring complete:

- [ ] All original tests still pass
- [ ] No new test failures
- [ ] All imports updated
- [ ] No circular dependencies
- [ ] File naming consistent
- [ ] JSDoc on all public APIs
- [ ] No behavioral changes
- [ ] Lint/format clean
- [ ] User approved the changes
