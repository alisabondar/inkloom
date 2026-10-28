# Inkloom

Inkloom is an AI-assisted template studio for artists. You describe an idea, pick a medium, difficulty, and duration, and Inkloom generates a black-and-white line-art reference you can save, share to a public gallery, and download as a PNG.

## Status

Inkloom is an early MVP focused on the template-generation flow and account pages. See [Known limitations](#known-limitations) before using it with real accounts.

Current features:

- Text-to-template generation: a line-art sketch built from your idea, medium, difficulty, and duration
- Saving a generated template, viewing it, and downloading it as a PNG
- An option to share a template in the public gallery
- A gallery of public templates (alongside three built-in example images)
- Account sign-up, and sign-in with email or username
- Account settings: profile editing, avatar upload, password change, data export (JSON), and account deletion
- Responsive UI with an animated background, paint-splatter styling, and shared visual design

## Tech Stack

- **Framework:** Next.js 16 with the App Router (API routes in `src/app/api`)
- **UI:** React 19, CSS Modules, shared global styles, Tailwind CSS import support
- **Database and storage:** Supabase (Postgres tables and Storage buckets, accessed with the service-role key from API routes)
- **AI image generation:** Pixazo FLUX.1-schnell (512×512, 4 steps)
- **Testing:** Vitest and React Testing Library
- **Language:** TypeScript

## Running Locally

Clone the repository and install dependencies:

```bash
git clone https://github.com/alisabondar/inkloom.git
cd inkloom
npm install
```

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PIXAZO_API_KEY=your-pixazo-api-key
```

Optional Pixazo overrides:

```bash
PIXAZO_FLUX_SCHNELL_REQUEST_URL=https://gateway.pixazo.ai/flux-1-schnell/v1/getData
PIXAZO_FLUX_SCHNELL_RESULT_URL=https://gateway.pixazo.ai/flux-1-schnell/v1/getData-result
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build
npm run lint
npx tsc --noEmit
npm test -- --run      # run the test suite once
npm run test:ui        # Vitest UI
npm run test:coverage
```

## Supabase Setup

The app expects these to exist in your Supabase project:

- **`user` table:** profile and account data: `id`, `email`, `password`, `first_name`, `username`, `favorite_medium`, `avatar_url`
- **`template` table:** saved templates: `id`, `title`, `medium`, `difficulty`, `duration`, `generated_image_id`, `image_url`, `source`, `user_id`, `public`, `created_at`, `updated_at`
- **`templates` storage bucket:** generated images. Create it yourself; the app uploads to it but doesn't create it.
- **`avatars` storage bucket:** profile images. Created automatically (private) on the first avatar upload.

`supabase-schema.sql` only adds an index on `created_at`. It refers to a table named `templates`, but the app uses `template`, so adjust the name before running it.

## Project Structure

```
src/
  app/
    page.tsx              home
    create-template/      generation form
    template-view/        view and download a template
    gallery/              public templates
    account-settings/     profile, avatar, password, export, delete
    api/                  route handlers (sign-up/in, templates, profile, generation)
  components/common/      header, footer, auth modal, animated background
  hooks/                  useAuth, usePublicTemplates
  lib/                    Supabase clients, signed storage URLs
  constants/              DEFAULT_USER_ID
```

## Known Limitations

- **Authentication is not secure yet.** Passwords are stored and compared as plain text in the `user` table, and the signed-in user is kept in `localStorage`. The API routes trust the user ID the browser sends and use the service-role key, so anyone who knows a user's ID can call profile, password, export, or delete endpoints for that user. Supabase Auth is not used.
- **Templates are not linked to accounts.** Every saved template is stored with the placeholder owner `user_id = '1'` (`DEFAULT_USER_ID`), and there is no "my templates" page.
- **No generation limit.** `/api/generate-template` has no rate limiting, so anyone can spend the Pixazo quota.
- **Tests:** only `src/components/__tests__/Header.test.tsx` exists. `TEST_README.md` describes tests that are not in the repo.
- **Unused dependencies:** `openai` and `react-router-dom` are installed but not imported anywhere.

## Roadmap

Near-term ideas:

- Move accounts to Supabase Auth with Row Level Security, and link templates to their owners
- Rate limiting for generation
- Image-to-image support for turning reference uploads into generated templates
- More artistic mediums such as embroidery, watercolor, ink, and digital art
- Template iterations and refinement controls
- Full project plans with materials, steps, and timelines

Future ideas:

- Collaborative projects and shared works in progress
- Saved style presets
- PDF/SVG export formats
- Progress tracking with notes and photos
- Community remixing
- Personalized custom styles
