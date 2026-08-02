# Agent Quick Reference Card

## The Golden Rule
**LOOP UNTIL DONE** → Think → Architect → Implement → Verify → Test → Check → Repeat if needed

---

## Mandatory Verification Steps

### 1. Database (NEVER SKIP)
```bash
# ALWAYS check schema before assuming
read prisma/schema.prisma

# After any schema changes:
npx prisma validate
npm run db:generate
npm run db:migrate
```

### 2. TypeScript
```bash
npm run check    # Must pass with 0 errors
```

### 3. Tests
```bash
npm test         # Must pass all tests
npm run build    # Must build successfully
```

---

## SvelteKit Patterns

### New Page
```
src/routes/(app)/feature/
├── +page.svelte      # UI component
├── +page.server.ts   # Load data (optional)
└── +server.ts        # API endpoints (optional)
```

### API Endpoint Pattern
```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';

const schema = z.object({ name: z.string() });

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) throw error(400, result.error.message);
  
  // ... implementation
  return json({ success: true, data: result });
};
```

### Component Pattern (Svelte 5)
```svelte
<script lang="ts">
  interface Props {
    title: string;
    onAction?: () => void;
  }
  
  let { title, onAction }: Props = $props();
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<button onclick={() => { count++; onAction?.(); }}>
  {title}: {count} (x2 = {doubled})
</button>
```

### Store Pattern
```typescript
// Use $state in components when possible
// Use stores for cross-component shared state
import { writable } from 'svelte/store';

function createStore() {
  const { subscribe, set, update } = writable({ data: [], loading: false });
  return {
    subscribe,
    load: async () => { /* fetch and set */ },
    reset: () => set({ data: [], loading: false })
  };
}
```

---

## Component Checklist

- [ ] TypeScript interfaces for all props
- [ ] $state for local reactive state
- [ ] $derived for computed values
- [ ] Loading state handling
- [ ] Error state handling
- [ ] Event handlers typed
- [ ] Tailwind classes for styling
- [ ] Dark mode support (`dark:` prefix)

---

## API Checklist

- [ ] Auth check: `if (!locals.user) throw error(401, ...)`
- [ ] RBAC check if needed
- [ ] Zod validation for all inputs
- [ ] Try-catch for all DB operations
- [ ] Consistent response format: `{ success: boolean, data?: any, error?: string }`
- [ ] Proper HTTP status codes

---

## Error Handling Pattern

```svelte
<script>
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  async function handleSubmit() {
    isLoading = true;
    error = null;
    try {
      const res = await fetch('/api/endpoint', { method: 'POST', body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      // handle success
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isLoading}
  <LoadingSpinner />
{:else if error}
  <Alert type="error" message={error} />
{:else}
  <!-- content -->
{/if}
```

---

## Stop Conditions (ALL must pass)

1. ✅ Feature fully implemented
2. ✅ `npm run check` - 0 errors
3. ✅ `npm test` - all pass
4. ✅ `npm run build` - success
5. ✅ Database schema valid
6. ✅ Manual browser test passed

**If any fail → GO BACK AND FIX → REPEAT LOOP**

---

## Common Commands

```bash
npm run dev              # Dev server
npm run check            # Type check
npm test                 # Run tests
npm run build            # Build
npx prisma validate      # Validate schema
npm run db:generate      # Generate client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
```

---

## Key Reminders

1. **Read schema first** - Never assume DB structure
2. **Type everything** - No `any` types
3. **Handle all errors** - User-friendly messages
4. **Show loading states** - Always
5. **Test after every change** - Don't batch too much
6. **Loop until perfect** - No "good enough"
