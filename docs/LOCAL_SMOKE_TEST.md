# Local smoke test

Use this checklist after changing TravelEase or its environment variables.

## Start the app

```bash
npm ci
npm run dev
```

Open <http://localhost:3000> in a browser. Keep the terminal visible so server
errors are easy to identify.

## Basic checks

1. Create a test account with synthetic data, then sign out and sign back in.
2. If Google OAuth is configured, test the Google sign-in button and confirm it
   returns to the dashboard.
3. Visit <http://localhost:3000/api/check-connection> and confirm it reports a
   successful MongoDB connection.
4. Create a trip with a destination, dates, at least one interest, and a test
   budget. Confirm the generated itinerary and saved trip appear.
5. Search for nearby places, open a place link, and verify that route display
   works when places have coordinates.
6. Delete the synthetic trip and confirm it disappears after a refresh.

## Automated checks

Run these from the repository root:

```bash
npm test
npx tsc --noEmit
npm run build
```

Do not paste `.env.local`, API keys, database URLs, cookies, or password-reset
links into issue reports. Share only the redacted error message and the step
that failed.
