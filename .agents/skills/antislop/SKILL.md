---
name: antislop
description: Core filter and delivery gate framework to eliminate generic AI tropes, cookie-cutter layouts, and robotic copywriting.
---

# Anti-Slop Core Filter & Delivery Gate

This skill enforces strict standards against statistical LLM averages, template clichés, and robotic outputs.

## Rule Tiers

### 1. Hard Gates (Non-Negotiable Absolute Prohibitions)
- **R-01 (Color & Gradients):** Prohibit generic blue-to-purple / neon gradients, glowing borders, or ungrounded neon accents unless explicitly tied to documented brand guidelines.
- **R-02 (Copywriting / Em Dash Ban):** Strictly ban the em dash (`—`) in UI text, headings, metadata, and code comments. Use standard punctuation instead (commas, colons, parentheses, or periods).
- **R-03 (Responsive Layout):** Never permit horizontal scroll overflow, text overflowing boundaries, or touch targets smaller than 44px.
- **R-04 (Iconography Clichés):** Forbid generic contextless sparkles, magic wands, or orbs as decorative filler. Icons must have direct semantic utility.
- **R-25 (Contrast & Accessibility):** Ensure all text achieves minimum WCAG AA contrast (>= 4.5:1 for body, >= 3:1 for large text).

### 2. Purpose-Gates (Forbidden Without Concrete Functional Rationale)
- **R-06:** Large monospace uppercase with wide letter-spacing without functional context.
- **R-07:** Decorative background blueprints, graph paper, or dot grids without product identity necessity.
- **R-08:** Decorative directional arrows (`->` / `->`) on ordinary buttons without sequential step flows.
- **R-09:** Overused glassmorphism (frosted glass) across multiple UI surfaces simultaneously.
- **R-10:** Heavy unmotivated floating drop shadows on every card.
- **R-15:** Robotic AI buzzwords ("AI Powered", "Seamless", "Revolutionary", "Cutting Edge"). Keep copy natural, specific, and human.

### 3. Quality Locks & Code Craftsmanship (`antislop-code`)
- Eliminate robotic narrator comments that merely restate obvious variable names.
- Prevent monolithic God-components by modularizing concerns.
- Remove redundant boilerplate and unneeded dependencies.

## Delivery Gate
Before finalizing any task, verify that all Hard Gates and Purpose-Gates PASS without violation.

