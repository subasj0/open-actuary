---
name: open-actuary-review
description: Review an Open Actuary learning unit for mathematical correctness, syllabus coverage, explanation quality, assessment alignment and purposeful accessible interaction before publication. Use for substantive educational review, not cosmetic website QA alone.
---

# Review the actual learning experience

The standalone workspace is https://open-actuary.subasj02.workers.dev, with its OAuth-protected MCP endpoint at `/mcp`. Use its connected tools and verify `studio_overview` reports author access before writing. If both the original ChatGPT Site and standalone connections are present, select the standalone connection for new work unless the user explicitly identifies the original Site. If the standalone connection is absent, deliver a portable draft and explain how to connect it; do not silently upload to the old Site.

Read the live `get_authoring_contract`, the course's edition/scope and the saved lesson. Use [the review protocol](references/review-protocol.md). Where available, use the actuarial-textbook teaching blueprint and open-actuary-author teaching standard as foundations; do not need the research books.

Separate automated structure validation from technical, pedagogical and browser evidence. Inspect the actual artifact and independently solve representative tasks. Record exactly what was checked and what remains unknown. An AI review must not be labelled qualified human expert review.

Block publication for wrong core claims, missing required performances, invalid exercises/solutions, materially misleading assumptions or inaccessible essential teaching. Ask for a bounded repair rather than adding unrelated scope. Do not invent defects, learner data, browser results or an ActEd-equivalence score.

When a repair changes a draft, re-read its new revision and recheck affected dependencies. A review applies to one revision. Return specific block IDs, severity, the learner consequence and a concrete repair. Use `record_review` only when the actual completed evidence supports all declared checks and no material concern remains; otherwise leave the draft and report the unresolved work.
