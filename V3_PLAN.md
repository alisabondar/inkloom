# Inkloom V3 Build Plan

V3 rebuilds Inkloom around three ideas: Supabase is the source of identity and authorization, AI is used for the creative concept while templates are computed deterministically in the browser, and the UI follows the "Studio Table" direction (with Wet Paint accents) from `public/mockups/vibes.html`.

Constraint for this build: only dependencies already in `package.json` may be used.

## Stage 1 — Schema
- 1.1 A migration `supabase/migrations/0004_v3_schema.sql` creates `profiles`, `templates`, and `generations` tables.
- 1.2 `profiles.id` is a uuid primary key that references `auth.users(id)`.
- 1.3 `templates.owner_id` and `generations.owner_id` are uuids that reference `profiles(id)` and default to `auth.uid()`.
- 1.4 `templates` stores title, medium, difficulty, prompt, concept image path, workspace settings (jsonb), visibility, and timestamps.
- 1.5 `generations` stores status (`queued`, `running`, `succeeded`, `failed`), provider, prompt, result image path, error, and timestamps.
- 1.6 A trigger creates a `profiles` row when a Supabase Auth user is created.
- 1.7 Row Level Security is enabled on all three tables: owners have full access to their own rows, and anyone can read templates where `is_public` is true.
- 1.8 Storage policies limit writes in the `avatars` and `templates` buckets to paths starting with the user's id.
- 1.9 The migration copies existing data from the legacy `user` and `template` tables into the new tables.
- 1.10 Migration `0003_template_user_id_uuid.sql` is removed, because 0004 supersedes it.

## Stage 2 — Data access layer
- 2.1 `src/lib/supabase/server.ts` creates a Supabase client bound to the request's session cookies, for Server Components, Server Actions, and route handlers.
- 2.2 `src/lib/supabase/admin.ts` is the only module that reads `SUPABASE_SERVICE_ROLE_KEY`.
- 2.3 `src/proxy.ts` refreshes an expired session on page requests and updates the cookies.
- 2.4 `src/lib/db/types.ts` defines TypeScript types for the `profiles`, `templates`, and `generations` rows.

## Stage 3 — Validation
- 3.1 `src/lib/validation.ts` provides typed validators for every Server Action input.
- 3.2 Every Server Action validates its input before using it and returns field errors on failure.

## Stage 4 — Server Actions replace the API routes
- 4.1 Auth actions: sign up, sign in (email or username), sign out, and request a password reset.
- 4.2 `src/app/auth/callback/route.ts` completes email confirmation and password-reset links and signs the user in.
- 4.3 Profile actions: update profile, upload avatar, change password, export data, and delete account.
- 4.4 Template actions: save a template, update its workspace settings, set its visibility, and delete it.
- 4.5 Server Actions take the user's identity from the session only.
- 4.6 The old routes in `src/app/api/` are removed, except the generation status route (5.5).

## Stage 5 — AI providers and generation jobs
- 5.1 Image providers implement one interface in `src/lib/ai/providers/`: Pixazo and Cloudflare Workers AI.
- 5.2 `IMAGE_PROVIDER` selects the primary provider, and the other configured provider is used as a fallback when the primary fails.
- 5.3 A prompt builder turns the idea, medium, and options into a colour concept prompt.
- 5.4 Starting a generation inserts a `generations` row, returns its id immediately, and runs the provider after the response.
- 5.5 `GET /api/generations/[id]` returns the status and, when finished, a signed URL for the result.
- 5.6 Generation is rate limited per user by counting the user's `generations` rows from the last hour (`GENERATE_RATE_LIMIT_PER_HOUR`, default 10).
- 5.7 Creating concepts starts 4 generations for one idea.

## Stage 6 — Template processing (browser, deterministic)
- 6.1 `src/lib/processing/` contains pure functions that work on RGBA image data.
- 6.2 Line art: edge detection with adjustable detail and line weight, producing black lines on white.
- 6.3 Value study: posterized greyscale with an adjustable number of steps.
- 6.4 Palette: k-means colour extraction with an adjustable colour count, giving hex, share, and a colour name for each colour.
- 6.5 Paint by number: pixels quantized to the palette, with region outlines.
- 6.6 Difficulty presets map beginner, intermediate, and advanced to detail, value steps, and palette size.
- 6.7 `src/lib/plan.ts` builds a project plan (materials, ordered steps, time estimate) from the medium, palette, value steps, and difficulty.

## Stage 7 — Studio Table design system
- 7.1 Design tokens for the Studio Table direction are defined in `src/styles/globals.css`.
- 7.2 `src/components/studio/` provides Paper, Tape, Button, Chip, PencilSlider, Wash (SVG watercolour), HandNote, StudioBackground, LayerCard, and PaintTin components.
- 7.3 The Caveat handwriting font is loaded alongside Fraunces and Inter.
- 7.4 Motion respects `prefers-reduced-motion`.

## Stage 8 — Pages and flow
- 8.1 Home: a prompt bar with medium shortcuts and a strip of recent public templates.
- 8.2 Create: choose a medium, describe the idea (with an optional reference photo), see the generation stages, then pick one of the concepts.
- 8.3 Workspace `/t/[id]`: layer toggles (line art, values, paint by number, grid, colour reference), live sliders for the processing settings, the palette, and the project plan.
- 8.4 Workspace settings are saved to the template.
- 8.5 Export from the workspace: PNG of the visible layers, and a printable pack (template, palette, and plan) using print styles.
- 8.6 Gallery: a masonry grid of public templates with medium and difficulty filters.
- 8.7 My projects: the signed-in user's templates.
- 8.8 Settings: profile, avatar, password, data export, and account deletion.
- 8.9 Private templates return 404 to anyone who is not the owner.

## Stage 9 — Verification
- 9.1 Unit tests cover validation, the processing functions, the plan builder, provider selection and fallback, and the rate limit.
- 9.2 `npm run lint`, `npx tsc --noEmit`, and `npm test -- --run` pass.
- 9.3 The README documents V3 setup: environment variables, migration 0004, and the providers.
