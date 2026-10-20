# Inkloom V2 Build Plan

## Phase 0 — Security foundations

### Step 0.1 — Supabase Auth sessions
- 0.1.1 Passwords are managed by Supabase Auth; the app never stores, reads, or compares passwords itself.
- 0.1.2 Sessions are carried in httpOnly cookies set by the server.
- 0.1.3 Server code resolves the current user from the session cookie, verified with Supabase Auth.
- 0.1.4 An expired access token is refreshed with the refresh token and the cookies are updated.

### Step 0.2 — Sign up, sign in, sign out
- 0.2.1 `/api/signup` creates the account with Supabase Auth and creates the matching `user` profile row.
- 0.2.2 `/api/signin` signs in with Supabase Auth using an email or a username (a username is resolved to its email on the server).
- 0.2.3 A new `/api/signout` route ends the session and clears the session cookies.
- 0.2.4 Sign in, sign up, and sign out responses never include a password.

### Step 0.3 — Session-derived identity in every user-scoped route
- 0.3.1 These routes take the user identity from the session only: `get-user`, `update-user`, `upload-avatar`, `change-password`, `export-user-data`, `delete-account`, `save-template`, `get-templates`, `generate-template`.
- 0.3.2 Those routes return 401 when there is no valid session.
- 0.3.3 User IDs sent by the client in the body, query string, or form data are ignored.
- 0.3.4 `save-template` stores the template under the signed-in user's id; `get-templates` and `export-user-data` return only the signed-in user's templates.
- 0.3.5 `DEFAULT_USER_ID` is removed.

### Step 0.4 — Password change and account deletion through Supabase Auth
- 0.4.1 `change-password` verifies the current password with Supabase Auth and sets the new password with Supabase Auth.
- 0.4.2 `delete-account` deletes the user's avatar files, templates, profile row, and Supabase Auth user, then clears the session cookies.

### Step 0.5 — Client uses the session
- 0.5.1 `useAuth` no longer uses `localStorage` as the source of identity; it loads the current user from the server session.
- 0.5.2 `signOut` calls `/api/signout`.
- 0.5.3 Client pages no longer send user IDs to the API.

### Step 0.6 — Row Level Security
- 0.6.1 A SQL migration in `supabase/migrations/` enables Row Level Security on the `user` and `template` tables.
- 0.6.2 The `user` table links to Supabase Auth through an `auth_id uuid` column.
- 0.6.3 Policies let a user read and update only their own `user` row.
- 0.6.4 Policies let a user read, insert, update, and delete only their own `template` rows.
- 0.6.5 Policies let anyone read `template` rows where `public` is true.
- 0.6.6 The migration drops the `password` column from `user`.

### Step 0.7 — Migrate existing accounts
- 0.7.1 A one-off script in `scripts/` creates a Supabase Auth user for each existing `user` row and sets its `auth_id`.
- 0.7.2 The README documents the order: run the script, then apply the migration.

### Step 0.8 — Service-role key scope
- 0.8.1 Reads and writes of the `user` and `template` tables in user-scoped routes go through a client bound to the user's session, so RLS applies.
- 0.8.2 The service-role client is used only for Storage operations, Supabase Auth admin operations, and the pre-session routes `signup`, `signin`, `check-user`, and `check-username`.
- 0.8.3 `get-template` and `get-public-templates` read tables with the session client (or the anon client when signed out), so private templates are visible only to their owner.

### Step 0.9 — Rate limiting
- 0.9.1 `generate-template` limits each user to a number of generations per hour, configurable with `GENERATE_RATE_LIMIT_PER_HOUR` (default 10).
- 0.9.2 Requests over the limit get a 429 response with a `Retry-After` header.

### Step 0.10 — Verification
- 0.10.1 Unit tests cover session resolution (401 without a session) and the rate limiter.
- 0.10.2 `npm run lint`, `npx tsc --noEmit`, and `npm test -- --run` pass.

## Phase 1 — Architecture
1. Generation runs as a job: a `generation` row is created, its id is returned at once, and the client follows its status.
2. Image generation goes through a provider interface (`lib/ai/providers/*`), chosen by an environment variable, with fallback.
3. Resource-style routes (`/api/templates`, `/api/templates/[id]`) or Server Actions replace the verb-named routes.
4. Zod validates every API input.
5. The gallery and template pages load data in Server Components; public templates get dynamic URLs (`/t/[id]`).
6. The unused `openai` and `react-router-dom` dependencies are removed.
7. CI (GitHub Actions) runs lint, tsc, vitest, and build; Playwright covers create → save → view.

## Phase 2 — Generation quality (free tiers)
1. A free text model (Gemini Flash, Groq, or an OpenRouter `:free` model) turns the idea into a structured image prompt.
2. Generation runs at 1024px, with Cloudflare Workers AI FLUX as primary or fallback provider.
3. Each request offers 2–4 variations.
4. Output is cleaned up after generation: converted to pure black and white (threshold) and vectorized with potrace for SVG export.

## Phase 3 — Features
1. Refinement ("simpler", "more detail"), seed lock, and a version history for each template.
2. Image-to-image: an uploaded reference photo becomes line art.
3. Project plans with materials, steps, and a timeline, generated as JSON.
4. SVG and printable PDF export, with an optional grid and tiling.
5. Medium-specific styles: embroidery, watercolor, tattoo stencil.

## Phase 4 — Gallery and community
1. Search and filters by medium and difficulty.
2. Likes, saves, and "remix this".
3. Open Graph share images.
4. A progress journal with photos and notes.

## Phase 5 — UI polish
1. Inline validation and toasts replace `alert()`.
2. Generation shows its stages instead of a single spinner.
3. A masonry gallery with `next/image`, lazy loading, and infinite scroll; the hardcoded examples are removed.
4. The template viewer gets zoom, pan, and version comparison.
5. Accessibility: focus trapping in the auth modal, keyboard navigation, and `prefers-reduced-motion`.
6. Fonts load through `next/font`.
