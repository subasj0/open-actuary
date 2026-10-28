# Operations

## Availability and budgets

All chosen components fit Cloudflare's published Free allowances. The API connection cannot read account Billing subscriptions, so the pre-existing account's paid/free subscription state was not independently confirmed. No subscription change or purchase was made. Other Workers share the daily allowance.

Watch Workers request/CPU errors and D1 rows read/written/storage in the Cloudflare dashboard. Investigate when usage approaches 70% of a quota; the Free plan can reject requests once a hard limit is reached. The app has no paid SLA. A successful smoke check does not prove global latency or long-term availability.

Daily cleanup deletes only expired sessions, OAuth tokens/codes/refresh tokens, challenges and rate-limit buckets. It is housekeeping, not an artificial keepalive. Course and learner records are not deleted by cleanup.

## Backup and restore

D1 Free has seven days of Time Travel. Before a major content edit, export the course in the author studio or with `export_course`. Portable exports contain drafts, widgets and review provenance, not learner notes or account secrets.

After authenticating Wrangler, an administrator can export the full database:

```sh
npx wrangler d1 export open-actuary --remote --output <private-backup-path.sql>
```

Full backups contain learner notes and identity metadata: store them privately, encrypted, and outside Git. Routine course exports do not replace database backups. Keep external snapshots for retention beyond seven days. No automatic external backup destination has been configured.

To recover an application release use Cloudflare Worker version rollback. To recover teaching use the studio's immutable revision restore, which creates a new draft and invalidates its review. To recover data after broad corruption use D1 Time Travel after exporting the current state. Do not restore the entire database just to undo a lesson edit.

## Deployment

The private GitHub repository has CI checks and an explicit manual deployment workflow. Populate `CLOUDFLARE_API_TOKEN` before using the latter. It is intentionally not an unauthenticated deployment service. The initial deployment used the Cloudflare connector; its OAuth credentials cannot be copied into GitHub Actions.

Database migrations are recorded in `d1_migrations`, including the initial remote migration. Future content changes should use MCP/API rather than editing seed SQL. Preserve package-lock.json and pin dependencies. Test framework/runtime upgrades against official documentation and local integration checks.

## Security and recovery

Never grant author status based on a display name, email claim, request-supplied identity header, or imported JSON. Author invitation is single-use and is never served as a static asset. Browser sessions cannot authenticate MCP; OAuth bearer tokens are bound to the MCP resource. Author tokens permit the entire content workflow, so grant them only to trusted clients.

Account recovery invalidates old device sessions, passkeys and authoring tokens. It requires the saved secret recovery code; without a passkey or recovery code the operator must perform an explicit verified account-recovery process. This app does not offer an email reset shortcut.

Keep the original ChatGPT Site until owner drafts/history and any desired learner migration are confirmed. No original Site data, audience setting, or deployment was changed by this transition.
