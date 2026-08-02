# F5 Automation Control Center - Agent Guide

## Project Overview

The **F5 Automation Control Center** (also known as "Circuit Breaker Portal") is a comprehensive web application built with SvelteKit for managing F5 BIG-IP infrastructure. It provides a unified interface for:

- **Circuit Breaker Management**: Multi-lane traffic management with circuit breakers at Edge (GSLB) and Enterprise levels
- **Secure Web Gateway (SWG)**: HTTP/HTTPS forward proxy with SSL interception, URL filtering, and authentication
- **Application Deployment**: Self-service deployments via F5 AS3 declarative API
- **Security Automation**: Integration with F5 AWAF, SSLO, and APM

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Circuit Breaker Portal                    │
│                      (SvelteKit + Node.js)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Lane 1     │  │   Lane 2     │  │   Lane 3     │       │
│  │  (Active)    │  │  (Standby)   │  │  (Standby)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    F5 Integration Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  iControl   │ │    AS3      │ │    APM      │            │
│  │   REST      │ │Declarative  │ │   Access    │            │
│  │   API       │ │   API       │ │   Policy    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                    SWG Components                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   SSLO      │ │    SWG      │ │   URL       │            │
│  │  (Layer 2)  │ │  (Layer 3)  │ │  Filtering  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend Framework | SvelteKit | 2.x |
| UI Framework | Svelte | 5.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Database | SQLite (via Prisma) | Prisma 5.x |
| Testing | Vitest with jsdom | 4.x |
| Validation | Zod | 4.x |
| Charts | Chart.js with date-fns adapter | 4.x |
| Icons | lucide-svelte | 0.470.x |
| Authentication | bcryptjs + custom JWT | - |

## Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── *.svelte        # Main UI components
│   │   └── swg/            # SWG-specific components
│   ├── server/             # Server-side code
│   │   ├── f5/             # F5 integration services
│   │   │   ├── icontrol-client.ts    # iControl REST API client
│   │   │   ├── as3-service.ts        # AS3 deployment service
│   │   │   ├── swg-service.ts        # SWG configuration service
│   │   │   ├── sslo-service.ts       # SSL Orchestrator service
│   │   │   ├── apm-service.ts        # Access Policy Manager service
│   │   │   ├── awaf-service.ts       # Advanced WAF service
│   │   │   ├── connection-pool.ts    # Connection pooling
│   │   │   ├── job-queue.ts          # Async job management
│   │   │   ├── transaction.ts        # Transaction management
│   │   │   ├── config.ts             # F5 configuration
│   │   │   └── __tests__/            # Unit tests
│   │   ├── auth/           # Authentication & Authorization
│   │   │   ├── session.ts  # Session management with JWT
│   │   │   ├── rbac.ts     # Role-based access control
│   │   │   └── audit.ts    # Audit logging
│   │   ├── autoscaling/    # Auto-scaling services
│   │   ├── backup/         # Backup services
│   │   ├── certificates/   # Certificate management
│   │   ├── cloud/          # Multi-cloud services
│   │   ├── drift/          # Drift detection
│   │   ├── db.ts           # Prisma client instance
│   │   ├── logger.ts       # Structured logging utility
│   │   └── validation.ts   # Zod validation schemas
│   ├── stores/             # Svelte stores for state management
│   │   ├── circuitBreakerStore.ts
│   │   ├── swgStore.ts
│   │   ├── deploymentStore.ts
│   │   ├── notificationStore.ts
│   │   └── ...
│   ├── types.ts            # TypeScript type definitions
│   └── utils/              # Utility functions
├── routes/
│   ├── (app)/              # Application pages (authenticated)
│   │   ├── +page.svelte    # Dashboard
│   │   ├── control/        # Circuit breaker control
│   │   ├── swg/            # SWG configuration
│   │   ├── deployment-portal/  # Application deployment
│   │   ├── settings/       # System settings
│   │   └── ...
│   ├── (auth)/             # Authentication pages
│   │   └── login/
│   ├── api/                # API endpoints
│   │   ├── auth/           # Authentication APIs
│   │   ├── lanes/          # Lane management APIs
│   │   ├── swg/            # SWG APIs
│   │   └── ...
│   ├── +layout.svelte      # Root layout
│   └── +layout.server.ts   # Server-side layout (auth check)
├── hooks.server.ts         # Server hooks (auth, security headers)
├── app.html                # HTML template
├── app.css                 # Global styles with Tailwind
└── test-setup.ts           # Test configuration

prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Database seed script
```

## Build and Development Commands

```bash
# Development
npm run dev                 # Start development server (Vite) at http://localhost:5173

# Building
npm run build               # Build for production
npm run preview             # Preview production build

# Type checking
npm run check               # Type-check the project
npm run check:watch         # Type-check in watch mode

# Testing
npm test                    # Run tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report

# Database
npm run db:migrate          # Run database migrations
npm run db:seed             # Seed database with initial data
npm run db:generate         # Generate Prisma client
npm run db:studio           # Open Prisma Studio
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# F5 BIG-IP Connection
F5_HOST=https://bigip-mgmt.bank.com
F5_USERNAME=admin
F5_PASSWORD=your-secure-password
F5_VERIFY_SSL=true

# SWG Configuration
SWG_ENABLED=true
SWG_EXPLICIT_PROXY_IP=10.1.10.51
SWG_EXPLICIT_PROXY_PORT=8080

# APM Configuration
APM_ENABLED=true
APM_ACCESS_PROFILE=swg-access-profile

# AS3 Configuration
AS3_ENABLED=true
AS3_TENANT=SWG

# Session Secret (required)
SESSION_SECRET=your-super-secret-session-key-change-in-production
```

### Tailwind CSS Custom Colors

The project uses custom color palette defined in `tailwind.config.js`:

- `primary` - Blue palette (50-900)
- `success` - Green palette (50-900)
- `warning` - Yellow/Orange palette (50-900)
- `danger` - Red palette (50-900)

## Code Style Guidelines

### TypeScript

- Strict mode is enabled in `tsconfig.json`
- Prefer `interface` over `type` for object definitions
- Use enums for fixed sets of values (see `rbac.ts` for examples)
- Always specify return types for public functions
- Path aliases use `$lib` for imports from `src/lib/`

### Svelte Components

- Use TypeScript with `<script lang="ts">`
- Components use Tailwind CSS classes
- Dark mode support via `dark:` prefix classes
- Custom CSS classes defined in `app.css`:
  - `.btn-primary`, `.btn-secondary`, `.btn-danger`
  - `.card`
  - `.status-indicator` with variants (`.status-healthy`, `.status-degraded`, `.status-down`, etc.)

### Server-Side Code

- F5 API clients are singletons (see `getF5Client()` pattern)
- Use Prisma for all database operations
- Validate inputs with Zod schemas before processing
- Use structured logging via `logger.ts`

## Testing Instructions

### Test Setup

Tests are configured in `vite.config.ts`:
- Framework: Vitest
- Environment: jsdom
- Setup file: `src/test-setup.ts`
- Global mocks: `fetch`, environment variables

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Specific test file
npx vitest run src/lib/server/f5/__tests__/icontrol-client.test.ts
```

### Test Patterns

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { F5iControlClient } from '../icontrol-client';

describe('F5iControlClient', () => {
  let client: F5iControlClient;

  beforeEach(() => {
    client = new F5iControlClient('https://test-bigip.example.com', 'user', 'pass');
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' })
    } as Response);

    const result = await client.get('endpoint');
    expect(result).toEqual({ data: 'test' });
  });
});
```

### Coverage Exclusions

Coverage config excludes:
- `node_modules/`
- `src/test-setup.ts`
- `src/**/*.d.ts`
- `src/routes/**` (page components)
- `src/lib/components/**` (UI components)

## Security Considerations

### Authentication

- Session-based authentication with JWT tokens (custom implementation)
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Max 5 concurrent sessions per user
- Passwords hashed with bcrypt (10 rounds)

### Authorization (RBAC)

7 roles defined in `src/lib/server/auth/rbac.ts`:

| Role | Description |
|------|-------------|
| `super_admin` | Full system access including user management |
| `admin` | Full access except user/role management |
| `operator` | Manage circuit breakers, view everything |
| `viewer` | Read-only access |
| `swg_admin` | Full SWG configuration access |
| `deployment_admin` | Full deployment operations |
| `security_admin` | Security-related configurations |

### Security Headers

Applied in `hooks.server.ts`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy` (restrictive defaults)

### Input Validation

All API inputs validated with Zod schemas in `src/lib/server/validation.ts`:
- IP addresses use regex validation
- Enum values restricted to allowed values
- String lengths and number ranges enforced

## Database Schema

Key Prisma models in `prisma/schema.prisma`:

- `Application` - Deployed applications
- `Lane` - Traffic lanes with circuit breaker config
- `Deployment` - Application deployments
- `User` - User accounts with roles
- `Session` - Active sessions
- `AuditLog` - Security audit logs
- `SWGConfig` - SWG configuration
- `SWGPolicy` - Security policies with rules
- `SWGPolicyRule` - Individual policy rules
- `SWGSession` - Active SWG user sessions
- `SWGAccessLog` - SWG access logs
- `SWGBlockedUrl` - Blocked URL entries
- `SWGCategory` - URL categories

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker logs f5-control-center-f5-control-center-1
```

The Docker setup:
- Uses Node.js 22 Alpine
- Exposes port 3000
- Persists SQLite database in `./data` volume
- Runs migrations and seed on startup

### Manual Deployment

```bash
# Build
npm run build

# Production start
node build
```

### Deployment Scripts

- `deploy.sh` - Docker deployment to remote server
- `deploy-node.sh` - Node.js/PM2 deployment
- `setup.sh` - Environment setup helper

## Default Users (Development)

After running `npm run db:seed`:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | super_admin |
| operator | operator123 | operator |
| viewer | viewer123 | viewer |
| swgadmin | swgadmin123 | swg_admin |
| deployadmin | deployadmin123 | deployment_admin |

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/hooks.server.ts` | Authentication, authorization, security headers |
| `src/lib/server/f5/icontrol-client.ts` | F5 iControl REST API client |
| `src/lib/server/f5/config.ts` | F5 configuration from environment |
| `src/lib/server/auth/rbac.ts` | Role-based access control |
| `src/lib/server/auth/session.ts` | Session management |
| `src/lib/types.ts` | TypeScript interfaces |
| `src/lib/server/validation.ts` | Zod validation schemas |
| `prisma/schema.prisma` | Database schema |
| `src/app.css` | Global styles with Tailwind directives |
| `tailwind.config.js` | Tailwind CSS configuration |

## External Dependencies

The application integrates with:

- **F5 BIG-IP** - iControl REST API, AS3 Extension
- **F5 SSLO** - SSL Orchestrator API
- **F5 APM** - Access Policy Manager
- **F5 AWAF** - Advanced Web Application Firewall
- **LDAP/AD** - Authentication (optional)
- **SIEM** - Splunk, QRadar, ArcSight (optional)
- **ICAP** - DLP/Anti-malware servers (optional)
- **Threat Intel** - External threat feeds (optional)

## API Endpoints

### Circuit Breaker APIs
- `GET /api/config` - Get configuration
- `PUT /api/lanes/:id` - Update lane status
- `POST /api/deployments` - Deploy application

### SWG APIs
- `GET/POST /api/swg/config` - SWG configuration
- `GET/POST /api/swg/url-filtering` - URL filtering
- `GET/POST /api/swg/policies` - Security policies
- `GET /api/swg/sessions` - Active sessions
- `GET /api/swg/logs` - Access logs

### F5 Integration APIs
- `GET /api/f5` - F5 connectivity status
- `POST /api/f5/deploy` - Deploy to F5

## WebSocket Support

Real-time updates via WebSocket at `/api/ws`:
- Session monitoring
- Deployment progress
- Log streaming

---

## ⚠️ MANDATORY: Release Notes Update Procedure

**BEFORE EVERY COMMIT / CHECK-IN TO GITHUB, YOU MUST:**

### 1. Update Release Notes in `src/routes/(app)/about/+page.svelte`

Locate the `releaseNotes` array and add your changes to the **current version** (or create a new version if appropriate).

#### Format:

```typescript
{
  version: '0.x.x',  // Current version or new version
  date: 'YYYY-MM-DD', // Today's date
  highlights: [
    'Brief summary of major features/changes',
    'Another major highlight'
  ],
  changes: [
    { 
      type: 'feature', 
      text: 'Description of what was added/changed',
      commit: 'abc1234' // First 7 chars of git commit hash (if known)
    },
    { 
      type: 'fix', 
      text: 'Description of bug fix',
      commit: 'def5678'
    },
    { 
      type: 'security', 
      text: 'Security improvement description',
      commit: 'ghi9012'
    }
  ]
}
```

#### Change Types:
- `feature` - New functionality
- `fix` - Bug fixes
- `security` - Security improvements
- `performance` - Performance optimizations
- `docs` - Documentation updates
- `refactor` - Code refactoring

### 2. Update Version Number (if applicable)

If this is a significant release, update the version in:
- `package.json` - `"version": "0.x.x"`
- `src/routes/(app)/about/+page.svelte` - Add new version entry

### 3. Quick Checklist Before Commit

```
□ Run npm run check (0 TypeScript errors)
□ Run npm run build (successful build)
□ Update release notes in about/+page.svelte
□ Added commit hashes to changes (if known)
□ Verified highlights accurately summarize changes
□ Tested in browser (npm run dev)
```

### 4. Example Release Note Entry

```typescript
{
  version: '0.5.0',
  date: '2026-02-27',
  highlights: [
    'Added F5 Calypso AI Gateway integration',
    'New Automation Orchestrator dashboard',
    'Enterprise-grade scheduled automation engine'
  ],
  changes: [
    { 
      type: 'feature', 
      text: 'F5 Calypso AI Gateway: Secure AI/LLM traffic management with prompt injection protection',
      commit: 'a1b2c3d'
    },
    { 
      type: 'feature', 
      text: 'Automation Orchestrator: Centralized dashboard for scheduled tasks, templates, events, and batch operations',
      commit: 'e4f5g6h'
    },
    { 
      type: 'feature', 
      text: 'Scheduled Automation Engine: Cron-like scheduler for backups, compliance checks, and certificate renewals',
      commit: 'i7j8k9l'
    },
    { 
      type: 'feature', 
      text: 'Configuration Template Library: Reusable AS3/DO templates with approval workflows',
      commit: 'm0n1o2p'
    },
    { 
      type: 'fix', 
      text: 'Removed all cost optimization related content per client requirements',
      commit: 'q3r4s5t'
    }
  ]
}
```

### 5. Where to Find the Release Notes Section

In `src/routes/(app)/about/+page.svelte`, look for:

```typescript
// Comprehensive release notes based on git commits with detailed changelog entries
const releaseNotes = [
  // ADD NEW VERSION ENTRY HERE (at the beginning of the array)
  {
    version: '0.x.x',
    date: 'YYYY-MM-DD',
    ...
  },
  // Existing entries follow...
];
```

**Remember: The newest version should always be at the TOP of the array.**

---

## Versioning Convention

This project follows **Semantic Versioning** for pre-1.0 releases:

- **0.MAJOR.MINOR** format
- MAJOR version increments for significant feature releases
- MINOR version increments for bug fixes and small enhancements
- Examples: 0.4.0 → 0.5.0 (major), 0.4.0 → 0.4.1 (minor)

## Notes for AI Agents

When working on this codebase:

1. **Always update AGENTS.md** if you discover new patterns or important information
2. **Follow existing code style** - match the patterns in existing files
3. **TypeScript strict mode** - fix all type errors before committing
4. **Test your changes** - run the build and check for errors
5. **Update release notes** - see the mandatory procedure above
6. **Keep changes minimal** - only modify what's necessary
7. **Document business value** - explain why features matter to enterprise clients
