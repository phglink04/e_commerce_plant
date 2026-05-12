# PlantWorld Frontend (Next.js + TypeScript)

This folder is a new frontend baseline that keeps PlantWorld direction and adds auth flow inspired by hotel-management.

## Included auth features

- Login
- Register
- Forgot password
- Reset password
- Verify account
- Google login placeholder (wire NextAuth callback later)
- Turnstile placeholder field (replace with real widget)

## Routes

- /
- /auth/login
- /auth/register
- /auth/forgot-password
- /auth/reset-password
- /auth/verify-account
- /dashboard

## Environment

Copy `.env.example` to `.env.local` and fill values.

## Run

```bash
npm install
npm run dev
```

## Notes

- API paths currently use PlantWorld backend conventions where possible.
- Verify account endpoint is set to `/api/auth/verify-account` and may need backend adjustment.
- Middleware currently reads `auth_token` cookie; current login stores localStorage token. You can switch to cookie-based token in next step.
