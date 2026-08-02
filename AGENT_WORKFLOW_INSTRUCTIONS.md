# Agent Workflow Instructions - F5 Automation Control Center

## Core Principle: Iterative Loop Until Completion

You MUST operate in a continuous **THINK → ARCHITECT → IMPLEMENT → VERIFY → TEST** loop until the task is 100% complete with zero errors. Do not stop at "good enough" - continue until the instruction is fully satisfied.

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT LOOP                             │
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │  THINK   │───▶│ ARCHITECT│───▶│IMPLEMENT │───▶│  VERIFY  │  │
│   │          │    │          │    │          │    │          │  │
│   └──────────┘    └──────────┘    └──────────┘    └────┬─────┘  │
│                                                        │        │
│   ┌────────────────────────────────────────────────────┘        │
│   │                                                             │
│   ▼                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐  │
│   │   TEST   │───▶│  CHECK   │───▶│  COMPLETE?               │  │
│   │          │    │  ERRORS  │    │  • All tests pass?       │  │
│   └──────────┘    └─────┬────┘    │  • No TypeScript errors? │  │
│                         │         │  • Database valid?       │  │
│                         ▼         │  • UI renders?           │  │
│                    ┌──────────┐   │  • Task fully done?      │  │
│         ┌──────────│  ERRORS  │   └────────────┬─────────────┘  │
│         │          │ FOUND?   │◀───────────────┘                │
│         │          └──────────┘                                 │
│         │               │                                       │
│         │               │ NO                                    │
│         │               ▼                                       │
│         │          ┌──────────┐                                 │
│         └──────────│   EXIT   │                                 │
│                    │  LOOP    │                                 │
│                    └──────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: THINK - Understand & Plan

Before writing ANY code:

1. **Read the instruction carefully** - Understand the exact requirement
2. **Check AGENTS.md** - Review project structure, conventions, and patterns
3. **Identify affected components**:
   - Which pages/components need changes?
   - Which API endpoints are involved?
   - Which database tables are affected?
   - Which stores need updates?
4. **Plan the implementation** - Write a brief plan before coding

---

## Phase 2: ARCHITECT - Design Before Code

### Database First (CRITICAL)

**NEVER assume database schema exists. ALWAYS verify:**

```bash
# 1. Read the schema file
read prisma/schema.prisma

# 2. Check if required models exist
# 3. Check if required fields exist on models
# 4. For new tables/columns, plan the migration
```

**Database Verification Checklist:**
- [ ] Required model exists?
- [ ] All required fields exist?
- [ ] Field types are correct?
- [ ] Relations are properly defined?
- [ ] Indexes are considered for performance?

**If adding new tables/columns:**
1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate` or `npx prisma migrate dev`
3. Run `npm run db:generate` to update Prisma client
4. Update seed data if needed (`prisma/seed.ts`)

### API Design

- Follow RESTful conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Validate all inputs with Zod schemas (`src/lib/server/validation.ts`)
- Return consistent response formats

### Component Design

- Identify if it's a new page or reusable component
- Plan props interface (TypeScript)
- Consider state management (local vs store)
- Plan for loading/error states

---

## Phase 3: IMPLEMENT - Write Code Following Best Practices

### SvelteKit Best Practices

#### 1. File Organization

```
src/routes/
├── (app)/                    # Group for authenticated routes
│   ├── +layout.svelte        # Shared layout
│   ├── +page.svelte          # Dashboard
│   ├── feature/              # Feature page
│   │   ├── +page.svelte      # Page component
│   │   ├── +page.server.ts   # Server load function (if needed)
│   │   └── +server.ts        # API endpoint (if needed)
```

#### 2. Page Components (+page.svelte)

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  
  // Props from server load
  let { data }: { data: PageData } = $props();
  
  // Local state
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // Derived state
  let hasPermission = $derived(data.user?.role === 'admin');
  
  // Event handlers
  async function handleAction() {
    isLoading = true;
    error = null;
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* data */ })
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      // Handle success
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Loading state -->
{#if isLoading}
  <div class="flex justify-center p-8">
    <LoadingSpinner />
  </div>
<!-- Error state -->
{:else if error}
  <Alert type="error" message={error} />
<!-- Content -->
{:else}
  <div class="space-y-6">
    <!-- Page content -->
  </div>
{/if}
```

#### 3. Server Load Functions (+page.server.ts)

```typescript
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }
  
  // Check authorization (RBAC)
  if (!hasPermission(locals.user.role, 'feature:read')) {
    throw error(403, 'Forbidden');
  }
  
  try {
    // Fetch data
    const data = await prisma.model.findMany({
      where: { /* conditions */ },
      include: { /* relations */ }
    });
    
    return {
      data,
      user: locals.user
    };
  } catch (e) {
    throw error(500, 'Failed to load data');
  }
};
```

#### 4. API Endpoints (+server.ts)

```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/db';

// Validation schema
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email()
});

// GET handler
export const GET: RequestHandler = async ({ locals, url }) => {
  // Auth check
  if (!locals.user) throw error(401, 'Unauthorized');
  
  try {
    const data = await prisma.model.findMany();
    return json({ success: true, data });
  } catch (e) {
    throw error(500, 'Failed to fetch data');
  }
};

// POST handler
export const POST: RequestHandler = async ({ locals, request }) => {
  // Auth check
  if (!locals.user) throw error(401, 'Unauthorized');
  
  // Parse and validate
  let body;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON');
  }
  
  const result = schema.safeParse(body);
  if (!result.success) {
    throw error(400, result.error.message);
  }
  
  try {
    const created = await prisma.model.create({
      data: result.data
    });
    return json({ success: true, data: created }, { status: 201 });
  } catch (e) {
    throw error(500, 'Failed to create');
  }
};
```

#### 5. Stores (Svelte 5 Runes)

```typescript
// src/lib/stores/myStore.ts
import { writable, derived } from 'svelte/store';

// For Svelte 5, use $state in components instead of stores when possible
// Use stores for cross-component shared state

interface StoreState {
  data: any[];
  loading: boolean;
  error: string | null;
}

function createStore() {
  const { subscribe, set, update } = writable<StoreState>({
    data: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    load: async () => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        set({ data, loading: false, error: null });
      } catch (e) {
        set({ data: [], loading: false, error: e.message });
      }
    },
    reset: () => set({ data: [], loading: false, error: null })
  };
}

export const myStore = createStore();
```

#### 6. Components (.svelte)

```svelte
<script lang="ts">
  interface Props {
    title: string;
    items: Item[];
    onSelect?: (item: Item) => void;
  }
  
  let { title, items, onSelect }: Props = $props();
  
  // Local state
  let selectedId = $state<string | null>(null);
  
  // Derived state
  let selectedItem = $derived(items.find(i => i.id === selectedId));
  
  function handleClick(item: Item) {
    selectedId = item.id;
    onSelect?.(item);
  }
</script>

<div class="card">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <ul class="space-y-2">
    {#each items as item (item.id)}
      <li>
        <button
          class="w-full text-left px-4 py-2 rounded-lg transition-colors
                 {selectedId === item.id ? 'bg-primary-100 dark:bg-primary-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
          onclick={() => handleClick(item)}
        >
          {item.name}
        </button>
      </li>
    {:else}
      <li class="text-gray-500 text-center py-4">No items</li>
    {/each}
  </ul>
</div>
```

### Code Style Rules

1. **TypeScript**: Always use strict types, avoid `any`
2. **Naming**: 
   - Components: PascalCase (`MyComponent.svelte`)
   - Utilities: camelCase (`formatDate.ts`)
   - Constants: UPPER_SNAKE_CASE
3. **Imports**: Use `$lib` alias for internal imports
4. **Error Handling**: Always handle errors, show user-friendly messages
5. **Loading States**: Always show loading indicators for async operations

---

## Phase 4: VERIFY - Check Implementation

### Database Verification (MANDATORY)

After ANY database-related changes:

```bash
# 1. Check Prisma schema is valid
npx prisma validate

# 2. Generate client
npm run db:generate

# 3. Run migrations if needed
npm run db:migrate

# 4. Verify tables/columns exist
sqlite3 prisma/dev.db ".schema ModelName"
```

### TypeScript Verification

```bash
# Check for type errors
npm run check
```

**Must resolve ALL TypeScript errors before proceeding.**

### Code Quality Checks

- [ ] No `console.log` statements (use logger instead)
- [ ] All functions have return types
- [ ] All props are typed
- [ ] No unused imports/variables
- [ ] Proper error handling in all async operations

---

## Phase 5: TEST - Validate Everything

### Test Requirements

1. **TypeScript Compilation**: `npm run check` - must pass
2. **Unit Tests**: `npm test` - all must pass
3. **Build Test**: `npm run build` - must complete without errors

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] All data displays correctly
- [ ] Forms submit properly
- [ ] Error states work (test with invalid data)
- [ ] Loading states display
- [ ] Responsive design works (mobile/desktop)
- [ ] Dark mode works (if applicable)

### Database Testing

```bash
# Verify data in database
sqlite3 prisma/dev.db "SELECT * FROM TableName LIMIT 5;"
```

---

## Phase 6: DECISION - Continue or Exit

### Exit Criteria (ALL must be true):

1. ✅ Task fully implemented as specified
2. ✅ `npm run check` passes (no TypeScript errors)
3. ✅ `npm test` passes (all tests pass)
4. ✅ `npm run build` succeeds
5. ✅ Database schema is valid and migrated
6. ✅ No runtime errors in browser/console
7. ✅ UI renders correctly

### If ANY criteria fails:

**GO BACK TO PHASE 1** and iterate:
- Fix the errors
- Re-verify
- Re-test
- Continue looping until all criteria pass

---

## Common Patterns

### Adding a New Feature (Complete Workflow)

```
1. THINK: Understand what feature needs
2. ARCHITECT:
   a. Check database - add models if needed
   b. Plan API endpoints
   c. Plan components
3. IMPLEMENT:
   a. Update prisma/schema.prisma
   b. Run migrations
   c. Create API endpoint (+server.ts)
   d. Create page/component
   e. Add to navigation
4. VERIFY:
   a. Validate schema
   b. Check types
5. TEST:
   a. Run npm run check
   b. Run npm test
   c. Run npm run build
   d. Manual test in browser
6. DECISION: If all pass → DONE, else → loop back
```

### Adding a Database Column

```
1. Read prisma/schema.prisma
2. Add column to model
3. Run: npm run db:migrate
4. Run: npm run db:generate
5. Update any affected queries
6. Run: npm run check
7. Test the feature
```

---

## Error Recovery

### If you get stuck:

1. **Read the error carefully** - Understand what's wrong
2. **Check AGENTS.md** - Look for relevant patterns
3. **Check existing code** - Find similar implementations
4. **Verify database** - Ensure schema matches expectations
5. **Simplify** - Remove complexity, get basic version working first

### Never:

- ❌ Skip database verification
- ❌ Ignore TypeScript errors
- ❌ Skip testing
- ❌ Assume schema exists without checking
- ❌ Stop at "it mostly works"

---

## Quick Reference Commands

```bash
# Database
npx prisma validate          # Validate schema
npm run db:generate          # Generate Prisma client
npm run db:migrate           # Run migrations
npm run db:seed              # Seed database
npx prisma studio            # Open Prisma Studio

# Development
npm run dev                  # Start dev server
npm run check                # Type check
npm run check:watch          # Type check (watch)

# Testing
npm test                     # Run tests
npm run test:watch           # Run tests (watch)
npm run build                # Build for production
```

---

## Summary Checklist

Before claiming task is complete:

- [ ] Read and understood the instruction
- [ ] Checked AGENTS.md for conventions
- [ ] Verified database schema (read prisma/schema.prisma)
- [ ] Migrated database if needed
- [ ] Implemented following SvelteKit best practices
- [ ] Added proper error handling
- [ ] Added loading states
- [ ] Ran `npm run check` - NO errors
- [ ] Ran `npm test` - ALL pass
- [ ] Ran `npm run build` - succeeds
- [ ] Manually verified in browser
- [ ] Task is 100% complete

**REMEMBER: Loop until ALL checks pass. Do not stop early.**
