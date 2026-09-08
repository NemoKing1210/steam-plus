# DESIGN.md — Steam Plus visual rules

This file is the single source of truth for how Steam Plus UI looks and
behaves. Follow it for every change that adds, moves, or restyles injected
elements: the settings button, the settings panel, its controls, and the
translation UI. When in doubt, reference the Steam client and the sibling
`steam-gamestatus` userscript — the design language below is derived from
both.

## 1. Philosophy

- **Steam-native, not skin.** Injected UI must look like Steam built it:
  dark `#1b2838`-family surfaces, Motiva Sans, 2px corners on controls,
  hairline black borders with a faint white inner highlight, Steam blue
  (`#66c0f4`) as the only accent. Never invent a parallel palette (no
  flat-blue “modern” gradients, no purple, no bright white cards).
- **Ride Steam's own chrome where possible.** For surfaces Steam already
  renders (the account dropdown), reuse Steam's classes and DOM placement
  (`popup_menu_item` inside `#account_dropdown .popup_body.popup_menu`)
  instead of styling our own look-alike. Own-styled UI is only for shells
  Steam does not provide (panel, header fallback button).
- **Every injected class is prefixed `sp-`.** Never add an unprefixed class
  to our own elements, and never style an unprefixed selector. Exception:
  reusing a native Steam class (`popup_menu_item`) on an element we inject
  into Steam-owned DOM — that element must also carry our own `sp-` class.
- **Never outshine the page.** No decorative gradients, emoji, drop-shadow
  art, or animations Steam wouldn't use. Motion is short and subtle.

## 2. Color tokens

All colors live as custom properties in `src/styles/tokens.css` and are
consumed through `var(--sp-*)` in `src/styles/app.css`. Values below are the
Steam palette; do not hardcode raw hexes in component CSS.

| Token | Value | Use |
|---|---|---|
| `--sp-accent` | `#66c0f4` | active states, focus rings, accent borders/underline |
| `--sp-accent-soft` | `#67c1f5` | hover tint of the accent |
| `--sp-accent-deep` | `#417a9b` | bottom edge of accent gradients |
| `--sp-bg-1` | `#1b2838` | panel surface (top of gradient) |
| `--sp-bg-2` | `#16202d` | panel surface (bottom of gradient) |
| `--sp-bg-deep` | `#0e141b` | sunken wells: previews, position pickers, code |
| `--sp-field` | `#316282` | select/input fill (Steam form control) |
| `--sp-field-active` | `#3d7a9c` | select/input fill on focus |
| `--sp-text` | `#c7d5e0` | body text |
| `--sp-text-strong` | `#ffffff` | headings, active tab, hovered text |
| `--sp-text-muted` | `#8f98a0` | secondary text, hints, inactive tabs |
| `--sp-success` | `#a4d007` | positive states (cracked badge, active dot) |
| `--sp-danger` | `#c45c5c` | destructive buttons/errors |
| `--sp-border` | `#000000` | hard borders (Steam outline style) |
| `--sp-line` | `rgba(255,255,255,0.1)` | soft dividers |
| `--sp-highlight` | `rgba(255,255,255,0.04)` | inner top highlight on raised surfaces |

Rules of thumb:

- Borders are black (`#000`), not blue or gray. Soft separation inside
  surfaces uses `--sp-line`.
- Raised cards/sections get a 1px black border plus
  `inset 0 1px 0 var(--sp-highlight)`.
- Text on colored gradient buttons is white with
  `text-shadow: 0 1px 1px rgba(0,0,0,.3)`.

## 3. Typography

Font stack is always Motiva Sans first:

```css
font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
```

| Element | Spec |
|---|---|
| Panel title | 14px / 700 / `--sp-text-strong` |
| Tab labels, section captions | 11px / 700 / uppercase, `letter-spacing: .04em` |
| Switch labels | 13px / `--sp-text` |
| Field labels | 10px / 700 / uppercase, `letter-spacing: .04em` / `--sp-text-muted` |
| Descriptions, hints, subtitles | 11–12px / `--sp-text-muted` |
| Buttons | 12px / 700 |
| Small counters/pills/version | 9–11px / 700 |

## 4. Surfaces and chrome

- **Overlay** (`.sp-panel-overlay`): `position: fixed; inset: 0`, center the
  panel, `background: rgba(0,0,0,.72)`, generous padding. Z-index above every
  Steam and injected layer that must not receive clicks (`1000000`).
  Visibility is the `hidden` attribute (`.sp-panel [hidden]` forces
  `display: none`); the page behind is scroll-locked by pinning `<body>`
  with scrollbar compensation (`sp-modal-open`) while wheel/touch events
  outside the panel body are swallowed.
- **Panel** (`.sp-panel`): vertical flex column,
  `width: min(560px, 100%)`, `max-height: min(90vh, 760px)`,
  `overflow: hidden`, background `linear-gradient(180deg, var(--sp-bg-1),
  var(--sp-bg-2))`, 1px black border, radius 3px,
  `box-shadow: 0 16px 48px rgba(0,0,0,.65), inset 0 1px 0
  var(--sp-highlight)`.
- **Panel header**: flex, `justify-content: space-between`, bottom black
  border, background
  `radial-gradient(120% 80% at 0% 0%, rgba(102,192,244,.18), transparent
  55%), linear-gradient(90deg, #1a2332, var(--sp-bg-1))`. Sticky inside the
  panel. Contains title + version chip + muted subtitle on the left, ×
  close button on the right.
- **Tab strip**: bottom black border, subtle `rgba(0,0,0,.18)` background,
  tabs flexed equally; the active tab gets white text plus a sliding
  2px `--sp-accent` indicator (`.sp-panel__tabs-indicator`, glides via
  `transform`/`width` transitions, repositioned on open/switch/resize).
  A tab may carry a pill badge
  (`.sp-panel__tab-badge`, `--low/--mid/--high` tones). The incoming pane
  slides in from the travel direction (14px, `≈ .22s`) while its direct
  children fade in with a short stagger (up to `≈ .16s` delay) unless
  reduced motion is requested.
- **Panel footer**: sticky bottom bar with a top black border over a
  translucent black wash. Actions right-aligned: destructive Reset pinned
  left via `margin-right: auto`, then Cancel (ghost) and Save (accent).
  Footer buttons persist a draft, never live state — see §5.
- **Sections/cards** inside the scrollable pane: 1px black border,
  `background: rgba(0,0,0,.22)`, `inset 0 1px 0 var(--sp-highlight)`,
  radius 3px, padding `12px 14px`. Section captions are uppercase accent
  text (see Typography), rows stack beneath with ~8–12px gaps; separate
  sibling rows inside one card with `--sp-line` hairlines only when the
  grouping is long (5+ items).
- **Scrollbars** in the pane: thin, `scrollbar-color: #417a9b transparent`.

## 5. Components

Keep every control Steam-shaped: 2px radius, black hairline border, inner
highlight where raised.

### Buttons (`.sp-button`)
- Default: vertical gradient `--sp-accent-soft → --sp-accent-deep`, white
  bold text + text-shadow, `box-shadow: 0 0 0 1px rgba(0,0,0,.4)`,
  min-height 28px, radius 2px. Hover: `filter: brightness(1.08)`.
- `--secondary` / `--ghost`: neutral ghost gradient (`#3d4450 → #2c313a`).
- `--green`: positive gradient (`--sp-success → #536904`), e.g. for
  confirm-style actions.
- `--danger`: red gradient (`#c45c5c → #8a3030`).
- Never use flat-filled or outline-only buttons as primary actions.
- Panel footer semantics: Reset is `--danger`, Cancel is `--ghost`,
  Save is default accent. Footer buttons work on a draft: controls mutate
  an in-memory copy opened with the panel; Save persists it in one
  `saveSettings()` call and notifies features via the bus, Cancel/overlay
  click/`Escape` discards it, Reset refills the draft with defaults
  (still requiring Save).

### Fields (`.sp-field`)
Vertical stack: 10px uppercase muted label (`.sp-field__label`) above the
control, optional hint (`.sp-hint`) underneath. Fields compose sections;
do not place two controls side by side in one field.

### Switch (`.sp-switch`)
Steam toggle: 34×18px rounded track on a black-bordered dark well; off knob
gray `--sp-text-muted`, on track `linear-gradient(to bottom, --sp-accent,
--sp-accent-deep)` with a white knob translated 16px. Real `<input
type="checkbox">` visually hidden inside the label, followed by the
visible text (`.sp-switch__label`). Hover brightens the track; the on
state adds a soft accent glow. A master switch sits in a
`.sp-toggle-row` with an ON/OFF `.sp-pill` on the right: dark well with
muted text when off, `#1b3708` fill with `#beee11` text and a green border
when `.is-on`.

### Select (`.sp-select`)
Steam form control: fill `--sp-field`, 1px black border,
`inset 0 0 0 1px rgba(255,255,255,.05)`, height 30px, radius 2px, font
inherited; focus swaps fill to `--sp-field-active` and adds a 1px
`--sp-accent` ring. Don't restyle the native dropdown arrow.

### Segmented options (`.sp-segmented`)
Full-width two-option well (`--sp-bg-deep` + inner highlight, 30px rows)
with icon + label per option and a sliding thumb
(`.sp-segmented__thumb`): soft accent fill, `--sp-accent` inset ring and
a faint glow that glides between options via `transform`/`width`
transitions (repositioned on select, open and window resize). The active
option gets white text with a soft accent glow — never a solid blue
block; press feedback is a subtle `scale(0.97)`.

### Switch grid (`.sp-switch-grid`)
Two-column grid of Steam switches with 12px `--sp-text` labels for
on/off lists (e.g. translation scopes). Checkboxes are not used anywhere
in the panel — every boolean is a switch.

### Settings button — account dropdown
When Steam's account dropdown is in the DOM, our entry is a native
`<a id="sp-settings-btn" class="popup_menu_item sp-menu-item">` appended to
`#account_dropdown .popup_body.popup_menu`; Steam styles it, we only add
cursor/hover polish. Label: `menu.settings` (`Steam Plus: settings`).

### Settings button — header fallback (`.sp-header-btn`)
Used when there is no account dropdown (logged-out store/community or before
the dropdown exists): compact Steam-blue gradient button in `#global_actions`
— 24px tall, radius 2px, `--sp-accent-soft → --sp-accent-deep`, white bold
11px text with text-shadow, 1px black ring, label `Settings · Steam Plus`
+ status dot. The dot turns `--sp-success` and glows
when any setting differs from defaults. While the panel is open the button
takes `.is-open` (green gradient); the account-dropdown entry takes
`.is-open` in accent text instead. Hide the text label under 900px.

### Cache tab (`.sp-cache-*`)
Storage meter: large fill-percentage number (accent/amber/red by
`--low/--mid/--high` tone), used-bytes line, segmented bar with one tone
per provider plus a free remainder, and a legend with per-provider counts
and sizes. Stored entries collapse behind a toggle showing the entry
count; each row shows truncated source text, target language and size
with a ghost × removal button. The clear-cache section pairs a danger
button with a hint and a live success status line.

### Toasts (`.sp-toasts` / `.sp-toast`)
`showToast({ type, icon, title, message, duration, key, onClick, actions })`
from `src/ui/toast.js`. Card with icon, title, message and optional
actions — no side accent border, type is carried by the icon and
progress-bar colors; icons are overridable. Position follows settings
(`bottom/top` × `right/left` corners, mirrored entrance on the left);
the auto-hide default comes from settings too, and disabled toasts make
`showToast` a no-op.
`key` dedups: a visible toast with the same key is refreshed instead of
stacked (used for repeated failures like rate-limits). At most three
toasts stay on screen, older ones are evicted; timers pause on hover and
a thin progress bar shows the remaining time (`duration: 0` pins a toast
until dismissed). Whole-toast click plus per-action buttons (`primary /
ghost / danger` tones, small 24px Steam buttons); errors use
`role="alert"`, others `role="status"`. `z-index: 1000002`, excluded
from content scans.

### Confirm dialog (`.sp-confirm`)
Promise-based modal above the panel (`z-index: 1000001`):
`confirmDialog({ title, message, confirmLabel, cancelLabel, tone })`
resolves `true`/`false`. Narrow `400px` card with title, message and
right-aligned actions (ghost cancel + danger/primary confirm). Closes
on confirm, cancel, overlay click and `Escape`; focuses the safe choice
(cancel for `danger` tone) and restores focus on close. A second call
settles the first one with `false`, so only one dialog is ever open.
`.sp-confirm-overlay` is excluded from content scans like the panel.

### About tab (`.sp-about`)
Hero row (product name + version chip), one-line blurb, author card
(bordered wash, name + handle, accent name on hover), ghost repo button,
hint with source pointers.

### Translation UI (`.sp-translate-btn`, `.sp-translation`)
Inline per-block control: icon + label in translucent accent fill
(`rgba(103,193,245,.2)`) with a 1px `--sp-accent` border and accent text;
hover raises fill and text to white; error state swaps accent for the danger
red. While loading, the globe icon swaps for a CSS ring spinner
(`.sp-translate-btn__spinner`) beside the short loading label. Buttons
lead the block they control: the default (`--above`) and the compact
`--replace` variant sit on their own line above the text, not below it.
A target may dock the button elsewhere via `placeButton` (`--actions`
variant: marginless, vertically centered — e.g. at the start of the review
Yes/No/Funny/Award row). Buttons stay hidden (`--pending`) until near
the viewport. Result box:
translucent accent wash, 3px accent left border, rounded right corners.

Translations keep the original layout (`.sp-translation-rich`): content is
split into blocks (paragraphs, headings, list items) translated separately
while links, images, embeds, line breaks, emoji and code keep their nodes.
Below mode renders a structural mirror of the source — same headings,
link targets, lists (`.sp-translation__list`) and media, with `lang` set to
the target language; replace mode swaps each block's content in place so
the page structure never changes, and toggling back (or tearing down)
restores the original DOM from a snapshot. Translated links keep the
accent color with an underline, images scale to the box width, and code
keeps the sunken `--sp-bg-deep` well styling.

## 6. Motion

- Defaults: `transition: color .15s ease, border-color .15s ease` etc.
- Pane switch: directional slide (14px horizontal, `.22s ease-out`) +
  staggered fade of pane children; tab indicator glide (`.22s ease`).
- Respect `prefers-reduced-motion: reduce` — drop animations/transitions for
  our UI (Steam content keeps its own behavior).
- A settings page should never look “busy”: one coordinated entrance at
  a time, no loops, no bounce.

## 7. Focus and accessibility

- Keyboard-focusable elements must show a visible focus state:
  `outline: 1px solid var(--sp-accent); outline-offset: 2px` on
  `:focus-visible`.
- The panel overlay is a modal dialog: `role="dialog"`, `aria-modal`,
  close on `Escape` and on overlay click, scroll-lock the page behind it.
- Buttons/links carry `aria-label`/`title` when their visible content is
  not descriptive enough (e.g. the × close, icon-only header button).
- All text passes contrast on the dark palette: body `--sp-text` on panel
  surfaces ≥ 7:1-ish; never use `--sp-text-muted` for essential info.

## 8. Do / don't

- DO prefix every injected class with `sp-`; DO use the tokens from
  `tokens.css`.
- DO place new UI inside existing containers (`#global_actions`,
  `#account_dropdown`) using Steam's own layout rather than floating
  elements with absolute positioning.
- DO keep translated output and settings UI out of the scan pipeline:
  classes listed in `isOwnUi()`/the observer filter stay in sync when UI
  classes change.
- DO add every new user-facing string to all ten locale files (see
  AGENTS.md → Localization).
- DON'T introduce a second visual language for one-off features; extend this
  file first.
- DON'T add unprefixed classes, decorative comments, or non-English
  comments/code.
- DON'T style Steam's own elements globally; scope selectors to our
  classes and to Steam classes only on elements we own
  (`#sp-settings-btn.popup_menu_item`, never bare `.popup_menu_item`).
- DON'T imply Valve affiliation in copy or chrome.

## 9. Changing the design

Any visual change must keep DESIGN.md and the actual stylesheet in sync:
update the token table and component specs in the same change that touches
the CSS, then rebuild (`npm run build`) and eyeball the result on a real
Steam page in both placements of the settings button (account dropdown and
header fallback).
