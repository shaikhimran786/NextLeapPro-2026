# Next Leap Pro - Learn, Earn, and Grow

## Overview
Next Leap Pro is a SaaS platform designed for continuous learning and professional development. It aims to empower individuals to acquire new skills, access earning opportunities, and advance their careers. The platform achieves this by integrating various features: learning events (workshops, bootcamps), community building, a unique service marketplace, and a subscription-based monetization model. Its core business vision is to foster growth and skill development through its unique service marketplace offering.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure
The project is a full-stack monorepo comprising a `client/` (React frontend), `server/` (Express backend), and `shared/` (common TypeScript types and schemas) for end-to-end type safety.

### Frontend Architecture
The frontend uses React 18 with TypeScript, Vite for development, and Wouter for routing. UI components are built with `shadcn/ui` (New York variant) based on Radix UI primitives and styled with Tailwind CSS v4. It features a custom design system with a magenta, blue, and green gradient, custom CSS variables, Inter and Outfit fonts, and rounded card designs. State management and data fetching are handled by TanStack Query, while Framer Motion provides animations. TypeScript path aliases (`@/`, `@shared/`, `@assets/`) are used for clean imports.

### Backend Architecture
The backend is an Express.js server written in TypeScript, configured for JSON/URL-encoded body parsing and logging. Vite is used for HMR during development, and esbuild compiles the server for production.

### Database Layer
Drizzle ORM is used for type-safe PostgreSQL operations, with schema definitions in `shared/schema.ts` leveraging Zod for validation and automatic TypeScript type inference. Neon serverless Postgres is the chosen database provider. The data model supports users (with multiple roles), events, registrations, communities, services, bookings, subscription plans, and multi-currency. A storage abstraction (`server/storage.ts`) encapsulates database operations.

### Authentication & Authorization
The platform employs a custom session-based authentication system with distinct flows for website users and administrators. Website authentication uses a `session` cookie, bcryptjs for password hashing, and PostgreSQL for session storage. Admin authentication uses a separate `admin_session` cookie, restricted to `admin` role users. Role-based access control allows users to hold multiple roles (student, mentor, organizer, admin). Password reset functionality is available for admins. Server-side auth hydration is implemented using `getUserStatusServer()`.

### Profile Management
Users have public and editable profiles with unique handles, completeness scoring, social links, skills, and a publish/unpublish toggle. Service access is tied to subscription tiers.

### API Design
The API adheres to RESTful conventions, includes consistent error handling, and uses Zod for request body validation. It supports query parameters for filtering and searching.

### Deployment & Build
Production builds utilize Vite for the frontend and esbuild for the Express server, with the server serving static frontend files. `DATABASE_URL` manages environment configuration.

### Subscription System
The platform offers Free, Pro (Monthly/Annual), and Creator (Monthly/Annual) plans. Database models include `SubscriptionPlan`, `UserSubscription`, `PaymentTransaction`, and `SubscriptionPriceHistory`. Razorpay handles payment processing, and the admin panel manages plans, prices, and subscribers. Custom payment URLs are also supported.

### Services Marketplace
This core monetization feature allows users to offer and discover services. Full provider details are gated for premium subscribers, enforced by server-side protection. Database models include `Service`, `ServiceReview`, and `ServiceBooking`. Admin moderation features include viewing, blocking, and auditing services.

### Admin Features
The `/admin` panel provides comprehensive management capabilities:
- **Events Management**: Create, edit, delete events, reassign organizers, associate communities. All actions are logged to `AdminAuditLog`.
- **Communities Management**: Create, edit, delete communities, toggle visibility, reassign creators.
- **Security Patterns**: All admin routes are protected with `checkAdminAccess()` and audit logging.
- **Site Settings**: Manages general settings, logos, favicons, social media links, and payment gateway configurations dynamically.
- **Payment Gateway Configuration**: Includes Razorpay connection status, global enable/disable toggle, test/live mode switching, API key display, and webhook URL for setup.

### AI-Powered Features
The platform integrates Replit's OpenAI (`gpt-4o`) for AI capabilities:
- **AI Event Generation**: Admins can generate event details (title, description, agenda, takeaways) based on templates.
- **AI Career Coach**: Provides personalized career guidance for authenticated users based on their skills, interests, and goals.

### Community Ownership System
Communities operate on a membership-based ownership model with a role hierarchy (owner > admin > moderator > member > pending/invited). Access control is enforced via `checkCommunityAccess()` for mutating API routes. Subscription tiers impose limits on community creation (Free: 0, Pro: 1, Creator: Unlimited), with site admins bypassing all limits.

### Engagement System
A daily engagement feature supports polls and surveys. Database models include `EngagementTopic`, `Poll`, `PollOption`, `PollResponse`, and `DailySurveySchedule`. Admins can create/manage topics, polls, schedule them, and view analytics. Public users can view active polls, submit responses, and view results.

### Cloud Storage System
Replit's App Storage (backed by Google Cloud Storage) is used for asset management with ownership-based access control. Core components include object storage utilities, an ACL framework for different entity types, and an upload API for presigned URL generation. Files are organized by entity type and ID (e.g., `users/{userId}/avatar.ext`). Security involves server-side ownership checks, with site admins having full access. A reusable `ImageUploader` component provides drag-and-drop functionality, previews, and integration with the storage API. Image URLs can be internal bucket paths or external URLs.

### SEO & Production Readiness
The platform incorporates comprehensive SEO features:
- **Structured Data (JSON-LD)**: Includes Organization, WebSite, Event, Service, Community, BreadcrumbList, and FAQ schemas.
- **Sitemap & Robots**: Dynamically generated sitemap and a configured `robots.txt`.
- **Accessibility**: Skip links, ARIA labels, semantic HTML, and image alt text.
- **Metadata**: Full Open Graph, Twitter Cards, canonical URLs, and dynamic, admin-configurable favicons.

## External Dependencies

### Core Infrastructure
- **Database**: Neon serverless PostgreSQL
- **Build Tools**: Vite, esbuild, TypeScript

### UI Framework & Styling
- **Component Libraries**: Radix UI, shadcn/ui, Lucide React
- **Styling**: Tailwind CSS v4, Framer Motion

### State & Data Management
- **Frontend**: TanStack Query, React Hook Form, Zod
- **Backend**: Drizzle ORM, Drizzle Kit, drizzle-zod

### Development Experience
- **Replit Integration**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner
- **Development Server**: tsx

### Third-Party Services
- **Payment Processing**: Razorpay (primary, for events and subscriptions), Cashfree (legacy, subscriptions only)
- **Session Management**: express-session with PostgreSQL storage (connect-pg-simple)
- **AI**: Replit's OpenAI Integration (gpt-4o)

### Payment Gateway Configuration
The platform uses Razorpay as the primary payment gateway for event payments and supports both Razorpay and Cashfree for subscriptions.

Configuration requires:
- `RAZORPAY_KEY_ID`: Razorpay API Key ID
- `RAZORPAY_KEY_SECRET`: Razorpay API Key Secret
- `RAZORPAY_WEBHOOK_SECRET`: Razorpay Webhook Secret (optional, for webhook verification)
- `CASHFREE_APP_ID`: Cashfree App ID (legacy, subscriptions only)
- `CASHFREE_SECRET_KEY`: Cashfree Secret Key (legacy, subscriptions only)

Key files:
- `src/lib/razorpay.ts` - Razorpay SDK integration (order creation, signature verification)
- `src/app/api/payments/create-order/route.ts` - Event payment order creation via Razorpay
- `src/app/api/payments/verify/route.ts` - Event payment verification with signature check
- `src/app/api/webhooks/razorpay/route.ts` - Razorpay webhook handler (subscriptions)
- `src/app/api/subscriptions/checkout/route.ts` - Subscription checkout (supports both gateways)
- `src/app/api/subscriptions/verify/route.ts` - Subscription payment verification
- `src/components/events/EventRegistrationButton.tsx` - Event registration with Razorpay checkout modal
- `src/lib/cashfree.ts` - Cashfree SDK integration (legacy, subscriptions)
- `src/app/api/payments/cashfree/webhook/route.ts` - Cashfree webhook handler (legacy)

**Event Payment Flow**:
1. User clicks "Buy Ticket" → backend creates pending EventRegistration with a unique `paymentToken`
2. Frontend calls `/api/payments/create-order` with registrationId + paymentToken → creates Razorpay order, stores orderId on registration
3. Razorpay checkout modal opens in-browser
4. On success, frontend calls `/api/payments/verify` with razorpay_order_id, payment_id, signature, registrationId, paymentToken
5. Backend verifies: signature cryptographically, server-side payment fetch (amount/status/currency - fail-closed), and ownership (session auth OR paymentToken)
6. Registration marked as "registered"/"paid", ticket generated, paymentToken cleared from DB
7. Payment proof (orderId, paymentId, signature) stored on EventRegistration record

**Security**: Payment APIs require either authenticated session matching registration owner OR a valid `paymentToken` (64-char hex, unique per registration, generated at registration time, cleared after payment). This enables secure guest checkout without login while preventing unauthorized access.

**Subscription Payment Flow**:
- Uses site settings `activePaymentGateway` ("razorpay" or "cashfree") to determine which gateway to use
- Subscription periods managed internally by the platform (not gateway recurring billing)
- Authentication required before checkout

## Development Guidelines

### Known HMR Issue (Next.js 16 + Webpack)

**Issue**: During development, Fast Refresh may continuously rebuild in the browser console. This is caused by the Replit webview healthcheck polling the dev server, triggering HMR cycles.

**Impact**: Development only. Does not affect:
- Fresh page loads (pages load correctly)
- Production builds
- User experience during actual navigation

**Previous fix**: Removed unused packages (`@nextui-org/framer-transitions`, `framer-motion-scroll-to-hook`, `tracer-motion`) that brought in duplicate `framer-motion` versions, which was the root cause of "Invalid hook call" and hydration mismatch errors.

**Important**: Do not re-add `transpilePackages: ['lucide-react']` to `next.config.mjs` — it was intended for Turbopack but causes HMR issues with webpack.

### Production Deployment

**Run command**: `node production-server.mjs` — custom server that starts an HTTP server immediately (returning 200 for healthchecks) while Next.js initializes in the background. This prevents Replit's healthcheck from failing during Next.js cold start.

**Prisma pre-warming**: `src/lib/prisma.ts` eagerly calls `$connect()` in production to avoid cold-start delays on the first SSR request.

**Build pipeline** (`script/build.ts`): `prisma generate` → `next build` → `esbuild server launcher`

**Important**: This project uses Next.js 15.5.15 (downgraded from 16.2.3 to fix React 18 compatibility). The `--webpack` flag is NOT supported in Next.js 15 — do not add it to `next dev` or `next build` commands.

### Feature Demo Video Component

The FeatureDemoVideo component uses a layered architecture to avoid SSR issues:
- `FeatureDemoVideoTypes.ts` - Type definitions
- `FeatureDemoVideoWrapper.tsx` - Main client component
- `DynamicFeatureDemoVideo.tsx` - Client wrapper with useMounted pattern

Import `DynamicFeatureDemoVideo` in both server and client components.

### Icon Imports

Always import icons from `@/lib/icons`:
```tsx
import { Menu, X, Check } from "@/lib/icons";
```