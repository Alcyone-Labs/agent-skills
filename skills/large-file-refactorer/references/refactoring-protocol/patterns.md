# Refactoring Patterns

Common patterns for splitting large files into modular components.

## Pattern 1: Extract Repository

**When to Use:** Data access logic mixed with business logic.

**Before:**
```typescript
class UserManager {
  async findUser(id: string) {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  }
  
  async createUser(data: UserData) {
    // validation + business logic + db query mixed
  }
}
```

**After:**
```typescript
// UserRepository.ts
export class UserRepository {
  constructor(private readonly db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    const result = await this.db.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
  }
  
  async insert(data: UserData): Promise<User> {
    const result = await this.db.query(
      "INSERT INTO users (...) VALUES (...) RETURNING *",
      [/* params */]
    );
    return result.rows[0];
  }
}

// UserManager.ts
import { UserRepository } from "./user-repository.js";

export class UserManager {
  constructor(private readonly repo: UserRepository) {}
  
  async findUser(id: string) {
    return this.repo.findById(id);
  }
}
```

## Pattern 2: Extract Validator

**When to Use:** Extensive validation logic scattered throughout.

**Before:**
```typescript
class UserService {
  createUser(data: UserData) {
    if (!data.email.includes("@")) throw new Error("Invalid email");
    if (data.password.length < 8) throw new Error("Password too short");
    if (!/[A-Z]/.test(data.password)) throw new Error("Need uppercase");
    // ... 20 more validation lines
    // business logic starts here
  }
}
```

**After:**
```typescript
// user-validator.ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class UserValidator {
  validateCreateUserData(data: UserData): ValidationResult {
    const errors: string[] = [];
    
    if (!data.email?.includes("@")) errors.push("Invalid email");
    if ((data.password?.length || 0) < 8) errors.push("Password too short");
    if (!/[A-Z]/.test(data.password || "")) errors.push("Need uppercase");
    
    return { valid: errors.length === 0, errors };
  }
  
  validateUpdateUserData(data: Partial<UserData>): ValidationResult {
    // specific validation for updates
  }
}

// user-service.ts
import { UserValidator } from "./user-validator.js";

export class UserService {
  constructor(private readonly validator: UserValidator) {}
  
  createUser(data: UserData) {
    const validation = this.validator.validateCreateUserData(data);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    // business logic only
  }
}
```

## Pattern 3: Extract Service

**When to Use:** Business logic mixed with orchestration.

**Before:**
```typescript
class OrderController {
  async createOrder(req: Request) {
    // validate request
    // check inventory
    // calculate pricing
    // apply discounts
    // create order record
    // send confirmation email
    // update analytics
    // return response
  }
}
```

**After:**
```typescript
// order-service.ts
export class OrderService {
  constructor(
    private readonly inventory: InventoryService,
    private readonly pricing: PricingService,
    private readonly notifications: NotificationService
  ) {}
  
  async createOrder(data: OrderData): Promise<Order> {
    await this.inventory.checkAvailability(data.items);
    const price = await this.pricing.calculate(data.items, data.discountCode);
    const order = await this.saveOrder(data, price);
    await this.notifications.sendOrderConfirmation(order);
    return order;
  }
}

// order-controller.ts
import { OrderService } from "./order-service.js";

export class OrderController {
  constructor(private readonly service: OrderService) {}
  
  async createOrder(req: Request) {
    const data = this.validateRequest(req);
    const order = await this.service.createOrder(data);
    return this.formatResponse(order);
  }
}
```

## Pattern 4: Extract Constants

**When to Use:** Many magic strings or numbers.

**Before:**
```typescript
if (retryCount >= 3) {
  throw new Error("Max retries exceeded");
}

const DEFAULT_TIMEOUT = 5000;
const API_BASE = "/api/v1";
const MAX_RESULTS = 100;
// scattered throughout file
```

**After:**
```typescript
// constants.ts
export const MAX_RETRIES = 3;
export const DEFAULT_TIMEOUT_MS = 5000;
export const API_BASE_URL = "/api/v1";
export const MAX_PAGE_SIZE = 100;
export const ERROR_MESSAGES = {
  MAX_RETRIES_EXCEEDED: "Max retries exceeded",
  TIMEOUT: "Request timed out",
  NOT_FOUND: "Resource not found"
} as const;

// main-file.ts
import { MAX_RETRIES, ERROR_MESSAGES } from "./constants.js";

if (retryCount >= MAX_RETRIES) {
  throw new Error(ERROR_MESSAGES.MAX_RETRIES_EXCEEDED);
}
```

## Pattern 5: Extract Utilities

**When to Use:** Helper functions used by multiple classes.

**Before:**
```typescript
class PaymentProcessor {
  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
  
  private parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

class InvoiceGenerator {
  // same formatCurrency function duplicated
  // same generateId function duplicated
}
```

**After:**
```typescript
// formatters.ts
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

export function parseISODate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date;
}

// utils.ts
export function generateId(length = 9): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// payment-processor.ts
import { formatCurrency, generateId } from "./utils.js";

export class PaymentProcessor {
  process(amount: number) {
    const id = generateId();
    const formatted = formatCurrency(amount);
    // ...
  }
}
```

## Pattern 6: Extract Types/Interfaces

**When to Use:** Type definitions cluttering implementation files.

**Before:**
```typescript
// user-manager.ts (400 lines)
interface User {
  id: string;
  email: string;
  name: string;
}

interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

interface UpdateUserRequest {
  email?: string;
  name?: string;
}

interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserRequest): Promise<User>;
}

// 50 more lines of types...

export class UserManager {
  // implementation
}
```

**After:**
```typescript
// types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
}

// user-repository.ts
import { User, CreateUserRequest } from "./types.js";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserRequest): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// user-manager.ts
import { User, CreateUserRequest, UpdateUserRequest } from "./types.js";
import { IUserRepository } from "./user-repository.js";

export class UserManager {
  constructor(private readonly repo: IUserRepository) {}
  // implementation
}
```

## Pattern 7: Split by Feature/Domain

**When to Use:** Single file handling multiple unrelated concerns.

**Before:**
```typescript
// admin-dashboard.ts (1000+ lines)
export class AdminDashboard {
  // User management (200 lines)
  async createUser() {}
  async deleteUser() {}
  async listUsers() {}
  
  // Order management (200 lines)
  async getOrder() {}
  async updateOrder() {}
  async refundOrder() {}
  
  // Analytics (200 lines)
  async getRevenueReport() {}
  async getUserMetrics() {}
  
  // Settings (200 lines)
  async updateConfig() {}
  async getConfig() {}
}
```

**After:**
```typescript
// user-management.ts
export class UserManagement {
  async createUser() {}
  async deleteUser() {}
  async listUsers() {}
}

// order-management.ts
export class OrderManagement {
  async getOrder() {}
  async updateOrder() {}
  async refundOrder() {}
}

// analytics.ts
export class Analytics {
  async getRevenueReport() {}
  async getUserMetrics() {}
}

// settings.ts
export class Settings {
  async updateConfig() {}
  async getConfig() {}
}

// admin-dashboard.ts (orchestrator)
import { UserManagement } from "./user-management.js";
import { OrderManagement } from "./order-management.js";
import { Analytics } from "./analytics.js";
import { Settings } from "./settings.js";

export class AdminDashboard {
  users = new UserManagement();
  orders = new OrderManagement();
  analytics = new Analytics();
  settings = new Settings();
}
```

## Decision Tree

```
Identify what to extract:
├── Data access code? → Extract Repository
├── Validation logic? → Extract Validator
├── Business logic in controller? → Extract Service
├── Magic strings/numbers? → Extract Constants
├── Shared helpers? → Extract Utilities
├── Type definitions? → Extract Types
├── Multiple domains? → Split by Feature
└── Mixed concerns? → Apply multiple patterns
```
