# TravelEase development checklist

## Before a change

- Keep `.env.local` private and never commit credentials.
- Run `git status --short` before editing.
- Keep changes focused and preserve the existing application behavior.

## Local verification

```bash
npm run dev
npx tsc --noEmit
npm run build
curl http://localhost:3000/api/check-connection
```

Use synthetic accounts and data while developing locally.
