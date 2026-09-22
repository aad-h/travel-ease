# TravelEase

TravelEase is a Next.js travel-planning application. Users can create accounts, sign in with email/password or Google, plan and save trips, search for nearby places, and visualize routes with Google Maps.

## Source provenance and attribution

This repository is a clean migration of the existing TravelEase application from the locally supplied `travelplanner-main 2` source snapshot. The application code and product vision were preserved without a redesign. The supplied snapshot did not contain an author list, copyright notice, or license file, so none has been invented or removed. Before publishing publicly, confirm that you have permission from all original contributors and add their requested attribution. Absence of a license does not grant reuse rights.

## Architecture

- Next.js 15 App Router with React 19 and TypeScript
- Server API routes under `src/app/api`
- MongoDB database `travelease`, using `users` and `trips` collections
- Email/password authentication with bcrypt password hashes and signed JWTs
- Google OAuth 2.0 login
- Google Maps JavaScript, Places, and Routes APIs
- SMTP password-reset email through Nodemailer
- Tailwind CSS 4 through PostCSS

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
npm run lint
npm run build
npm run dev
```

No automated test script is defined in the supplied `package.json`. The supplied source also has no ESLint configuration, so `npm run lint` currently opens Next.js's first-time configuration prompt instead of performing a non-interactive lint run. That pre-existing setup gap is recorded in [MIGRATION_REPORT.md](./MIGRATION_REPORT.md).

## Project documentation

The original product requirements are preserved in [Project_Vision.md](./Project_Vision.md).
