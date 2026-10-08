# ADR-0005: BEM classes and two-level design tokens

**Status:** accepted · 2026-10-08

## Context
Hand-written CSS for a whole product can drift quickly: one-off colours, deep selectors, specificity fights.

## Decision
- `styles/tokens.css` is the only file that contains raw colours: first a brand palette (`--brand-*`), then semantic tokens (`--color-*`, `--space-*`, `--ring` …) that components use.
- Each CSS file holds one BEM block (`block`, `block__element`, `block--modifier`), and the file is named after the block.
- Cascade layers fix the order: `tokens, base, layout, components, pages`. The order is declared in a file that loads before everything else.
- Stylelint enforces it all: `selector-bem-pattern`, `color-no-hex` outside tokens, strict values for colour, font, shadow and z-index, no IDs, no `!important`.

## Consequences
- Changing the palette, or adding dark mode later, only touches `tokens.css`.
- Some markup carries extra classes (for example `quote-document__term` instead of a bare `dt` selector), in exchange for flat, predictable specificity.
