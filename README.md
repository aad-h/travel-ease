# TravelEase

TravelEase is a Next.js travel-planning application. Users can create accounts, sign in with email/password or Google, plan and save trips, search for nearby places, visualize routes with Google Maps, and generate personalized day-by-day itineraries.

The smart planner considers budget, group size, hotel/home base, daily hours, pace, interests, dietary or accessibility needs, and a hidden-gems preference. It uses a deterministic local scoring and retrieval engine, so generating an itinerary does not require a paid AI provider.

## Source provenance and attribution

This repository is a clean migration of the existing TravelEase application from the locally supplied `travelplanner-main 2` source snapshot. The application code and product vision were preserved without a redesign. The supplied snapshot did not contain an author list, copyright notice, or license file, so none has been invented or removed. Before publishing publicly, confirm that you have permission from all original contributors and add their requested attribution. Absence of a license does not grant reuse rights.

## Architecture

- Next.js 15 App Router with React 19 and TypeScript
- Server API routes under `src/app/api`
- MongoDB database `travelease`, using `users` and `trips` collections
- Email/password authentication with bcrypt password hashes and signed JWTs
- Google OAuth 2.0 login
- Google Maps JavaScript, Places, and Routes APIs
- Places API (New) server routes with explicit field masks
- SMTP password-reset email through Nodemailer
- Tailwind CSS 4 through PostCSS
- Local deterministic itinerary scoring and knowledge retrieval (RAG-ready, no hosted AI)

## Local setup

Requirements: Node.js 20 or newer, npm, a MongoDB Atlas database, a Google Cloud project, and an SMTP account.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. Fill in `.env.local` before testing database, maps, OAuth, or password-reset features. Never commit `.env.local`.

For complete account and deployment instructions, see [SETUP.md](./SETUP.md).

## Validation commands

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

`npm test` covers the local planner's ranking, scheduling, retrieval, link generation, and date validation. The supplied source has no ESLint configuration, so `npm run lint` currently opens Next.js's first-time configuration prompt instead of performing a non-interactive lint run. That pre-existing setup gap is recorded in [MIGRATION_REPORT.md](./MIGRATION_REPORT.md).

## Project documentation

The original product requirements are preserved in [Project_Vision.md](./Project_Vision.md).

The smart-planner scope and cost boundary are documented in [docs/SMART_PLANNER_IMPLEMENTATION.md](./docs/SMART_PLANNER_IMPLEMENTATION.md).
