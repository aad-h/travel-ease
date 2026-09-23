# TravelEase service setup

Create every account and credential under an account you control. Do not paste secrets into chat, source files, Git commits, screenshots, or documentation. Store local values only in `.env.local`, and store deployment values in Vercel's environment-variable settings.

## 1. Create the local environment file

From the project directory:

```bash
cp .env.example .env.local
```

Keep `.env.example` as placeholders. Put real values only in `.env.local`.

Generate `JWT_SECRET` locally:

```bash
openssl rand -base64 32
```

Paste the generated value into `JWT_SECRET` in `.env.local`.

## 2. MongoDB Atlas

1. Sign in to MongoDB Atlas under your own account and create a project.
2. Create a cluster on the tier and region you want.
3. Under **Database Access**, create a dedicated database user with a new strong password. Do not reuse your Atlas account password.
4. Under **Network Access**, allow your current IP for local development.
5. Open the cluster's **Connect** flow, choose the drivers option, and copy the Node.js connection string.
6. Replace its username, password, and database placeholder. URL-encode special characters in the password.
7. Put the result in `.env.local` as `MONGODB_URI`. The application selects the `travelease` database itself.
8. Start the app and visit `/api/check-connection` to check connectivity.

The application creates data through normal use; no migration or seed script was included in the original source. Do not copy real user data. If you need demo records, create synthetic accounts and trips through the UI.

## 3. Google Maps Platform

1. In Google Cloud Console, create a project under your account and attach billing. Google Maps Platform requires billing for these APIs.
2. Enable **Maps JavaScript API**, **Places API (New)**, and **Routes API**.
3. Create one browser API key. Restrict its application type to **Websites** and allow `http://localhost:3000/*`. Later add your exact Vercel production URL. Restrict the key to Maps JavaScript API.
4. Put that key in `NEXT_PUBLIC_GOOGLE_JSMAP_API`.
5. Create a separate server API key. Restrict it to Places API (New) and Routes API. If your hosting setup supports a stable source-IP restriction, add it; otherwise keep API restrictions enabled and regularly review usage.
6. Put the server key into `GOOGLE_MAP_API`, `GOOGLE_PLACES_API`, and `GOOGLE_ROUTES_API`. You may create separate restricted server keys for each variable instead.

The smart itinerary generator does not call Google Maps Platform. Google usage happens only when someone uses destination autocomplete, explicitly searches the map for nearby places, or displays a route. API restrictions and project-level monitoring remain necessary because Google Maps Platform quotas and billing belong to the Google Cloud project, not to Git commits.

For cost safety, create a small billing budget alert, review Maps Platform usage regularly, and reduce any adjustable project quotas. Budget alerts notify you but do not provide a guaranteed spending cap. Disabling the APIs or billing is the only absolute stop, and it also disables the associated map features.

`NEXT_PUBLIC_GOOGLE_JSMAP_API` is intentionally sent to browsers, so its website and API restrictions are essential. The three server keys must not use the `NEXT_PUBLIC_` prefix.

### Important Places API compatibility note

The preserved application calls the legacy Places endpoints at `maps.googleapis.com/maps/api/place/...`. Google placed those services in Legacy status on March 1, 2025, and does not make Legacy services available to new Cloud projects. Therefore, a brand-new Google Cloud project can supply Maps JavaScript and Routes, but its new Places key will not make the current Places requests work.

After this clean migration is reviewed, choose one of these paths:

- Recommended: authorize a focused code migration from Places API (Legacy) to Places API (New), then use the new server key described above.
- Temporary compatibility path: if an original contributor owns a Cloud project where Places API (Legacy) was already enabled, ask them to grant or transfer authorized project access. Create a new restricted key there; do not copy their old key. This depends on contributor permission and keeps a legacy dependency, so it is not the long-term choice.

The application code has not been changed in this migration because the request was to reproduce it faithfully before redesign or API migration.

## 4. Google sign-in

1. In the same Google Cloud project, configure the Google Auth Platform/consent screen.
2. Choose the audience that matches your use. If the app remains in testing, add your Google account as a test user.
3. Create an **OAuth client ID** with application type **Web application**.
4. Add this authorized redirect URI for local use: `http://localhost:3000/api/auth/google/callback`.
5. Put the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Set `REDIRECT_URI=http://localhost:3000/api/auth/google/callback`.
7. After Vercel assigns a domain, add `https://YOUR_DOMAIN/api/auth/google/callback` to the OAuth client and use that exact URL as Vercel's `REDIRECT_URI`.

For local development, the OAuth client must be a **Web application** with:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`

The redirect URI must match exactly, including protocol, port, capitalization, and path. After changing `.env.local`, stop and restart `npm run dev`. TravelEase now reports a clear configuration message when the client ID or secret is missing and verifies the OAuth state cookie on callback.

## 5. Password-reset email

1. Choose an email provider that offers SMTP credentials.
2. Verify the sender address or domain required by that provider.
3. Create a dedicated SMTP credential; do not use your normal mailbox password.
4. Enter the provider's hostname, port, username, password, and verified sender in `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM`.
5. The current mail transport uses STARTTLS-style configuration (`secure: false`), which is normally paired with port 587. If your provider requires implicit TLS on port 465, a small code change will be required before using it.
6. Test the forgot-password flow with an account and inbox you control.

## 6. Run locally

```bash
npm ci
npm run dev
```

Test sign-up, login, logout, Google sign-in, password reset, destination search, nearby places, route display, saving a trip, loading trips, and deleting a trip.

## 7. GitHub and Vercel

The reviewed migration has been initialized as a new repository with small logical commits and no connection to the original repository's history. Its `origin` target is `https://github.com/aad-h/travel-ease.git`.

On a machine authenticated with write access to that repository, publish it with:

```bash
git push -u origin main
```

Then deploy:

1. Push the reviewed clean repository to GitHub.
2. In Vercel, choose **Add New → Project** and import `aad-h/travel-ease`.
3. Vercel should detect Next.js. Leave the project root as the repository root, install command as `npm ci`, build command as `npm run build`, and output setting as the Next.js default.
4. Add every variable from `.env.example` under **Project Settings → Environment Variables**, using production values. Set production `REDIRECT_URI` to the exact HTTPS callback URL.
5. Add the Vercel domain to the browser Google Maps key's website restrictions and the Google OAuth client's authorized redirect URIs.
6. Ensure MongoDB Atlas network access permits connections from the deployment while retaining a strong least-privilege database credential.
7. Deploy, then repeat the feature checklist from the local test section.

If you later attach a custom domain, update the Maps website restriction and OAuth redirect URI again before testing authentication.

## Official references

- [MongoDB Atlas connection prerequisites and connection flow](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [Google Maps Platform API-key security guidance](https://developers.google.com/maps/api-security-best-practices)
- [Google Maps Platform legacy products and availability](https://developers.google.com/maps/legacy)
- [Google OAuth web-server redirect URI requirements](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Vercel Git repository deployment](https://vercel.com/docs/git)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)

## External dependency inventory

| Service | Variables | Purpose |
| --- | --- | --- |
| MongoDB Atlas | `MONGODB_URI` | Users, password-reset tokens, and trips |
| Application auth | `JWT_SECRET` | Signs seven-day application tokens |
| Google Maps Platform | `GOOGLE_MAP_API`, `GOOGLE_PLACES_API`, `GOOGLE_ROUTES_API`, `NEXT_PUBLIC_GOOGLE_JSMAP_API` | Autocomplete, place details, nearby places, routes, and map UI |
| Google OAuth 2.0 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIRECT_URI` | Google login and callback |
| SMTP email | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Password-reset email |
| Vercel | all variables above | Hosting and production configuration |

The source contains no OpenAI client or `OPENAI_API_KEY` reference. Add an OpenAI key only if a future feature actually uses it.
