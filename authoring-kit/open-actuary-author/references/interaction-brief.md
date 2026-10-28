# A brief for an original interactive learning block

Before code, fill this compact brief in the author record:

1. **Learning bottleneck:** what is hard to understand, and which objective requires it?
2. **Why interaction:** what can a learner discover by acting that a static explanation makes harder?
3. **Model and truth:** variables, units, assumptions, permitted ranges, equations and independently checked cases.
4. **Student route:** prediction, first meaningful action, visible change/invariant, explanation and fresh transfer.
5. **UI:** labelled keyboard controls; one coherent visual representation; no decorative motion; reset; displayed state and model assumptions.
6. **Equivalent reading route:** essential explanation and representative results without executing code or relying on color.
7. **Checks:** correct inputs/outputs, boundaries, invalid inputs, reset, repeated actions, browser console, small screen, keyboard/focus and reduced motion.

## Built-in labs: actual model boundaries

- `sampling`: iid means from Normal(10, 4²), exponential(mean 10), or Bernoulli(0.3). Users vary n and the number of repeated samples. The normal overlay uses theoretical moments. It is exact for the normal population and approximate otherwise.
- `coverage`: 50 independent normal sample means with true μ=100 and known σ=20. Users vary n, confidence level and random batch. Intervals use normal quantiles. No unknown-variance/t, bootstrap or real data claim.
- `testing`: known-variance normal sample mean with μ₀=100 and σ=20. Upper or two-sided alternative, observed mean, n, α and a hypothetical alternative for power. The latter changes power, not observed p.

Do not silently reinterpret these fixed populations as different models. A different model should use a bespoke widget or a deliberately implemented platform enhancement.

## Custom widgets

A `widget` block contains self-contained HTML/CSS/JS, height 240–1000, purpose, prediction, debrief, fallback, transfer, checks and objective tags. It runs in an opaque-origin iframe with scripts enabled and same-origin/forms/popups/top-navigation capabilities withheld. Script/data/asset network requests are restricted by CSP; bundle small original assets inline. It cannot access host account records or publishing tools. Do not include secrets or expect a server-side dependency to work.

Use `window.lessonBridge.reportState({...})` to expose concise, non-sensitive inspectable results and `resize(height)` to request bounded height. Messages do not execute parent actions or confer completion. The parent verifies the sending frame before displaying state. Report runtime problems visibly and preserve the static explanation.

Test an actual rendered instance. Listing tests or declaring a widget “verified” does not run them. If unavailable, say browser verification remains incomplete and leave a draft/review limitation.

## Verify the visual comparison

When a control is meant to demonstrate a change in spread, width or magnitude, check that automatic rescaling does not cancel that change visually. Use a shared/locked comparison scale or a persistent reference where useful; if the scale must expand, disclose that fact and keep all values visible. Inspect labels at the actual narrow-screen rendered size, not only their SVG font-size attribute. Verify that lesson anchors reach the intended explanation without resetting the active experiment.
