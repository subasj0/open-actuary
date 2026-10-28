# Open Actuary operating contract

Live Site: https://actuary-learning-studio.docile-bay-3047.chatgpt.site

Use the Site-created personal plugin in ChatGPT or Codex. The authoritative format is returned by `get_authoring_contract`; supported tools are discoverable from the same connection. No AI API key is required. In ChatGPT, use the personal plugin rather than assuming Codex filesystem skills are automatically installed there.

## Documents

A Course has `id,title,subject,edition,description,scopeNote,objectives:[{id,description}],chapters:[{id,title,lessonIds}]`.

A Lesson has `id,courseId,title,subtitle,minutes,prerequisites,outcomes,objectiveIds,scopeNote,blocks,summary,coverage,provenance,technicalNotes`. `prerequisites`, `outcomes`, `objectiveIds`, `summary`, and `technicalNotes` are arrays of non-empty strings (including when there is only one entry). `blocks` and `coverage` are arrays of objects; `provenance` and `scopeNote` are strings. Minutes is a positive number and an editorial estimate. Each coverage row has `objective,teaching:[block IDs],practice:[question IDs]` and optional `note`.

IDs are stable lowercase slugs of 2–80 characters. Objective IDs preserve the supplied syllabus; explicitly labelled partial atoms are allowed. Block IDs are unique within a lesson. Read a saved document's `revision` before updating, and supply it as `expectedRevision`; use zero only for creation.

Every block has `id,type` and optional `objectives`. Types:

- `heading`: `text,level` (2 or 3).
- `prose`: `text`; blank lines create paragraphs, `$...$` renders inline TeX, `**...**` adds emphasis.
- `callout`: `text,title?,tone?` (`idea`,`warning`,`definition`).
- `math`: `tex,explanation` (a plain-language reading is required).
- `table`: `headers:[strings],rows:[[strings]],title?`.
- `worked`: `title,steps:[{title,text,why?}]`.
- `question`: `questionKind,prompt,solution,taughtIn`, optional `hints` and objective tags. `choice` needs `options,correct` (zero-based) and `feedback` per option. `numeric` needs finite `answer` and non-negative `tolerance`, optional `unit`. `written` needs `rubric:[{text,marks,taughtIn}]`.
- `lab`: `labKind` (`sampling`,`coverage`,`testing`), `title,purpose,prediction,debrief,fallback,transfer`. Consult the fixed-model brief.
- `widget`: same teaching fields plus self-contained `html,height,checks`.
- `image`: `src,alt,title?`, with HTTPS or base64 PNG/JPEG/WebP. Use original assets.

`taughtIn` references earlier non-question blocks or an explicitly indexed prerequisite such as `prerequisite:0`. A schema-valid link is a claim to audit, not proof the criterion was taught.

## Draft to publication

1. Create/read the course; save an original bounded lesson as a draft. Add its ID to a chapter in the course draft.
2. Validate and inspect the actual lesson preview. Fix substantive issues and independently verify calculations.
3. Record actual review evidence for the exact course revision, then publish its outline. The listed lessons must exist; they can still be drafts.
4. Review each exact lesson revision and publish explicitly. All lesson objectives must exist in the published parent outline, which must list the lesson ID.
5. Further draft saves do not change the live snapshot, its review or learner version. Restoring creates a new draft and invalidates that draft's review.

A review has `revision,reviewer,level` (`pilot` or genuinely `expert-reviewed`), `checks:{technical,pedagogy,interaction,accessibility,originality}` (specific evidence for each), and `unresolved:[]`. Do not clear real concerns merely to get through the gate. Structural validation cannot certify mathematics or teaching quality.

## Offline handoff

If not connected, write a JSON package with `format:"open-actuary",formatVersion:1,course:<Course>,lessons:[<Lesson>]`. The studio imports it as drafts, refusing to silently overwrite existing IDs. Imported review claims do not become approvals. A local file is not an uploaded lesson; report the actual state. Save source files and test results so another agent can inspect them.

The Site stays private until its owner deliberately changes Site access. Publishing a lesson inside it and making the entire Site public are separate operations. Owner authorization is enforced server-side even if learners eventually receive read access.
