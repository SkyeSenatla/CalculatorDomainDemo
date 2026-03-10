# Sentinel Calculator — Trainee Codebase Guide

This document walks you through the entire Sentinel Calculator application: a full-stack system with a **.NET 8 backend**, a **React (Vite) frontend**, and a **Next.js frontend** that demonstrates a real-world migration path.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Backend (.NET 8 API)](#2-backend-net-8-api)
3. [React Frontend (CLIENT/)](#3-react-frontend-client)
4. [Next.js Frontend (calculator-next/)](#4-nextjs-frontend-calculator-next)
5. [How the Pieces Connect](#5-how-the-pieces-connect)
6. [Key Patterns to Understand](#6-key-patterns-to-understand)
7. [Running the Application](#7-running-the-application)
8. [File Reference](#8-file-reference)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                                                         │
│   React (Vite) — CLIENT/        OR    Next.js App       │
│   ┌──────────────────────┐      ┌──────────────────┐   │
│   │  AuthContext          │      │  AuthContext      │   │
│   │  useCalculations      │      │  useCalculations  │   │
│   │  useSignalR           │      │  useSignalR       │   │
│   │  Axios + Interceptors │      │  Axios + Intrcptrs│   │
│   └──────────┬───────────┘      └────────┬─────────┘   │
│              │ HTTP + WebSocket           │              │
└──────────────┼───────────────────────────┼──────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│              .NET 8 Web API (localhost:5152)             │
│                                                         │
│   Controllers ──► Services ──► Repository ──► PostgreSQL│
│       │                                                 │
│       ├── AuthController      (POST /api/auth/login)    │
│       ├── CalculationsController (CRUD /api/calculations)│
│       └── SignalR Hub         (/hubs/calculations)      │
└─────────────────────────────────────────────────────────┘
```

Both frontends talk to the **same backend**. The React app runs on `localhost:5173`, the Next.js app on `localhost:3000`.

---

## 2. Backend (.NET 8 API)

### Project Structure

The solution has **two projects** following clean architecture:

| Project | Role | Contains |
|---------|------|----------|
| **CalculatorDomainDemo** | Domain/Library | Entities, business logic, repository interfaces |
| **API** | Web Layer | Controllers, DTOs, auth, SignalR hub, middleware, EF repository |

The API project references the domain project — never the other way around.

### Domain Models

**Calculation** is the core entity:

```
Calculation
├── Id            (int, primary key)
├── Left          (double — first operand)
├── Right         (double — second operand)
├── Operation     (OperationType enum: Add=0, Subtract=1, Multiply=2, Divide=3)
├── Result        (double — computed by the server)
├── CreatedAt     (DateTime)
├── UserId        (string — foreign key to the user who created it)
├── IsActive      (bool — soft delete flag, defaults to true)
└── DeletedAt     (DateTime? — when it was soft-deleted)
```

**ApplicationUser** extends ASP.NET Core Identity's `IdentityUser`. Each calculation belongs to a user.

### Authentication Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { username, password }       │
  │ ─────────────────────────────►│
  │                               │  1. Find user by username (UserManager)
  │                               │  2. Verify password
  │                               │  3. Look up user roles
  │                               │  4. Generate JWT with claims:
  │                               │     - NameIdentifier (user ID)
  │                               │     - Name (username)
  │                               │     - Role (Admin/Manager/User)
  │  { token: "eyJhbG..." }      │
  │ ◄─────────────────────────────│
  │                               │
  │  GET /api/calculations        │
  │  Authorization: Bearer eyJ... │
  │ ─────────────────────────────►│  5. JWT middleware validates token
  │                               │  6. Extracts claims into HttpContext.User
  │  { data: [...] }              │
  │ ◄─────────────────────────────│
```

**JWT Configuration** (in `appsettings.json` and `Program.cs`):
- Algorithm: HMAC-SHA256
- Expiry: 1 hour
- Claims include user ID, username, and roles

**Seeded Test Accounts** (created on startup by `IdentitySeeder`):

| Username | Password | Role |
|----------|----------|------|
| Skye | Skye123! | Admin |
| Manager1 | Manager123! | Manager |
| User1 | User123! | User |

### API Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/login` | None | Get JWT token |
| GET | `/api/calculations` | JWT | List active calculations (paginated) |
| POST | `/api/calculations` | JWT | Create a calculation |
| PUT | `/api/calculations/{id}` | JWT + Owner | Update a calculation |
| PATCH | `/api/calculations/{id}/deactivate` | JWT + Owner | Soft-delete a calculation |
| GET | `/api/history` | Admin only | View all calculation history |

### The Calculation Flow

When a user submits a calculation, this is the path through the backend:

```
CalculationsController.Calculate()
    │
    │  Extracts userId from JWT claims
    │  Creates CalculationRequest { Left, Right, Operand }
    │
    ▼
CalculatorService.CalculateAsync(request, userId)
    │
    │  Validates (e.g., division by zero → InvalidCalculationException)
    │  Performs the math (switch on OperationType)
    │  Creates a Calculation entity with result + timestamp
    │
    ▼
EFCalculationStore.SaveAsync(calculation)
    │
    │  Adds to DbContext.Calculations
    │  Calls SaveChangesAsync() → INSERT into PostgreSQL
    │
    ▼
Back in Controller:
    │  Broadcasts "CalculationCreated" via SignalR hub
    │  Returns CalculationResultDto to the caller
```

### SignalR (Real-Time Updates)

The server broadcasts two events to **all connected clients**:

| Event | When | Payload |
|-------|------|---------|
| `CalculationCreated` | After POST /calculations | `{ id, left, right, operation, result }` |
| `CalculationDeactivated` | After PATCH /deactivate | `{ id }` |

This means if User A creates a calculation, User B's browser updates automatically — no polling needed.

### Validation & Error Handling

**DTO Validation** uses `[Required]`, `[Range]`, and `[EnumDataType]` attributes. When validation fails, ASP.NET returns **ProblemDetails (RFC 7807)**:

```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "left": ["The first number (left) is required."],
    "operand": ["Invalid operation. Must be 0-3."]
  }
}
```

**ExceptionHandlingMiddleware** catches unhandled exceptions:
- `InvalidCalculationException` → 422 Unprocessable Entity
- Everything else → 500 Internal Server Error

---

## 3. React Frontend (CLIENT/)

### Folder Structure

```
CLIENT/src/
├── main.jsx              ← Entry point, mounts <App /> to the DOM
├── App.jsx               ← Router setup + AuthProvider wrapper
├── index.css             ← Global styles
│
├── api/
│   └── apiClient.js      ← Axios singleton with JWT interceptors
│
├── services/
│   ├── api.js            ← API functions (login, CRUD calculations)
│   └── storageService.js ← localStorage wrapper (fallback persistence)
│
├── context/
│   └── AuthContext.jsx    ← Global auth state (token, user, login/logout)
│
├── hooks/
│   ├── useCalculations.js ← Business logic hook (fetch, add, remove, SignalR)
│   └── useSignalR.js      ← WebSocket connection lifecycle
│
├── components/
│   ├── Button.jsx          ← Presentational button
│   ├── Header.jsx          ← Standalone header
│   ├── Layout.jsx          ← Page wrapper with auth-aware nav
│   ├── ProtectedRoute.jsx  ← Route guard (redirects if no token)
│   ├── CalculationCard.jsx ← Single calculation display
│   ├── CalculationList.jsx ← List of CalculationCards
│   └── Calculation Form/
│       ├── CalculationForm.jsx ← Input form with validation
│       └── CalculationForm.css
│
├── pages/
│   ├── LoginPage.jsx       ← JWT login against the API
│   └── MyCalculations.jsx  ← Protected dashboard
│
└── utils/
    └── parseValidationErrors.js ← .NET ProblemDetails → per-field errors
```

### How Routing Works (React Router)

In `App.jsx`, routes are defined with React Router:

```
BrowserRouter
  └── AuthProvider
       └── Layout (persistent nav + footer)
            └── Routes
                 ├── /login          → LoginPage (public)
                 ├── /my-calculations → ProtectedRoute → MyCalculations
                 └── *               → Redirect based on auth status
```

- `Layout` wraps all routes so the nav bar and footer are always visible
- `ProtectedRoute` checks for a token — no token means redirect to `/login`
- The root path (`/`) auto-redirects: authenticated users go to `/my-calculations`, others to `/login`

### The Axios Interceptor Pattern

`apiClient.js` creates a single Axios instance used by every API call. Two interceptors handle cross-cutting concerns:

**Request Interceptor** — runs before every outgoing request:
1. Reads the JWT from `localStorage`
2. Attaches it as `Authorization: Bearer <token>`
3. Every API call gets auth credentials without the caller worrying about it

**Response Interceptor** — runs after every response:
1. On success: unwraps `response.data` so callers get the data directly
2. On 401 Unauthorized: clears the token and redirects to `/login` (auto-logout)

This means individual API functions like `createCalculation()` never need to handle auth headers or expired tokens — it's all centralized.

### State Management Strategy

| Concern | Solution | Why |
|---------|----------|-----|
| Auth state | React Context (`AuthContext`) | Needs to be accessible from any component |
| Calculation data | Custom hook (`useCalculations`) | Encapsulates fetch/add/remove logic |
| Real-time updates | Custom hook (`useSignalR`) | Manages WebSocket lifecycle |
| Form state | Local `useState` in `CalculationForm` | Only needed within the form |

There is no Redux or Zustand — Context + custom hooks handle everything.

---

## 4. Next.js Frontend (calculator-next/)

### Folder Structure

```
calculator-next/src/
├── app/
│   ├── layout.tsx          ← Root layout (persistent nav + footer)
│   ├── page.tsx            ← Home page (/)
│   ├── globals.css         ← Tailwind + theme variables
│   ├── login/
│   │   └── page.tsx        ← Login page (/login)
│   └── my-calculations/
│       └── page.tsx        ← Protected dashboard (/my-calculations)
│
├── api/
│   └── apiClient.ts        ← Axios singleton with JWT interceptors
│
├── services/
│   └── api.ts              ← API functions (login, CRUD calculations)
│
├── context/
│   └── AuthContext.tsx      ← Global auth state
│
├── hooks/
│   ├── useCalculations.ts  ← Business logic hook
│   └── useSignalR.ts       ← WebSocket connection hook
│
├── components/
│   ├── NavBar.tsx           ← Auth-aware navigation (client component)
│   ├── Button.tsx           ← Presentational button
│   ├── ProtectedRoute.tsx   ← Route guard
│   ├── CalculationForm.tsx  ← Input form with validation
│   ├── CalculationCard.tsx  ← Single calculation display
│   └── CalculationList.tsx  ← List of CalculationCards
│
└── utils/
    └── parseValidationErrors.ts ← .NET ProblemDetails → per-field errors
```

### How Routing Works (Next.js App Router)

Next.js uses **file-based routing** — no route config needed:

```
src/app/
├── page.tsx                → maps to /
├── login/page.tsx          → maps to /login
└── my-calculations/page.tsx → maps to /my-calculations
```

Create a folder, put a `page.tsx` inside it, and the route exists automatically.

`layout.tsx` is a **special file** — Next.js wraps every page inside it. The layout (nav, footer) stays mounted across page navigations. Only the `{children}` part swaps out.

### Server vs Client Components

Next.js components are **Server Components by default** — they render on the server and send plain HTML. No JavaScript is shipped for them.

When a component needs interactivity (`useState`, `useEffect`, `onClick`, `localStorage`), you must add `"use client"` at the top of the file. These are **Client Components** — they hydrate in the browser with JavaScript.

| File | Type | Why |
|------|------|-----|
| `layout.tsx` | Server | Just renders HTML shell |
| `NavBar.tsx` | Client | Uses `useAuth()`, `useRouter()`, `onClick` |
| `AuthContext.tsx` | Client | Uses `useState`, `localStorage` |
| `CalculationForm.tsx` | Client | Uses `useState`, form events |
| `ProtectedRoute.tsx` | Client | Uses `useEffect`, `useRouter` |
| `page.tsx` (home) | Client | Uses `useAuth()` for conditional rendering |
| `my-calculations/page.tsx` | Client | Uses hooks for data fetching |

### Key Differences from the React Version

| Aspect | React (Vite) | Next.js |
|--------|-------------|---------|
| Routing | `react-router-dom` with `<Routes>` | File-based (folders = routes) |
| Navigation | `useNavigate()` + `<Link to="...">` | `useRouter()` + `<Link href="...">` |
| Layout | Manual `<Layout>` wrapper | Automatic `layout.tsx` |
| Env vars | `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| Styling | Custom CSS | Tailwind CSS |
| Language | JavaScript | TypeScript |
| Rendering | All client-side | Server + Client components |
| Auth init | Lazy `useState(() => localStorage.getItem(...))` | `useEffect` hydration (avoids SSR mismatch) |

---

## 5. How the Pieces Connect

### Full Request Lifecycle: Creating a Calculation

```
1. User fills in the form and clicks "Calculate"
        │
        ▼
2. CalculationForm calls onAdd(left, right, operation)
        │
        ▼
3. useCalculations.addCalculation() calls createCalculation() from api.ts
        │
        ▼
4. api.ts maps operation string → enum int, calls apiClient.post("/calculations")
        │
        ▼
5. Axios request interceptor attaches JWT Bearer token
        │
        ▼
6. Server: CalculationsController receives request
   → CalculatorService performs math
   → EFCalculationStore saves to PostgreSQL
   → Controller broadcasts "CalculationCreated" via SignalR
   → Returns result to client
        │
        ▼
7. SignalR event arrives at ALL connected clients
        │
        ▼
8. useSignalR triggers onCalculationCreated callback
        │
        ▼
9. useCalculations refetches the full list from the API
        │
        ▼
10. React re-renders — the new calculation appears in the list
```

### Full Request Lifecycle: Logging In

```
1. User enters username + password, clicks "Sign In"
        │
        ▼
2. LoginPage calls loginUser(username, password) from api.ts
        │
        ▼
3. Server validates credentials, returns { token: "eyJhbG..." }
        │
        ▼
4. LoginPage calls auth.login(token, username)
   → Stores token + user in localStorage
   → Updates React state
        │
        ▼
5. Router navigates to /my-calculations
        │
        ▼
6. ProtectedRoute checks token — it exists, so it renders the page
        │
        ▼
7. useCalculations fires, fetching calculations with the JWT attached
```

### Cross-Tab Sync

If a user opens the app in two tabs:
- **Tab A** logs out → removes token from `localStorage`
- The browser fires a `storage` event
- **Tab B** catches the event in `AuthContext` → sets token to `null`
- `ProtectedRoute` in Tab B detects no token → redirects to `/login`

Both tabs stay in sync without any manual coordination.

---

## 6. Key Patterns to Understand

### Pessimistic vs Optimistic Updates

This app uses **pessimistic updates** (the safe pattern):

```
1. Send request to server
2. Wait for server to confirm success
3. SignalR broadcast triggers a refetch
4. UI updates with confirmed data
```

The alternative is **optimistic updates** (commented out in the React `useCalculations.js`):

```
1. Update UI immediately with predicted result
2. Send request to server in background
3. If server fails → ROLLBACK the UI to previous state
```

Pessimistic is safer. Optimistic feels faster. The codebase includes both for comparison.

### Interceptor Pattern (Cross-Cutting Concerns)

Instead of adding auth headers and error handling to every API call:

```
// Without interceptors — repetitive and error-prone
const res = await axios.get("/calculations", {
  headers: { Authorization: `Bearer ${token}` }
});
if (res.status === 401) { logout(); redirect("/login"); }
```

The interceptor centralizes it:

```
// With interceptors — every request gets auth automatically
const res = await apiClient.get("/calculations"); // just works
```

### Soft Deletes

Calculations are never truly deleted. Instead:
- `IsActive` is set to `false`
- `DeletedAt` is set to the current timestamp
- GET endpoints filter to only return `IsActive = true` records

This preserves data for auditing while hiding it from the UI.

### Custom Hook Pattern

Business logic is extracted into hooks rather than living in components:

```
// Component stays clean — just renders
function MyCalculationsPage() {
  const { calculations, addCalculation, removeCalculation } = useCalculations();
  return <CalculationForm onAdd={addCalculation} />;
}

// Hook owns the logic — fetching, state, SignalR, error handling
function useCalculations() {
  // 80 lines of business logic here
  return { calculations, addCalculation, removeCalculation, ... };
}
```

This separation means the hook can be tested independently, and the component stays focused on rendering.

### DTO Validation → Frontend Error Display

The server validates with attributes like `[Required]` and `[Range]`. When validation fails, the response follows the ProblemDetails standard:

```json
{
  "errors": {
    "left": ["The field Left must be between -1000000 and 1000000."],
    "operand": ["Invalid operation."]
  }
}
```

`parseValidationErrors()` transforms this into a flat object:

```js
{ left: "The field Left must be between -1000000 and 1000000.", operand: "Invalid operation." }
```

The form then renders per-field error messages next to each input.

---

## 7. Running the Application

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- PostgreSQL running locally (database: `CalculatorDb`)

### Start the Backend
```bash
cd API
dotnet run
# Runs on http://localhost:5152
```

### Start the React Frontend
```bash
cd CLIENT
npm install
npm run dev
# Runs on http://localhost:5173
```

### Start the Next.js Frontend
```bash
cd calculator-next
npm install
npm run dev
# Runs on http://localhost:3000
```

### Test Accounts

| Username | Password | Role |
|----------|----------|------|
| Skye | Skye123! | Admin |
| Manager1 | Manager123! | Manager |
| User1 | User123! | User |

---

## 8. File Reference

### Backend

| File | Purpose |
|------|---------|
| `API/Program.cs` | App startup, service registration, middleware pipeline |
| `API/Controllers/AuthController.cs` | Login endpoint, JWT issuance |
| `API/Controllers/CalculationsController.cs` | CRUD + SignalR broadcasts |
| `API/Controllers/HistoryController.cs` | Admin-only history queries |
| `API/Auth/TokenService.cs` | JWT token generation with claims |
| `API/Auth/IdentitySeeder.cs` | Seeds roles and test users on startup |
| `API/Hubs/CalculationHub.cs` | SignalR hub (connection logging) |
| `API/Middleware/ExceptionHandlingMiddleware.cs` | Global error handler |
| `API/DTOs/*.cs` | Request/response shapes for the API |
| `API/Data/CalculatorDbContext.cs` | Entity Framework database context |
| `API/Persistence/EFCalculationStore.cs` | Repository implementation (PostgreSQL) |
| `CalculatorDomainDemo/Domain/Calculation.cs` | Core entity |
| `CalculatorDomainDemo/Domain/OperationType.cs` | Enum (Add, Subtract, Multiply, Divide) |
| `CalculatorDomainDemo/Logic/CalculationService.cs` | Business logic (math + validation) |
| `CalculatorDomainDemo/Persistence/ICalculationStore.cs` | Repository interface |

### React Frontend (CLIENT/)

| File | Purpose |
|------|---------|
| `src/App.jsx` | Router setup, AuthProvider, route definitions |
| `src/api/apiClient.js` | Axios with JWT interceptors |
| `src/services/api.js` | API functions (login, CRUD) |
| `src/context/AuthContext.jsx` | Global auth state + cross-tab sync |
| `src/hooks/useCalculations.js` | Calculation state + SignalR integration |
| `src/hooks/useSignalR.js` | WebSocket connection lifecycle |
| `src/components/Layout.jsx` | Page wrapper with auth-aware nav |
| `src/components/ProtectedRoute.jsx` | Route guard |
| `src/components/Calculation Form/CalculationForm.jsx` | Input form with validation |
| `src/pages/LoginPage.jsx` | JWT login page |
| `src/pages/MyCalculations.jsx` | Protected dashboard |
| `src/utils/parseValidationErrors.js` | ProblemDetails parser |

### Next.js Frontend (calculator-next/)

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout (NavBar + footer) |
| `src/app/page.tsx` | Home page with auth-aware CTA |
| `src/app/login/page.tsx` | JWT login page |
| `src/app/my-calculations/page.tsx` | Protected dashboard |
| `src/api/apiClient.ts` | Axios with JWT interceptors |
| `src/services/api.ts` | API functions (login, CRUD) |
| `src/context/AuthContext.tsx` | Global auth state + cross-tab sync |
| `src/hooks/useCalculations.ts` | Calculation state + SignalR integration |
| `src/hooks/useSignalR.ts` | WebSocket connection lifecycle |
| `src/components/NavBar.tsx` | Auth-aware navigation |
| `src/components/ProtectedRoute.tsx` | Route guard |
| `src/components/CalculationForm.tsx` | Input form with validation |
| `src/components/CalculationList.tsx` | Renders calculation cards |
| `src/components/CalculationCard.tsx` | Single calculation display |
| `src/utils/parseValidationErrors.ts` | ProblemDetails parser |
