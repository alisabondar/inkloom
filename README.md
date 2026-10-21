# Inkloom

Inkloom is a template studio for artists. Describe an idea (or upload a reference photo), pick one of four AI colour concepts, and Inkloom turns it into a working template: line art, a value study, a paint-by-number map, a grid, a named palette, and a step-by-step plan for your medium. Everything after the concept is computed in the browser, so the sliders redraw instantly without another AI call.

## Features

- **Create:** choose a medium (pencil & ink, watercolor, acrylic, paint by number, embroidery, tattoo stencil), describe the idea, and get 4 concepts — or use your own photo as the concept.
- **Workspace (`/t/[id]`):** toggle layers (line art, values, paint by number, grid, colour reference), tune detail, line weight, value steps, palette size, and grid, switch difficulty presets, and read the generated project plan. Settings are saved with the template.
- **Export:** download a PNG of the visible layers, or print a pack with the template, palette sheet, value scale, and plan.
- **Gallery:** public templates with medium and difficulty filters. **My projects:** your own templates, public or private.
- **Accounts:** Supabase Auth with email confirmation, password reset, profile and avatar, password change, data export, and account deletion.
- **Look:** the "Studio Table" design — paper, tape, and watercolour accents (see `public/mockups/vibes.html`).

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`)
- **UI:** React 19, CSS Modules, Studio Table design system in `src/components/studio`
- **Database, Auth, Storage:** Supabase, with Row Level Security on every table
- **AI image generation:** Pixazo FLUX.1-schnell and Cloudflare Workers AI FLUX, with automatic fallback
- **Template processing:** pure TypeScript in `src/lib/processing` (edge detection, posterization, k-means palette, region outlines), run in a Web Worker
- **Testing:** Vitest and React Testing Library
- **Language:** TypeScript

## Running locally

```bash
git clone https://github.com/alisabondar/unknown-proj.git
cd unknown-proj
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# At least one image provider
PIXAZO_API_KEY=your-pixazo-api-key
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-workers-ai-token
```

Optional:

```bash
IMAGE_PROVIDER=cloudflare            # primary provider: pixazo or cloudflare (the other is the fallback)
GENERATE_RATE_LIMIT_PER_HOUR=10      # concepts per user per hour (each idea uses 4)
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell
PIXAZO_FLUX_SCHNELL_REQUEST_URL=https://gateway.pixazo.ai/flux-1-schnell/v1/getData
PIXAZO_FLUX_SCHNELL_RESULT_URL=https://gateway.pixazo.ai/flux-1-schnell/v1/getData-result
```

Local testing without signing in (ignored when `NODE_ENV=production`): every request is signed in as a confirmed dev account (`dev@inkloom.test`, created on first use). It is a real Supabase user, so Row Level Security still applies.

```bash
DEV_AUTH_BYPASS=true
DEV_USER_EMAIL=dev@inkloom.test        # optional
DEV_USER_PASSWORD=choose-a-local-one   # optional
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

```bash
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
```

## Supabase setup

### New project

Run `supabase/migrations/0004_v3_schema.sql` in the SQL Editor. It creates:

- `profiles` — one per Auth user (`id` = `auth.users.id`), created automatically by a trigger on sign-up
- `templates` — owned by a profile, with workspace `settings` (jsonb) and `is_public`
- `generations` — background image jobs (`queued` → `running` → `succeeded` / `failed`)
- the `avatars` and `templates` storage buckets, with policies that only let users write inside a folder named with their user id
- Row Level Security: owners have full access to their rows; anyone can read public templates

In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your production URL) to the redirect URLs. Confirmation and reset emails work with Supabase's default templates; if you switch the templates to `{{ .TokenHash }}` links pointing at `/auth/callback?token_hash={{ .TokenHash }}&type=…`, the callback verifies those too.

### Upgrading a V1/V2 database

Apply in this order:

1. `supabase/migrations/0001_link_user_to_auth.sql`
2. `node --env-file=.env.local scripts/migrate-users-to-auth.mjs --dry-run`, then without `--dry-run` (creates or links a Supabase Auth user for each legacy `user` row)
3. `supabase/migrations/0002_enable_rls.sql`
4. Run `0004_v3_schema.sql`. It copies legacy profiles and templates into the new tables; the legacy tables are left in place and are no longer used. V2 saved every template under a placeholder owner, so legacy templates go to the earliest-created account — set `legacy_owner_email` near the bottom of the file first to choose a different owner.

## Project structure

```
src/
  app/
    actions/           Server Actions (auth, profile, templates, generations, uploads)
    api/generations/   generation status endpoint, polled by the concepts page
    auth/callback/     email-link handler
    create/            medium → idea → concepts flow
    t/[id]/            workspace (processing runs in a Web Worker)
    gallery/ projects/ settings/ signin/ signup/ reset/
  components/studio/   design system
  components/site/     header, footer, template grid, forms
  lib/
    supabase/          session-bound server client, admin client (the only reader of the service-role key)
    ai/                providers, prompt builder, background jobs, quota
    processing/        deterministic template processing
    plan.ts            mediums and project plans
    validation.ts      Server Action input validators
  proxy.ts             refreshes expired sessions before pages render
```

## Roadmap

- Numbers drawn inside paint-by-number regions
- SVG export (potrace) and tiled large-format printing
- Refinement of a chosen concept ("simpler", "more like this")
- Remixing gallery templates and a progress journal
