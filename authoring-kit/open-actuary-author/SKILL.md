---
name: open-actuary-author
description: Create original syllabus-led interactive actuarial courses and lessons in Open Actuary, with rigorous teaching, purposeful experiments, practice, preview and draft submission. Use for substantive learning-content creation, not ordinary actuarial calculations or cosmetic website edits.
---

# Author a learning experience in Open Actuary

The standalone workspace is https://open-actuary.subasj02.workers.dev, with its OAuth-protected MCP endpoint at `/mcp`. Use its connected tools and verify `studio_overview` reports author access before writing. If both the original ChatGPT Site and standalone connections are present, select the standalone connection for new work unless the user explicitly identifies the original Site. If the standalone connection is absent, deliver a portable draft and explain how to connect it; do not silently upload to the old Site.

Make the intended understanding explicit before selecting a component. Preserve serious textbook-quality explanations and assessment while using interaction to reveal something a static explanation makes difficult.

Start with the connected Open Actuary tools `studio_overview`, `get_authoring_contract`, and `get_course`. The live contract defines the supported format; read it before creating a document. If the Site is not connected, use the included [format and operating guide](references/workflow.md), create a portable draft package and clearly report that it has not been uploaded or previewed online. Do not claim that local file creation updated the Site.

Read [the teaching design standard](references/teaching-standard.md) when planning a course or a new lesson. For a new custom interaction, also read [the interaction design brief](references/interaction-brief.md). Existing actuarial-textbook guidance remains the foundation for explanation quality; the hosted contract is sufficient to route a connected AI without access to local skills or the research books.

## Produce and verify

1. Establish exact syllabus edition, audience, prerequisite capabilities and bounded scope. Split compound objectives into performance atoms and label partial coverage. Do not invent a complete or current exam alignment from historical material.
2. Plan the dependency-led sequence, conceptual bottlenecks and assessment evidence. Select reading, worked reasoning, experiment and practice for a purpose. Do not impose a fixed number of widgets or identical chapter lengths.
3. Write complete original learning episodes with defined notation, assumptions, justified mathematical or causal development, examples and interpretation. Use new contexts/data/question reasoning, not a passage-by-passage rewrite of a source book.
4. Use a built-in lab only when its actual mathematical model matches the lesson. Read the contract's fixed-model descriptions. For a different need, create a self-contained widget; do not force a new topic into an unrelated built-in slider. Supply a prediction, explanatory debrief, static equivalent, transfer task and concrete behavior checks.
5. Include independent questions and separate solutions. Map every substantive criterion to earlier teaching or an explicitly indexed prerequisite. A changed context should test transfer, not secretly require a new method. Mark the model answer and confirm the non-overlapping criteria attain full credit.
6. Save with `expectedRevision`, validate, and repair actual errors. Use `preview_lesson` to obtain the real preview URL, then inspect it in the browser and exercise its controls, boundaries, reset, keyboard route, narrow-screen layout and fallback. Structured inspection alone is not visual verification. If browser access is absent, preserve that limitation in the review status.
7. Independently verify claims and numeric outputs, then obtain an independent bounded review when authorized and useful. Save the draft and concrete review evidence; use `open-actuary-review` for a full review pass. Publish only within the user's requested scope, using `open-actuary-publish`.

## Output

A completed unit is actual prose, examples, interaction implementation and assessment—not a proposed outline or UI sketch. Deliver its stable course/lesson IDs, saved revision, preview URL, scope and checked/unchecked items. If working offline, deliver an importable `open-actuary` v1 package and the verification record.

Do not require a paid AI API key: the AI in the current conversation is the author. Do not add a simulated “AI generation” button or imply the Site is autonomously checking mathematical truth.
