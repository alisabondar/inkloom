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
