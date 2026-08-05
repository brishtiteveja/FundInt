# Funding Agent

An interactive fundraising workspace with 127 investors from the current Eddy Austin directory snapshot, synchronized map/list/table views, a persistent application calendar, and a real local Hermes agent bridge.

## Run locally

```bash
npm install
npm run dev -- --port 4173
```

The app detects the installed `hermes` CLI. Agent runs use its existing OpenAI Codex authentication in isolated `--safe-mode` with only the non-destructive `todo` toolset enabled.

## Email sessions

Local development returns a six-digit code in the sign-in dialog. The code is still hashed in the local server store and exchanged for an HttpOnly, SameSite session cookie.

For real email delivery, configure:

```bash
RESEND_API_KEY=...
FUNDING_AUTH_FROM="Funding Agent <login@your-domain.com>"
FUNDING_AUTH_SECRET=...
```

User-scoped memory, reports, plans, and applications live under `.funding-agent/`, which is ignored by Git.

Google sign-in, Google Calendar OAuth, and Claude subscription execution remain explicit follow-up integrations. The current static Sites worker serves the client only; hosted authentication requires a persistent server or Worker database binding.

## Verify

```bash
npm test
npm run build
```
