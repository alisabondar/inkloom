# Inkloom

Inkloom is an AI-assisted template studio for artists. Users can describe an idea, generate a clean visual template, save it to their account, browse public templates, and manage profile settings in a polished creative workspace.

## Status

Inkloom is currently an MVP focused on the core template-generation flow and account experience.

Current features include:

- Text-to-template generation for creative project ideas
- Template saving, viewing, gallery browsing, and PNG download
- Public/private template visibility support
- Email-based account creation and sign in
- Account settings with profile editing, avatar upload, password change, data export, and account deletion
- Responsive UI with animated artwork, paint-splatter loading states, and shared visual styling

## Tech Stack

- **Framework:** Next.js 16 with the App Router
- **UI:** React 19, CSS Modules, shared global design tokens, Tailwind CSS import support
- **Database, Auth, and Storage:** Supabase
- **AI Image Generation:** Pixazo Flux Schnell
- **Testing:** Vitest and React Testing Library
- **Language:** TypeScript

## Running Locally

Clone the repository and install dependencies:

```bash
git clone https://github.com/alisabondar/unknown-proj.git
cd unknown-proj
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
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
```

## Supabase Notes

Inkloom expects Supabase tables for users and templates, plus storage buckets for generated templates and avatars.

The app currently uses:

- `user` for profile/account data
- `template` for saved generated templates
- `templates` storage bucket for generated artwork files
- `avatars` storage bucket for profile images

## Roadmap

Near-term ideas:

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
