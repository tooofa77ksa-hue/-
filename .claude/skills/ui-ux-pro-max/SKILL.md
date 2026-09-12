---
name: ui-ux-pro-max
description: Senior product-designer-level guidance for full UI/UX work — not just visual polish. Covers usability heuristics, information architecture, interaction design, accessibility (WCAG AA), responsive behavior, UX writing/microcopy, and a repeatable audit → plan → build → validate process. Use whenever the user asks for a UI/UX review or redesign, wants a screen or flow "to feel more professional/polished/usable," reports that something is "confusing," "hard to use," "ugly," or "not accessible," or asks to design a new screen, form, dashboard, or user flow end to end. Complements the frontend-design skill (which focuses on aesthetic distinctiveness) by covering the usability, structure, and accessibility half of the job.
---

# UI/UX Pro Max

Work this the way a senior product designer would inside a real team: someone
who owns both how a screen looks and whether people can actually use it
without friction. Visual taste and usability are not separate jobs — a
beautiful screen that confuses users, and an accessible screen that looks
generic, are both incomplete work.

## Step 1: Understand the job before touching pixels or code

Before proposing anything, answer these for yourself (and state them back to
the user if any are unclear):

- **Who** uses this screen/flow, and in what state (rushed, first-time,
  expert, distracted, on a phone in bad light)?
- **What decision or task** are they trying to complete here? A screen
  exists to move someone from one state to the next — identify that
  transition precisely.
- **What happens if they fail** — do they lose data, retry, get stuck, or
  abandon the flow? Design the recovery path, not just the happy path.
- **What already exists** — read the current component library, design
  tokens, and any brand/identity guide in the repo before inventing new
  patterns. Reusing an existing pattern correctly beats inventing a
  visually nicer one-off.

If the request is vague ("make this better"), don't guess silently — form a
concrete hypothesis about what's wrong (confusing hierarchy? too many steps?
poor contrast? unclear error states?) and confirm it, or say what you're
optimizing for, before rebuilding.

## Step 2: Information architecture and flow

Before layout or color, get the structure right — it's the most expensive
thing to fix later:

- Map the flow as a sequence of screens/states, including error, empty,
  loading, and success states. A flow that only shows the happy path in a
  mock is not done.
- Group related actions and information by how users think about the task,
  not by how the backend models the data.
- Minimize the number of decisions and fields per step. Every optional field
  or rarely-used action is a candidate to move behind progressive
  disclosure (an "advanced" section, a secondary screen) rather than sitting
  in the primary path.
- One primary action per screen. If there are two calls to action competing
  for attention, decide which one the screen exists for, and demote the
  other visually (secondary button style, or move it elsewhere).

## Step 3: Interaction design

- Give every interactive element a visible state for default, hover, focus,
  active, and disabled — don't rely on cursor changes alone.
- Feedback must be immediate and proportional: a click that triggers a
  network call needs a pending state within ~100ms perceived response, not
  a frozen button. A destructive action needs confirmation proportional to
  its cost (typing a name to confirm deletion of something important;
  a plain confirm dialog for something reversible).
- Never make people re-enter information the system already has, or redo a
  multi-step task because of a validation error found only at the end —
  validate inline, as early as the flow reasonably allows, with the error
  message next to the field it concerns.
- Keep interactive targets large enough to hit reliably (≈44×44px minimum on
  touch), with enough spacing that adjacent targets aren't mis-tapped.
- Respect platform/browser conventions for things users have muscle memory
  for (back button behavior, form submission on Enter, escape closing a
  modal) unless there's a specific reason to break them.

## Step 4: Visual system

Once structure and interaction are right, build the visual layer as a small
token system rather than one-off values, so the screen reads as one
coherent product:

- **Color**: a base palette (background, surface, border, text-primary,
  text-secondary) plus a small number of semantic colors (accent,
  success, warning, danger) — each with enough contrast against its
  background to pass Step 5's contrast checks. Don't invent a new accent
  color per screen.
- **Type**: one clear type scale (not ad hoc font-sizes scattered through
  the code) with defined weights for heading/body/label/caption roles.
- **Spacing**: a consistent spacing scale (e.g. 4/8px increments) applied
  uniformly — inconsistent gaps between similar elements are one of the
  fastest ways a screen reads as unpolished.
- **Elevation/borders**: pick one visual language for separating content
  (borders vs. shadows vs. background-tint) and use it consistently rather
  than mixing all three across a page.
- For genuinely distinctive/marketing-facing design work (landing pages,
  brand moments), pull in the `frontend-design` skill for aesthetic
  direction — this skill's visual guidance targets clear, consistent
  product UI, not brand expression.

## Step 5: Accessibility is not optional

Treat WCAG 2.1 AA as the floor for anything shipped, not an aspirational
checklist:

- **Contrast**: body text ≥4.5:1, large text (≥24px or ≥19px bold) ≥3:1
  against its background. Check this for real, don't eyeball it.
- **Keyboard**: every interactive element must be reachable and operable via
  keyboard alone, in a logical tab order, with a visible focus indicator
  (never `outline: none` without a replacement).
- **Semantics**: use real buttons/links/form elements and heading levels
  instead of styled `div`s, so screen readers and browser features (find,
  reader mode, zoom) work. Label every form field and icon-only control
  (`aria-label` at minimum).
- **Motion**: respect `prefers-reduced-motion`; don't rely on motion, color,
  or icon shape alone to convey meaning (add text/label backup).
- **Text scaling and zoom**: layouts should not break or clip content at
  200% browser zoom or larger user font sizes.

## Step 6: UX writing

Words are part of the interface, not decoration on top of it:

- Name things the way the user thinks about them, not how the system is
  built internally.
- Buttons and actions describe exactly what will happen ("Delete group" not
  "Confirm"), and the vocabulary stays identical from trigger to result
  (a button labeled "Publish" produces a "Published" confirmation, not
  "Saved").
- Error messages say what happened and what to do next, in plain language,
  without blaming the user or apologizing performatively.
- Empty states explain what belongs there and how to add it, rather than
  just showing blank space or "No data."
- If the product is localized (e.g. Arabic-first UIs), verify RTL layout
  mirrors correctly (icon direction, alignment, number/date formatting) —
  don't assume an LTR-built layout mirrors automatically.

## Step 7: Responsive and real-device validation

- Design and test at actual breakpoints, including a narrow phone width —
  don't just shrink the browser window and eyeball it.
- Content and controls should reflow (stack, wrap, resize) rather than
  clip, overlap, or force horizontal scrolling of the whole page.
- Where the project has a running app, load the real changed screen in a
  browser (not just a static mock) and click through the golden path and at
  least one error/edge case before calling the work done — matches this
  repo's general standard of testing UI changes live rather than only
  reviewing code.

## Step 8: Self-critique before calling it done

Run this checklist against your own work, honestly:

- Can someone unfamiliar with the product complete the primary task without
  guidance, on the first try?
- Does every screen have a defined loading, empty, error, and success state?
- Would this pass a contrast checker and a keyboard-only pass?
- Is there exactly one visual language for hierarchy (not three competing
  systems for emphasis: bold AND color AND size AND a badge, all on the
  same element)?
- Did you reuse existing components/tokens where they already covered the
  need, instead of introducing a near-duplicate?

If a finding surfaces here, fix it before presenting the work — don't ship a
known usability or accessibility gap and mention it as a caveat instead.
