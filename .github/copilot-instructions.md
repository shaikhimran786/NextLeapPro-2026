# NextLeapPro AI Coding Guidance

This repository is a Next.js 15 app built with the App Router. The production workflow is centered on `src/app`, `src/lib`, and Prisma-backed server logic.

## Big picture
- `src/app/` is the main app router. Most pages are server components by default.
- `src/lib/actions/*.ts` contains server actions marked with `"use server"` and uses `revalidatePath()` for cache invalidation after mutations.
- `src/app/api/*/route.ts` contains JSON API route handlers using `NextRequest` / `NextResponse`.
- `src/lib/prisma.ts` exports a global Prisma singleton. Use it for database access, and avoid recreating clients.
- Auth is cookie-session-based in `src/lib/auth-utils.ts`, using the `session` cookie and `prisma.session`.

## Key entry points
- `npm run dev` → `tsx server/index.ts` launches Next with port recovery and dev defaults.
- `npm run build` → `tsx script/build.ts` runs `prisma generate`, `next build`, then bundles `server/index.ts` into `dist/index.cjs`.
- `npm run start` → starts the bundled production launcher.

## Important patterns
- Use `use client` only in components that require browser hooks, forms, navigation, or state.
- Server components and app pages should use `notFound()`, `redirect()`, `permanentRedirect()`, and `generateStaticParams()` as needed.
- `revalidatePath()` is the preferred way to refresh server-rendered content after server actions.
- API routes return structured JSON with `NextResponse.json(...)` and explicit HTTP status codes.
- `src/lib/auth-utils.ts` and `src/lib/user-status.ts` are the authoritative source for user status and permissions.

## Project-specific conventions
- `src/lib/actions/*` is the canonical location for reuseable mutation logic, not ad-hoc client-side fetch handlers.
- `src/app/api` routes are used for external JSON APIs and file upload endpoints like `src/app/api/upload/route.ts`.
- `next.config.mjs` sets common headers, image remote patterns, and `experimental.serverActions.bodySizeLimit`.
- There is a `vite.config.ts`, but the primary application is Next-based. Prefer Next app routes and `src/app/` over Vite-specific workflows unless a separate `client` folder is explicitly added.

## When modifying behavior
- Preserve the server/client boundary. Do not move data-fetching logic from server components into client-only components unless required by user interaction.
- Revalidate only the paths affected by a mutation. Many actions already call `revalidatePath('/dashboard')`, `/services`, or `/events`.
- Keep authentication checks consistent with `src/lib/auth-utils.ts` and status mapping in `src/app/api/me/status/route.ts`.

## Useful references
- `server/index.ts` → local development launcher with port collision handling.
- `script/build.ts` → build flow and production bundle setup.
- `src/lib/prisma.ts` → Prisma singleton pattern.
- `src/app/api` → built-in Next API route style.
- `src/lib/actions` → server action pattern and cache invalidation.
- `src/lib/auth-utils.ts` → session-based auth rules and creator/pro tier checks.

If any section is unclear or you want more detail on a particular area (auth, page rendering, or build flow), I can refine this file further.