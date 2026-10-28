# Teaching standard for an interactive actuarial course

## The non-negotiable educational result

A learner should be able to identify the problem, represent it, justify a method, execute it, check it, interpret it, and adapt when assumptions or context change. Not every definition needs all seven acts. The course must develop the appropriate acts across the required scope.

The design principles derive from our analysis of historical actuarial materials, but new authors do not need those books. Use the syllabus as a performance contract, establish technical substance independently, and create new expression and examples. Recurring design patterns are hypotheses about teaching usefulness; no particular style guarantees commercial-course learning outcomes.

## Transform a syllabus into a learning contract

Record the awarding body, subject, exact edition/source, audience, prerequisites, and requested scope. A syllabus is a scope specification, not a complete technical authority. When depth or a current exam arrangement is uncertain, obtain the relevant official document instead of inventing it. For evolving software, consult its current official documentation before deciding implementation details.

For each objective, record the action, mathematical/commercial object, assumptions and conditions, prerequisite capability, evidence of independent performance, and exclusions. Split compound objectives. Preserve official IDs; use clearly labelled editorial sub-IDs for partial components. A reference to 3.3.1 does not mean a lesson teaches all the error, power, likelihood-ratio and other concepts listed under it.

Build a graph of prerequisites before a contents list. Teach a concept when dependencies make it intelligible, while retaining a syllabus-to-teaching map. Group chapters around coherent capabilities and explicit revisits. Weights do not mechanically determine page counts or interaction counts.

In each lesson, every declared atom needs substantive teaching and an independent learner task. Merely mentioning a term or showing an answer is insufficient. Conversely every major section should serve an atom, a stated prerequisite, integration, or explicitly optional enrichment.

## Carry the difficult transition

Start from the learner's present representation. Explain what is new: a random count, a conditional quantity, a valuation date, an observation mechanism, an alternative stakeholder objective. Name the object before compressing it into notation.

At first use define symbols, units, domains, indices, conditioning and conventions. Distinguish random variables from observations, estimators from realised estimates, intensity from probability, cashflow dates from rate periods, and a forecast from a decision. Do not expect an advanced topic to make unfamiliar notation self-evident.

For a derivation, state the target and why the starting tool fits. Explain each conceptual step—conditioning, independence, a cash account, an inequality rearrangement or a limit. Avoid both unexplained algebra jumps and pages of routine manipulation. State hypotheses, approximation status, result domain and an independent check. Show a boundary or countercase that would defeat a tempting blind recipe.

Use the representation that removes the inference burden: timeline for timing, state diagram for transitions, table for observation/exposure, plot for distributions, or a stakeholder mechanism for a commercial decision. Explain how to read it. A diagram or animation that simply repeats a heading does not earn its space.

## Design an interaction as an experiment

Write an experiment card before implementation:

- **Target:** the exact misunderstanding or capability.
- **Learner action:** predict, construct, vary, sort, diagnose or compare.
- **Model:** equations, assumptions, allowed parameter domains and meaningful boundary cases.
- **Observation:** what changes on screen and what remains invariant.
- **Explanation:** the causal or mathematical reason for the change.
- **Transfer:** a fresh task the student should now be able to do.
- **Static equivalent:** the essential insight and at least one representative numerical/visual result in readable form.
- **Verification:** independent numeric cases, reset/state behavior, keyboard operation, narrow view and failure fallback.

Prefer no interaction when a short explanation is clearer. Do not add sliders for quantities with no meaningful range or force learners through clicks that only uncover ordinary prose. An interactive result must not silently overclaim exactness, causality, probability or practical importance.

A good pattern is predict → manipulate → observe → reconcile with theory → explain without controls. A single beautiful simulation does not teach assumptions. State whether displayed data are synthetic, a random simulation, an analytic model or an empirical dataset. Label finite-sample variation and approximations.

Choose bespoke interfaces freely when the learning need warrants them: a cashflow timeline students construct; risk-set membership from event histories; a path through a transition graph; a loss-variable case split; a model-diagnosis puzzle; a stakeholder tradeoff; an estimator comparison. The three supplied statistical labs are examples, not the limits of the content system.

## Examples, practice and feedback

Design each example around its purpose and likely misconception. Show the problem representation and method choice before calculation. Use clean inputs for a new step; introduce messiness when it serves the next capability. Reuse an original dataset locally to reduce context load, then change representation or assumptions in independent practice.

Fade responsibility appropriately: fully worked reasoning, a completion task, independent near transfer, then a changed problem. This is a useful pattern, not a mandatory four-exercise quota. Provide error-specific hints rather than generic encouragement.

For numerical tasks, specify units, rounding/tolerance and an explained solution. For written tasks, identify distinct creditworthy mechanisms, case linkage, alternatives and marks. Map each criterion to a teaching block or `prerequisite:0` etc. Mark the actual model answer to check that full credit is attainable without double counting.

Feedback belongs after an intentional attempt/reveal. Do not claim that revealing a solution demonstrates understanding. A student's self-reported reading completion is not assessed mastery. Include a readiness route: which mistake sends the learner back to which explanation?

## Chapter, course and medium

A lesson opening gives purpose, outcomes, prerequisites and scope. The body develops a coherent sequence of episodes rather than alternating generic text and random widgets. The closing summary helps reconstruct relationships and conditions; it should introduce no new required technique. Provide cumulative and unfamiliar tasks across chapters, with bridges explaining why the next capability is now possible.

Use a calm, adult tone; avoid “obvious” at the difficult step. Use semantic headings, consistent notation, readable line lengths, keyboard controls, visible focus, text alternatives and reduced-motion behavior. Do not use color alone to distinguish outcomes. Provide a table or a textual explanation of essential plots.

The web medium should add understanding without making access fragile. Essential teaching should remain readable if a custom script fails or the learner cannot manipulate a graph. Avoid externally hosted dependencies for a self-contained widget. Keep text and datasets exportable.

## Review and evidence

Separate scope review, technical review, teaching/assessment review, interaction/accessibility review, and originality/provenance review. Recompute by a fresh method where useful; inspect a boundary and a plausible wrong solution. An automated schema check verifies structure and declared links, not the truth or adequacy of the explanation.

Block publication for wrong core claims, missing required capability, invalid exercises/solutions, materially misleading assumptions, inaccessible essential material or false official alignment. Resolve material concerns before marking a review complete. Use pilot unless qualified expert review actually occurred. State absent learner, expert or browser validation honestly.

For realistic forward-tests, give a fresh author the recipe and syllabus only, excluding the reference books, prior outputs and reviewer diagnoses. Inspect actual artifacts, make narrow changes supported by demonstrated failures, and retest without giving away the repair. Agent-only success does not establish learner outcomes; representative student pilots remain the next kind of evidence.

## Audit the performance the prompt actually elicits

For each declared outcome, list the learner actions and point to the question wording that requests each action. A p-value printed in a solution to a z-only question is not independent p-value practice; a simulation critique does not by itself assess stating a theorem and its assumptions. Check the prompt with the solution hidden. Include a concise reconstruction or complete application when required, rather than adding repetitive exercises. Define a newly assessed concept such as covariance before using its notation in a rubric.
