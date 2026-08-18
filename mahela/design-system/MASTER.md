# MahELA — Design System (Master)

Source of truth for building any new MahELA screen. Read this first; check
`design-system/pages/<page>.md` for page-specific overrides before writing
code. Everything here reflects what's actually implemented in
`assets/css/base.css` / `components.css` / `animations.css` — not aspirational
targets.

Generated with `ui-ux-pro-max` after a full accessibility + RTL pass on
v1.5.0 (see `CHANGELOG.txt`). Token values below are the corrected ones
(post contrast-fix commit `07c17c0`).

---

## 1. Color

All colors are CSS custom properties on `:root`, redefined under
`[data-theme="dark"]`. Never hardcode a hex value in a component — reference
the token so dark mode and future palette tweaks stay free.

### Brand palette

| Token | Hex | Role |
|---|---|---|
| `--c-pink` | `#F478B0` | Brand primary |
| `--c-orange` | `#FFA934` | Warning / accent |
| `--c-teal` | `#00A0B5` | Secondary accent |
| `--c-yellow` | `#FFEF5A` | Highlight |
| `--c-green` | `#98C54E` | Success |
| `--c-ink` | `#14044F` | Ink — deep indigo, theme-stable (does **not** flip in dark mode) |

### Semantic tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#F478B0` | same | Primary actions, active nav |
| `--brand-strong` | `#E85C99` | same | Hover state for `--brand` |
| `--accent` | `#00A0B5` | same | Secondary buttons |
| `--accent-strong` | `#00838F` | same | Hover state for `--accent` |
| `--success` / `--success-strong` | `#98C54E` / `#7CA83A` | same | Positive status |
| `--warning` | `#FFA934` | same | Caution status |
| `--highlight` | `#FFEF5A` | same | Rare, sparing use only |
| `--bg` | `#FBF9FC` | `#0F0A2E` | Page background |
| `--surface` | `#FFFFFF` | `#1A1345` | Cards, modals |
| `--surface-soft` | `#F5F1F9` | `#221A54` | Nested/inset surfaces |
| `--border` | `#EAE3F2` | `#322A66` | Hairlines |
| `--ink` | `#14044F` | `#F3F0FB` | Primary text — **flips** with theme |
| `--ink-soft` | `#5C5480` | `#B7ADD9` | Secondary text |
| `--ink-faint` | `#766B9E` | `#8880AC` | Tertiary/meta text, icons |

`--c-ink` vs `--ink`: use `--c-ink` (not `--ink`) for anything that must stay
dark in *both* themes — e.g. the toast background, or a gradient anchor.
Using `--ink` there is the exact bug fixed in commit `07c17c0` (toast text
went invisible in dark mode because `--ink` turns near-white there).

### Contrast rule (non-negotiable)

**Text/icons on any brand color use `--ink`, never white.** `--ink` clears
WCAG AA (≥5.5:1) against every brand color; white fails on all of them
(1.9–3.3:1). This was the root cause of six contrast failures fixed in
`07c17c0` — don't reintroduce `color: #fff` on a colored background without
recomputing contrast first.

```
ink on --c-pink        7.03:1
ink on --c-teal         5.77:1
ink on --brand-strong   5.54:1
ink on --c-orange       9.46:1
ink on --c-green        8.99:1
```

### Per-student gender accent

Set `data-gender="female"` (default) or `data-gender="male"` on an ancestor
(student card, profile header) to scope `--student-accent`,
`--student-accent-strong`, `--student-accent-soft` — reuses the same brand
colors (pink family / teal family), never introduces a new color.

---

## 2. Typography

| Token | Stack | Used for |
|---|---|---|
| `--font-display` | `'Baloo 2', 'Vazirmatn', sans-serif` | Headings, brand wordmark, numeric stats |
| `--font-body` | `'Plus Jakarta Sans', 'Vazirmatn', sans-serif` | Body text, UI labels |
| `--font-mono` | `'IBM Plex Mono', 'Vazirmatn', monospace` | Clock, currency figures |

In `html[dir="rtl"]` all three collapse to `'Vazirmatn'` — it's the only
stack with full Persian glyph support and matching weights (400–800).

**Scale in use** (no formal step system — pick the closest existing value,
don't invent a new one): `9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14,
14.5, 15, 15.5, 16, 17, 18, 24, 26` px. Body copy sits at 13.5–15px; card/
stat values at 17–26px; meta/label text at 9–12.5px.

Google Fonts import (already in every page's `<head>`):
```html
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## 3. Spacing, radius, shadow

| Token | Value |
|---|---|
| `--radius-sm` | 11px |
| `--radius-md` | 16px |
| `--radius-lg` | 24px |
| `--radius-pill` | 999px — buttons, badges, tabs |
| `--shadow-sm` | `0 2px 12px -4px rgba(20,4,79,.10)` |
| `--shadow-md` | `0 16px 36px -16px rgba(20,4,79,.22)` |
| `--shadow-lg` | `0 28px 64px -20px rgba(20,4,79,.30)` |
| `--shadow-glow` | `0 8px 24px -6px rgba(244,120,176,.45)` — primary CTA only |

Layout constants: `--sidebar-width: 264px`, `--topbar-height: 72px`,
`.container { max-width: 1240px }`.

Spacing itself isn't tokenized (no `--space-*` scale exists) — component
rules use literal px values in the 3–34px range. If you add one, pick from
values already in use rather than a new arbitrary number.

---

## 4. Layout & breakpoints

Three breakpoints, mobile-first isn't used — everything is desktop-default
with max-width overrides:

| Breakpoint | What changes |
|---|---|
| 1080px | Data-table columns start collapsing |
| 960px | Sidebar becomes an off-canvas drawer (`.sidebar-toggle` appears) |
| 780px | Grids drop to single column; `.container` padding tightens |
| 640px | `.page-body` padding drops to 20px |

**Always use logical CSS properties**, never `left`/`right`/physical
`margin-left` etc.: `inset-inline-start/end`, `margin-inline-start/end`,
`padding-inline`, `border-inline-end`, `border-end-start-radius`. This is
why the RTL layout has zero mirroring bugs (see step-3 review) — keep it
that way. The **two** exceptions that need a manual `html[dir="rtl"]`
override are things logical properties can't express:

1. `transform: translateX(...)` (toggle switch thumb, mobile sidebar
   slide-in) — flip the sign in a `html[dir="rtl"]` rule.
2. Directional wayfinding icons (arrows that point somewhere) — give them
   `class="icon-flip-rtl"`, already wired to
   `html[dir="rtl"] .icon-flip-rtl { transform: scaleX(-1); }` in
   `base.css`. Content icons (clock, search, checkmark, chart) don't need
   this — only icons whose *meaning* is directional.

---

## 5. Motion

- Global `:focus-visible { outline: 2.5px solid var(--accent); outline-offset: 3px; }`
- `@media (prefers-reduced-motion: reduce)` is respected globally — don't
  add an animation without checking it degrades under this query.
- Standard transition timing: 150–300ms, `ease`.
- `.btn` and card hovers use `transform: translateY(-2px)` + shadow swap,
  not scale — keep new interactive elements consistent with this.

---

## 6. Components — patterns to reuse, not reinvent

### Buttons (`base.css`)
`.btn` + one of `.btn--primary` (brand fill), `.btn--accent` (teal fill),
`.btn--ghost` (outlined), `.btn--soft` (tinted), plus `.btn--small` /
`.btn--large` / `.btn--icon` / `.btn--danger-ghost`. All solid variants use
`color: var(--ink)` per the contrast rule above.

### Forms
Wrap every field in `.form-field`: a `<label for="...">` + matching `id` on
the `<input>/<select>/<textarea>`. **Every field needs this pairing** — it
was 100% missing pre-review (fixed in `cad0f14`) and is now the expected
pattern for anything new. Checkbox/toggle labels that *wrap* their input
don't need `for`/`id` (implicit association already works).

Client-side validation: add `data-validate="email"` or `data-validate="phone"`
to an input and call `window.mahtelaValidate.validateForm(formEl)` on
submit — shared logic in `app.js`, don't duplicate it.

### Modals
Structure: `.modal-overlay > .modal-box > .modal-box__head > h2.modal-box__title`
+ `button.modal-box__close[data-modal-close]`. Trigger with
`[data-modal-open="<id>"]`. `app.js`'s `initModals()` automatically wires
`role="dialog"`, `aria-modal`, `aria-labelledby`, focus-on-open,
Escape-to-close, focus-trap, and focus-restore-on-close — **you get this for
free from the shared structure, don't hand-roll modal JS.**

### Tabs
Structure: container with `data-tabs="<group>"`, buttons with
`data-tab-btn="<group>" data-tab-target="<id>"`, panels with
`data-tab-panel="<group>" data-tab-id="<id>"`. `app.js`'s `initTabs()`
wires the full WAI-ARIA Tabs pattern (roles, `aria-selected`, roving
tabindex, arrow-key nav mirrored for RTL) automatically — again, don't
hand-roll.

### Toasts
Call `window.mahtelaToast(message, iconSvg?)` — already announces via
`role="status" aria-live="polite"`.

### Icon-only buttons
Always pair `title="..."` with `aria-label="..."` using the same string —
`title` alone is not a reliable accessible name.

### Status badges
`.badge--status-active/restricted/suspended` use a *tinted background +
matching strong-color text*, not a flat brand-color fill — this is already
the accessible pattern (don't replace with white-on-color).

---

## 7. Internationalization (i18n)

Two languages: `en` / `fa`, driven by `assets/js/i18n.js` +
`data-i18n="<key>"` attributes, flipping `<html lang dir>`. Rules:

- Add every new user-facing string as an `{ en, fa }` pair in the shared
  dict — never hardcode English text with no `data-i18n` key.
- **Don't reuse a translation key across an adult context and a child
  context.** `gender_female/gender_male` (`دختر`/`پسر` — "girl"/"boy") are
  correct for student records but wrong for an adult's own account —
  that's why `account_gender_female/account_gender_male` (`زن`/`مرد`)
  exists separately for `settings.html`. Follow that split for any new
  age-sensitive string rather than collapsing back to one key.
- Numbers/phone numbers/emails stay LTR even inside an RTL page — don't
  wrap them in anything that would pick up `dir="rtl"`.

---

## 8. Accessibility checklist for new screens

Copy this into any new page's PR description:

- [ ] Every `<label>` has `for="id"` matching its field's `id` (or wraps it)
- [ ] Every icon-only control has `aria-label` (not just `title`)
- [ ] Any new modal uses the shared `.modal-overlay > .modal-box` structure
      (gets ARIA + focus management for free — don't rebuild it)
- [ ] Any new tab group uses the shared `data-tabs` structure
- [ ] No `color: #fff` on a brand/status color — use `var(--ink)`, verify
      ≥4.5:1 if introducing a *new* color
- [ ] New directional icons get `.icon-flip-rtl` if their meaning depends
      on direction (arrows, chevrons) — not if they're content icons
- [ ] Tested in both `EN`/`FA` and both light/dark before calling it done
- [ ] Respects `prefers-reduced-motion` if it adds any animation
- [ ] Responsive at 375 / 640 / 780 / 960 / 1080 / 1440px

---

## 9. What's still mocked (don't build against it as if real)

Per `README.txt`: login/auth, all "Create/Add/Save" actions, password
reset emails, and most Schedule/Finance/Messages content are UI-only
simulations with no backend yet. See `README.txt`'s WordPress mapping
section for how each screen is meant to become real (CPTs, capabilities,
`wp_mail()`, etc.) — new screens should be built with that mapping in mind
so the eventual backend swap is straightforward.
