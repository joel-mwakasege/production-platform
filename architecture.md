# Architecture

## 1. Architectural Goal

The platform must be designed as one connected production system rather than a collection of independent pages.

The most important architectural principle is:

> Every production tool operates on shared underlying project data.

The source describes the system as:

```text
Authentication
      ↓
Organizations
      ↓
Projects
      ↓
Production Modules
      ↓
Shared Production Data
      ↓
Documents / Reports / PDFs / Communications
```

fileciteturn0file0L61-L77

## 2. High-Level Architecture

```text
┌───────────────────────────────────────────────┐
│                    Frontend                   │
│ React + TypeScript + Vite                     │
│ React Router + TanStack Query + Zustand       │
│ Shared Component System                       │
└──────────────────────┬────────────────────────┘
                       │ HTTPS
                       ▼
┌───────────────────────────────────────────────┐
│                 Application API               │
│ Node.js + TypeScript + Express                │
│ REST API                                      │
│ Authorization / Validation / Domain Logic     │
│ Background Job Coordination                   │
└──────────────┬────────────────┬───────────────┘
               │                │
               │                └──────────────────┐
               ▼                                   ▼
┌─────────────────────────┐             ┌──────────────────────┐
│       PostgreSQL        │             │     Object Storage   │
│ Shared production data  │             │ Media / documents    │
└─────────────────────────┘             └──────────────────────┘

             ┌────────────────────────────┐
             │        Supabase Auth       │
             │ Identity / session / auth  │
             └────────────────────────────┘
```

## 3. Supabase Authentication Boundary

The application uses **Supabase Auth** for authentication.

Supabase Auth is responsible for:

- User identity
- Sign-up
- Login
- Logout
- Password reset
- Email verification
- Authentication sessions

The application remains responsible for:

- Application user profile data
- Organization memberships
- Project memberships
- Roles
- Permissions
- Object-level authorization
- Production-domain data

The architecture should not implement a second password authentication system.

### Request model

```text
Browser
 ↓
Supabase Auth
 ↓
Authenticated Session / Access Token
 ↓
Frontend API Request
 ↓
Application API
 ↓
Validate Supabase-issued identity
 ↓
Resolve application user
 ↓
Authorize organization/project/object
 ↓
Execute domain operation
```

## 4. Frontend

The source recommends:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Component system

fileciteturn0file0L80-L100

### Frontend responsibilities

- Routing
- Authentication/session presentation
- Organization switching
- Project navigation
- Editor state
- UI state
- Server-state caching
- Form handling
- Validation feedback
- Loading/empty/error states
- Responsive production workflows

### State strategy

Use:

- **TanStack Query** for server state.
- **Zustand** for client/UI state where needed.
- Module-local editor state for complex editors.
- Supabase client session state for authenticated identity.

Do not duplicate server data unnecessarily in global client state.

## 5. Backend

The planned backend remains:

- Node.js
- TypeScript
- Express
- REST API
- Authorization
- Background jobs

The authentication component is changed: the backend does not own the password/session lifecycle. It validates the authenticated Supabase identity and applies application authorization.

### Backend layers

```text
HTTP / Routes
     ↓
Request Validation
     ↓
Authentication Context
     ↓
Authorization
     ↓
Application Service
     ↓
Domain Logic
     ↓
Repository / Data Access
     ↓
PostgreSQL / Storage / External Services
```

## 6. API Design

Initial API structure:

```text
/api/organizations
/api/projects
/api/projects/:projectId/screenplays
/api/projects/:projectId/scenes
/api/projects/:projectId/breakdowns
/api/projects/:projectId/schedules
/api/projects/:projectId/contacts
/api/projects/:projectId/locations
/api/projects/:projectId/tasks
/api/projects/:projectId/moodboards
/api/projects/:projectId/shot-lists
/api/projects/:projectId/storyboards
/api/projects/:projectId/media
/api/projects/:projectId/documents
/api/projects/:projectId/call-sheets
/api/projects/:projectId/reports
```

The original `/api/auth` area is replaced by the Supabase Auth integration boundary. Application endpoints may still expose authenticated-user/profile operations if needed, but password authentication should not be duplicated in the API.

## 7. Authorization Model

Authorization must be layered:

```text
Authenticated Identity
        ↓
Application User
        ↓
Organization Membership
        ↓
Project Membership
        ↓
Role / Permission
        ↓
Object-Level Permission
```

Critical security requirement:

> A user must never access another organization's production data by manipulating an ID in an API request.

Authorization must therefore be checked on every protected resource path.

## 8. Organization Isolation

Organization is the tenant boundary.

Conceptually:

```text
Organization A
├── Members
├── Projects
│   ├── Screenplays
│   ├── Scenes
│   ├── Breakdowns
│   └── ...
│
Organization B
├── Members
├── Projects
│   ├── Screenplays
│   ├── Scenes
│   ├── Breakdowns
│   └── ...
```

No project-level resource should be reachable without verifying its owning organization and the requesting user's membership.

## 9. Database

The source identifies PostgreSQL as the database.

The database should model shared production entities and their relationships rather than storing module-specific copies of the same information.

Core relationship:

```text
Project
 ↓
Screenplay
 ↓
Scene
 ↓
Scene Elements
 ↓
Production Elements
 ↓
Schedule
 ↓
Shoot Day
 ↓
Call Sheet
```

Additional connected graph:

```text
Scene
 ↓
Shot
 ↓
Shot List
 ↓
Storyboard
```

And:

```text
Contact
 ↓
Cast/Crew
 ↓
Call Sheet Recipient
 ↓
Production Communication
```

## 10. Storage

Object storage is required for:

- Media
- Images
- Documents
- Attachments
- Storyboard images
- Moodboard images
- Other production files

Database records should store metadata and references to stored objects rather than large binary files in PostgreSQL.

File access must respect authorization and use secure access mechanisms.

## 11. Core Domain Modules

```text
Identity & Access
Organizations
Projects
Writing
Breakdown
Scheduling
Contacts
Locations
Tasks
Calendar
Media
Documents
Visual Planning
Call Sheets
Reports
Sharing
Collaboration
Notifications
Audit
Billing
Administration
```

Each module should expose domain services around shared entities rather than duplicating business rules.

## 12. Cross-Module Data Graph

### Screenwriting → Breakdown

```text
Screenplay
 ↓
Scene
 ↓
Script Elements
 ↓
Breakdown Tags
 ↓
Production Elements
```

### Breakdown → Scheduling

```text
Scene
 ↓
Production Elements
 ↓
Schedule Scene
 ↓
Shoot Day
```

### Scheduling → Call Sheet

```text
Shoot Day
 ↓
Call Sheet
 ↓
Scheduled Scenes
 ↓
Cast / Crew
 ↓
Locations
 ↓
Contacts
```

### Scene → Shot Planning

```text
Scene
 ↓
Shot
 ↓
Shot List
 ↓
Storyboard
```

## 13. PDF Architecture

A centralized PDF renderer should serve all modules:

```text
Document
Schedule
Call Sheet
Storyboard
Shot List
Script Side
Report
     ↓
PDF Renderer
     ↓
PDF / Print
```

No module should implement a completely independent PDF subsystem.

## 14. Background Jobs

Background processing will eventually be needed for:

- PDF generation
- Large media processing
- Email delivery
- SMS delivery
- Notifications
- Report generation
- Search indexing
- Other long-running tasks

Long-running work should not block normal API requests.

## 15. Collaboration Architecture

Initial collaboration should be based on persisted changes plus activity/events.

```text
Mutation
 ↓
Database Transaction
 ↓
Activity Event
 ↓
Notification Event
```

Real-time collaborative editing, live cursors, and conflict resolution are explicitly deferred until the document/data architecture is stable.

## 16. Search Architecture

Global search spans multiple production entities.

The initial implementation can use PostgreSQL search capabilities and indexed fields. A dedicated search service can be introduced later if scale requires it.

Searchable concepts include:

- Projects
- Scripts
- Scenes
- Characters
- Contacts
- Locations
- Tasks
- Documents
- Shots
- Storyboards
- Media
- Call sheets

## 17. Testing Architecture

### Unit tests

Test:

- Screenplay parsing
- Scene calculations
- Page calculations
- Breakdown logic
- Scheduling algorithms
- Report calculations
- Permissions
- Validation

### Integration tests

Test:

```text
API → Database
API → Storage
Supabase Auth → API
Project → Modules
Screenplay → Breakdown
Breakdown → Schedule
Schedule → Call Sheet
```

### End-to-end tests

Primary flow:

```text
Signup
→ Organization
→ Project
→ Screenplay
→ Scene
→ Breakdown
→ Schedule
→ Call Sheet
→ Publish
```

## 18. Performance

The application must support:

- Thousands of screenplay elements
- Hundreds of scenes
- Thousands of contacts
- Thousands of media files
- Large task boards
- Multiple simultaneous users

Use:

- Pagination
- Virtualization
- Caching
- Optimistic updates where safe
- Background processing
- Lazy loading
- Database indexes
- Efficient queries

## 19. Environments and Deployment

```text
Development
    ↓
CI
    ↓
Tests
    ↓
Build
    ↓
Staging
    ↓
Approval
    ↓
Production
```

Environments must be separated.

Supabase environments/projects and application environments should be configured so development, staging, and production authentication/data are not accidentally mixed.

## 20. Observability

Implement:

- Application logs
- API logs
- Error tracking
- Performance monitoring
- Database monitoring
- Storage monitoring
- Background-job monitoring
- Uptime monitoring

## 21. Repository Structure

Recommended:

```text
production-platform/
├── frontend/
├── backend/
├── shared/
├── docs/
├── scripts/
├── .env.example
├── PROJECT.md
├── README.md
└── package.json
```

Documentation should include:

```text
docs/
├── PRODUCT_SPEC.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── AUTH.md
├── PERMISSIONS.md
├── SCREENWRITING.md
├── BREAKDOWN.md
├── SCHEDULING.md
├── CALL_SHEETS.md
├── SHOT_LISTS.md
├── STORYBOARDS.md
├── REPORTS.md
├── DEPLOYMENT.md
├── TESTING.md
└── SECURITY.md
```

## 22. Architecture Rules

Every implementation should:

- Fit the existing architecture.
- Reuse existing components.
- Reuse existing services.
- Avoid duplicate logic.
- Use proper TypeScript types.
- Validate input.
- Handle errors.
- Respect authorization.
- Include loading states.
- Include empty states.
- Include error states.
- Be testable.
- Avoid unnecessary dependencies.
- Avoid hard-coded production data.
- Avoid rewriting the application to solve isolated problems.

## 23. Implementation Principle

For every feature:

```text
1. Requirements
2. Data model
3. API
4. Backend
5. Frontend
6. Connect frontend/backend
7. Test
8. Fix
9. Refactor
10. Mark complete
```

A feature is not complete when its UI exists. It is complete when UI, API, database, validation, permissions, error handling, loading states, tests, and deployment work together.
