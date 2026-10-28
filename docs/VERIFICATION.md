# Verification record · 28 October 2026

- TypeScript check and production build passed.
- Nine mathematical/content/progress unit tests passed.
- Eight local content integration scenarios passed: author separation; same-origin writes and draft privacy; exact-revision review/publication; draft/live separation; stale/concurrent saves; restore/history; draft-only imports; signed-in notes; course unpublication hiding lessons.
- Software-authenticator WebAuthn tests passed locally and against the deployed app: user-verified registration/sign-in, challenge replay rejection, account recovery/code rotation, private progress, reader restrictions, and rejection of spoofed old ChatGPT identity headers. The deployed disposable test reader and its data were removed.
- Local OAuth integration passed: registration, consent role check, exact callback validation, PKCE, authorization code replay rejection, authenticated MCP, resource-bound tokens, rotating refresh and token revocation.
- Browser inspection of the hosted app confirmed course catalogue, CS1 course/lesson navigation, math rendering, live sampling lab output updates, and the independent account page.
- Two published outlines and four lessons were migrated with original published revision numbers and review provenance. Original educational text was not re-reviewed or newly endorsed by this hosting migration.
- All three updated local authoring skills passed the skill validator.

Limits: human-owner passkey enrollment and real ChatGPT personal-plugin installation/consent are not automated. Old unpublished drafts, old revision history, and old learner identities have not yet been migrated. A small HTTP timing sample is recorded in hosted-smoke.json; it includes a slow outlier and is not a load test or SLA. Existing Cloudflare billing subscriptions were inaccessible to the OAuth connector. GitHub's production-deployment token and an external backup destination are not configured.
