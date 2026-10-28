# Publication and recovery workflow

## Create/update

Read the live authoring contract and existing document. `save_course` and `save_lesson` require the complete document and `expectedRevision`. Zero means a new ID only. On a conflict re-read and merge deliberately; do not blindly retry with a newer number. Save a bounded lesson, add its ID to the appropriate course chapter, validate and inspect the actual preview.

## Review/publish

Use an actual completed review with exact `revision`, named reviewer/process, level and concrete evidence under technical/pedagogy/interaction/accessibility/originality. Resolve material concerns rather than omitting them. Never claim expert or learner evidence that did not occur.

Publish the reviewed course outline first when adding a new lesson or objective. The outline requires its lesson records to exist but does not publish their drafts. Then publish each explicitly requested reviewed lesson at the expected revision. Every lesson objective must exist in the published course, and the lesson must be listed in that outline.

Check the returned published revision and then read the student URL/state. Further saves modify only drafts, invalidating their review while preserving the published content and its original review. Do not change Site access to bypass a content or author-role failure.

## Recovery and portability

Use `list_revisions` and inspect the intended history. `restore_revision` creates a new draft with a new revision; live content stays unchanged. Review it before republishing. Course export contains original text, blocks, self-contained widget code and review provenance; it omits credentials and learner notes. Import is draft-only and refuses an ID collision. Review claims from another package do not transfer approval.

For a disconnected agent, deliver a portable JSON package and explain it has not reached the Site. To bring it online, use the connected import tool or the author studio's import control. Do not recreate a Site for a content update: stored content changes do not need application redeployment.

## Public access

Publishing inside the learning library and making the hosting Site public are distinct. Sites controls the outer audience; the app separately protects authoring with verified identity. Use the Sites skill and native access tools only when a hosting/audience change is requested. Keep draft previews private even if student reading becomes public later.
