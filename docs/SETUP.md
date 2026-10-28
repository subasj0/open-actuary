# Owner and ChatGPT setup

## Activate your independent author account

Open the one-use invitation in the local `private/owner-setup.md` file provided with the deployment. It is intentionally excluded from this repository. Choose your account name, create a passkey using your device's fingerprint/face/screen lock, and save the recovery code in your password manager. Add a second passkey from Account. The invited account receives the author role; a normal public signup receives reader access only. An email address or account name cannot claim ownership.

For a new installation, generate a cryptographically random one-use invitation, store its SHA-256 hash in `author_invites`, and deliver `/account?invite=<invitation>` privately. Do not commit or email it casually. There is no default password or public owner-bootstrap endpoint.

## Connect ChatGPT

1. In ChatGPT on the web, open Plugins → plus → Add custom MCP server.
2. Name it **Open Actuary Standalone**.
3. Enter **https://open-actuary.subasj02.workers.dev/mcp**.
4. Select OAuth with dynamic client registration. The server advertises the registration and token endpoints; it uses public-client authentication (`none`) and PKCE S256.
5. Complete the Open Actuary sign-in and consent screen using your invited author account, then install the resulting personal plugin. If ChatGPT asks for a client ID/secret, choose dynamic registration rather than static credentials.
6. Ask: “Use Open Actuary Standalone. Read studio_overview and get_authoring_contract. Show the courses and author status.” Confirm author access and that preview URLs point to `open-actuary.subasj02.workers.dev`.

The original “Open Actuary · Learning Studio” Site plugin is a separate connection and separate database. Reconnecting it with maahijoshi58@gmail.com permits export of unpublished source drafts/history; connecting the new plugin does not reconnect the old one.

## Create and edit

Use the `open-actuary-author`, `open-actuary-review`, and `open-actuary-publish` skills from `/authoring-kit.zip`. Installed local Codex copies now prefer the independent connection. For ChatGPT, the MCP authoring contract carries the content format; you can also add the kit's Markdown instructions to a ChatGPT project.

Example brief: “Create an original syllabus-led course in Open Actuary Standalone. Read the authoring contract, plan scope and prerequisites, save bounded lessons as drafts, preview and test them, and leave publication for my review.”

For editing: “Read course <id> and lesson <id>, revise the explanation, preserve stable IDs, save using expectedRevision, preview and review the new revision, and keep the live lesson unchanged until I ask to publish.”

When satisfied, request publication of the reviewed revision. Course outline publishes first when it adds new lessons or objectives. Review claims from imported packages are not treated as new approval. Never substitute an application deployment for content publication.

## Account limitations

The deployed account system uses passkeys and recovery codes, not email/password. There is no email verification, reset email, payment subscription, or billing integration. Learners can read all published lessons anonymously and save progress locally, or sign in for server sync. Existing Site learner records are not automatically migrated. Passkeys belong to the deployed hostname: choose a long-term custom domain before accumulating many users if you intend to change it.

## Verification boundary

The server-side WebAuthn and OAuth flows passed automated integration checks, including the deployed account flow. Installing the new personal plugin and consenting from the human owner's account remain manual user actions; no successful real ChatGPT connection is claimed until those are completed.

Official setup reference: https://developers.openai.com/api/docs/guides/custom-mcp-server
