# Spec Audit — Source: README.md

Scope: all README sections except "Roadmap" (labelled "ideas", not requirements).

## Checklist
1. Intro: "Users can describe an idea, generate a clean visual template"
2. Intro: "save it to their account"
3. Intro: "browse public templates"
4. Intro: "manage profile settings"
5. Status: "Text-to-template generation for creative project ideas"
6. Status: "Template saving, viewing, gallery browsing, and PNG download"
7. Status: "Public/private template visibility support"
8. Status: "Email-based account creation and sign in"
9. Status: "Account settings with profile editing, avatar upload, password change, data export, and account deletion"
10. Status: "Responsive UI with animated artwork, paint-splatter loading states, and shared visual styling"
11. Tech Stack: "Next.js 16 with the App Router"
12. Tech Stack: "React 19, CSS Modules, shared global design tokens, Tailwind CSS import support"
13. Tech Stack: "Database, Auth, and Storage: Supabase"
14. Tech Stack: "AI Image Generation: Pixazo Flux Schnell"
15. Tech Stack: "Testing: Vitest and React Testing Library"
16. Tech Stack: "Language: TypeScript"
17. Running Locally: env vars "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "PIXAZO_API_KEY"
18. Running Locally: "Optional Pixazo overrides" PIXAZO_FLUX_SCHNELL_REQUEST_URL / PIXAZO_FLUX_SCHNELL_RESULT_URL
19. Running Locally: "npm run dev" … "Open http://localhost:3000"
20. Useful Scripts: "npm run lint"
21. Useful Scripts: "npx tsc --noEmit"
22. Useful Scripts: "npm test -- --run"
23. Useful Scripts: "npm run build"
24. Supabase: "`user` for profile/account data"
25. Supabase: "`template` for saved generated templates"
26. Supabase: "`templates` storage bucket for generated artwork files"
27. Supabase: "`avatars` storage bucket for profile images"

## Round 1 (2026-10-20, fresh auditor subagent)
Result: 26 MET, 1 PARTIAL, 0 MISSING. New items: 1.

Evidence highlights: lint exit 0; `tsc --noEmit` exit 0; `npm test -- --run` 4/4 pass; generation in `src/app/api/generate-template/route.ts` (Pixazo flux-1-schnell, env overrides at :48/:81); visibility at `save-template/route.ts:36` + `get-public-templates/route.ts:19-21`; buckets `templates` (generate-template:147) and `avatars` (upload-avatar:74).

### Findings
- #23 PARTIAL — `npm run build` not verified: stalls at "Creating an optimized production build ..." with no error (>9 min auditor run; 275 s retry with telemetry disabled). No code error is emitted and lint/tsc pass; the stall is attributed to the Seatbelt sandbox, not the code. **Blocker (environmental):** verify by running `npm run build` outside the sandbox.

### Out-of-scope
- Hardcoded example images in gallery (`gallery/page.tsx:31-37`)
- Unused deps `openai`, `react-router-dom`
- Sign-in also accepts username
- Vite CJS deprecation warning
- README clone path says `unknown-proj`

## Outcome
Stopped after Round 1: no code findings remain; #23 is blocked on environment, not fixable by a code change. Scope-creep breaker did not fire.
