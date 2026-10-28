---
name: open-actuary-publish
description: Save, preview, review, publish, export or restore Open Actuary course content using its connected tools, with revision-safe draft/live separation. Use for content operations; changes to Site hosting or audience use the Sites workflow.
---

# Operate the Open Actuary content workspace

The standalone workspace is https://open-actuary.subasj02.workers.dev, with its OAuth-protected MCP endpoint at `/mcp`. Use its connected tools and verify `studio_overview` reports author access before writing. If both the original ChatGPT Site and standalone connections are present, select the standalone connection for new work unless the user explicitly identifies the original Site. If the standalone connection is absent, deliver a portable draft and explain how to connect it; do not silently upload to the old Site.

Use `studio_overview` and `get_authoring_contract` from the selected Open Actuary connection. The verified owner can write; readers see published snapshots. Use `get_course`/`get_lesson` before each update and preserve stable IDs. Never invent the current revision or overwrite a conflict.

Read [the publication workflow](references/publication-workflow.md) for new content, revisions, restore, import/export and the distinction between library publication and public Site access.

Complete authorized draft work and checks before publication. Publication is a separate explicit action requiring a current review record. Do not turn a request to draft into publication, or a request to publish reviewed content into making the entire Site public. Conversely, do not add another conversational approval when the user has already requested this exact publication and the actual revision is reviewable and checked.

Report the real course/lesson ID, draft/published revisions, preview or reading URL and material verification limits. Local output is not upload, a successful save is not publication, and a private library publication is not public internet access.
